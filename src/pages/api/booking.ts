import type { APIRoute } from 'astro';
import { createCustomer, createAppointment } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const POST: APIRoute = async ({ request }) => {
  console.log('--- /api/booking POST received ---');
  let payload: Record<string, string>;
  try {
    payload = await request.json();
    console.log('Payload:', payload);
  } catch (err) {
    console.error('❌ Invalid JSON:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const { name, email, phone, appointmentType, date, time } = payload;
  
  // Simple validation
  if (!name || !email || !phone || !appointmentType || !date || !time) {
    return new Response(
      JSON.stringify({ success: false, message: 'Missing one or more required fields' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Map form data → Customers DB fields
    const customer = await createCustomer({
      'Customer Name': name,
      Email: email,
      'Phone Number': phone,
      'Customer Type': 'New Client'
    });
    console.log('✅ Customer created:', customer.id);
    
    // Map form data → Appointments DB fields
    const isoDate = new Date(`${date}T${time}`).toISOString();
    const svc = siteConfig.appointments.types.find(t => t.name === appointmentType);
    const appointment = await createAppointment({
      Appointment: `Appointment for ${appointmentType}`,
      'Client Name': name,
      'Phone Number': phone,
      'Service Type': appointmentType,
      Date: isoDate,
      Duration: String(svc?.duration || 60),
      Price: svc?.price || '$0',
      Status: 'pending'
    });
    console.log('✅ Appointment created:', appointment.id);
    
    return new Response(
      JSON.stringify({ success: true, appointmentId: appointment.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('❌ Booking error:', err);
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};