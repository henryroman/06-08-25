import type { APIRoute } from 'astro';
import { createCustomer, createAppointment } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('=== BOOKING API CALLED ===');
    
    const { name, email, phone, appointmentType, date, time } = await request.json();
    
    console.log('Booking data:', { name, email, phone, appointmentType, date, time });
    
    if (![name, email, phone, appointmentType, date, time].every(Boolean)) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ success: false, message: 'All fields are required' }), 
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get service details
    const svc = siteConfig.appointments.types.find(t => t.name === appointmentType);
    if (!svc) {
      console.log('Invalid service type:', appointmentType);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid service type' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Service found:', svc);

    // Create customer (only if Notion is configured)
    let customer;
    let customerId = null;
    
    if (process.env.NOTION_CUSTOMERS_DB_ID && process.env.NOTION_TOKEN) {
      try {
        console.log('Creating customer in Notion...');
        customer = await createCustomer({
          'Customer Name': name,
          Email: email,
          'Phone Number': phone,
          'Customer Type': 'New Client'
        });
        customerId = customer.id;
        console.log('Customer created successfully:', customerId);
      } catch (error) {
        console.log('Customer creation failed, continuing with appointment:', error.message);
      }
    } else {
      console.log('Notion not configured - skipping customer creation');
    }

    // Create appointment (only if Notion is configured)
    let appointment;
    let appointmentId = null;
    
    if (process.env.NOTION_APPOINTMENTS_DB_ID && process.env.NOTION_TOKEN) {
      try {
        console.log('Creating appointment in Notion...');
        const iso = `${date}T${time}`;
        appointment = await createAppointment({
          Appointment: `Appointment for ${appointmentType}`,
          'Client Name': name,
          'Phone Number': phone,
          'Service Type': appointmentType,
          Date: iso,
          Duration: String(svc.duration),
          Price: svc.price,
          Status: 'pending'
        });
        appointmentId = appointment.id;
        console.log('Appointment created successfully:', appointmentId);
      } catch (error) {
        console.log('Appointment creation failed:', error.message);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to create appointment: ' + error.message }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Notion not configured - simulating appointment creation');
      // Simulate appointment creation when Notion is not configured
      appointmentId = `simulated_${Date.now()}`;
    }

    console.log('=== BOOKING COMPLETED SUCCESSFULLY ===');
    console.log('Customer ID:', customerId);
    console.log('Appointment ID:', appointmentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointmentId: appointmentId,
        customerId: customerId,
        message: 'Appointment booked successfully!',
        details: {
          name: name,
          service: appointmentType,
          date: date,
          time: time,
          duration: svc.duration,
          price: svc.price,
          storedInNotion: !!(process.env.NOTION_APPOINTMENTS_DB_ID && process.env.NOTION_TOKEN)
        }
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('=== BOOKING API ERROR ===', e);
    return new Response(
      JSON.stringify({ success: false, message: e.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
