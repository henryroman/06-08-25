import type { APIRoute } from 'astro';
import { createCustomer, createAppointment } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, phone, appointmentType, date, time } = await request.json();
    if (![name, email, phone, appointmentType, date, time].every(Boolean)) {
      return new Response(JSON.stringify({ success:false, message:'Missing fields' }), { status:422, headers:{ 'Content-Type':'application/json' } });
    }

    const cust = await createCustomer({
      'Customer Name': name,
      Email: email,
      'Phone Number': phone,
      'Customer Type': 'New Client'
    });

    const svc = siteConfig.appointments.types.find(t => t.name === appointmentType)!;
    const iso = `${date}T${time}`;
    const appt = await createAppointment({
      Appointment: `Appointment for ${appointmentType}`,
      'Client Name': name,
      'Phone Number': phone,
      'Service Type': appointmentType,
      Date: iso,
      Duration: String(svc.duration),
      Price: svc.price,
      Status: 'pending'
    });

    return new Response(JSON.stringify({ success:true, appointmentId:appt.id }), { status:200, headers:{ 'Content-Type':'application/json' } });
  } catch (e:any) {
    return new Response(JSON.stringify({ success:false, message:e.message }), { status:500, headers:{ 'Content-Type':'application/json' } });
  }
};
