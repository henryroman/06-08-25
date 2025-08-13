// src/pages/api/booking.ts
import type { APIRoute } from 'astro';
import { siteConfig } from '../../../config/site.config.mjs';
import { createCustomer, createAppointment, checkAvailability } from '../../utils/notion';
import type { BookingRequest, BookingResponse } from '../../types/booking';

function validatePayload(body: unknown): BookingRequest {
  if (!body || typeof body !== 'object') throw new Error('Invalid JSON body');
  const payload = body as Record<string, any>;
  const required = ['name', 'email', 'phone', 'appointmentType', 'date', 'time'];
  const missing = required.filter(k => !payload[k] || String(payload[k]).trim() === '');
  if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);

  const duration = payload.duration
    ? Number(payload.duration)
    : (siteConfig?.appointments?.types?.find((t: any) => t.name === String(payload.appointmentType))?.duration ?? 60);

  return {
    name: String(payload.name),
    email: String(payload.email),
    phone: String(payload.phone),
    appointmentType: String(payload.appointmentType),
    date: String(payload.date),
    time: String(payload.time),
    duration,
    price: payload.price ? String(payload.price) : undefined,
    notes: payload.notes ? String(payload.notes) : undefined
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json().catch(() => null);
    if (!raw) return new Response(JSON.stringify({ success: false, message: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const booking = validatePayload(raw);

    // If Notion not configured, simulate
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_CUSTOMERS_DB_ID || !process.env.NOTION_APPOINTMENTS_DB_ID) {
      return new Response(JSON.stringify({ success: true, simulated: true, appointmentId: `sim_${Date.now()}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Build ISO start and check availability
    const isoStart = new Date(`${booking.date}T${booking.time}`).toISOString();
    const available = await checkAvailability(isoStart, booking.duration || 60);
    if (!available) return new Response(JSON.stringify({ success: false, message: 'Selected slot not available' }), { status: 409, headers: { 'Content-Type': 'application/json' } });

    // Create customer (best-effort)
    let cust;
    try {
      cust = await createCustomer({ 'Customer Name': booking.name, Email: booking.email, 'Phone Number': booking.phone, 'Customer Type': 'New Client' });
    } catch (err) {
      console.warn('createCustomer failed', err);
    }

    // Create appointment
    try {
      const svc = siteConfig.appointments.types.find((t: any) => t.name === booking.appointmentType);
      const appointmentInput = {
        Appointment: `Appointment – ${booking.appointmentType}`,
        'Client Name': booking.name,
        'Phone Number': booking.phone,
        'Service Type': booking.appointmentType,
        Date: isoStart,
        Duration: String(booking.duration ?? svc?.duration ?? 60),
        Price: booking.price ?? svc?.price ?? '$0',
        Status: 'pending',
        Notes: booking.notes ?? '',
        Email: booking.email
      };
      const appt = await createAppointment(appointmentInput);
      const res: BookingResponse = { success: true, appointmentId: appt.id, customerId: cust?.id, message: 'Booking created' };
      return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
      console.error('createAppointment failed', err);
      return new Response(JSON.stringify({ success: false, message: 'Failed to create appointment', error: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err: any) {
    console.error('Booking API error', err);
    return new Response(JSON.stringify({ success: false, message: err.message || 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
