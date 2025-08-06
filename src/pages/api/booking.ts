import type { APIRoute } from 'astro';
import { createCustomer, createAppointment } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, phone, appointmentType, date, time } = await request.json();
    
    if (![name, email, phone, appointmentType, date, time].every(Boolean)) {
      return new Response(
        JSON.stringify({ success: false, message: 'All fields are required' }), 
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get service details
    const svc = siteConfig.appointments.types.find(t => t.name === appointmentType);
    if (!svc) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid service type' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create customer (only if Notion is configured)
    let customer;
    if (process.env.NOTION_CUSTOMERS_DB_ID) {
      try {
        customer = await createCustomer({
          'Customer Name': name,
          Email: email,
          'Phone Number': phone,
          'Customer Type': 'New Client'
        });
      } catch (error) {
        console.log('Customer creation failed, continuing with appointment:', error);
      }
    }

    // Create appointment (only if Notion is configured)
    let appointment;
    if (process.env.NOTION_APPOINTMENTS_DB_ID) {
      try {
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
      } catch (error) {
        console.log('Appointment creation failed:', error);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to create appointment: ' + error.message }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointmentId: appointment?.id,
        customerId: customer?.id,
        message: 'Appointment booked successfully!'
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Booking API error:', e);
    return new Response(
      JSON.stringify({ success: false, message: e.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
