// src/pages/api/create-checkout-session.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { siteConfig } from '../../../config/site.config.mjs';
import { checkAvailability, createAppointment, createCustomer, updateAppointment } from '../../utils/notion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-11-15' });

function parsePriceToCentsFromCandidate(priceCandidate: any) {
  if (!priceCandidate) return 0;
  if (typeof priceCandidate === 'number') return Math.round(priceCandidate);
  if (typeof priceCandidate === 'string') {
    const cleaned = priceCandidate.replace(/[^\d.]/g, '');
    const f = parseFloat(cleaned || '0');
    if (Number.isNaN(f)) return 0;
    return Math.round(f * 100);
  }
  return 0;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), { status: 400 });

    const { name, email, phone, appointmentType, date, time, duration = 60 } = body;
    // compute base price cents: prefer body.priceCents, otherwise lookup from siteConfig
    let priceCents = Number(body.priceCents || 0);
    if (!priceCents) {
      const svc = (siteConfig.appointments?.types || []).find((t) => t.name === appointmentType);
      priceCents = parsePriceToCentsFromCandidate(svc?.price);
    }
    // apply 10% discount for pay now
    const discounted = Math.round(priceCents * 0.9);

    if (!name || !email || !appointmentType || !date || !time) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required booking fields' }), { status: 400 });
    }

    const isoStart = new Date(`${date}T${time}`).toISOString();
    const isAvailable = await checkAvailability(isoStart, Number(duration));
    if (!isAvailable) return new Response(JSON.stringify({ success: false, message: 'Selected slot not available' }), { status: 409 });

    // create or find customer in Notion (best-effort)
    try {
      await createCustomer({ 'Customer Name': name, Email: email, 'Phone Number': phone, 'Customer Type': 'New Client' });
    } catch (err) {
      console.warn('createCustomer failed', err);
    }

    const appointmentInput = {
      Appointment: `Appointment – ${appointmentType}`,
      'Client Name': name,
      'Phone Number': phone,
      'Service Type': appointmentType,
      Date: isoStart,
      Duration: String(duration),
      Price: `$${(priceCents/100).toFixed(2)}`,
      Status: 'pending_payment',
      Notes: body.notes || '',
      Email: email,
      'Stripe Session': '' // will update after session created
    };

    const created = await createAppointment(appointmentInput);
    const notionPageId = created.id;

    const currency = (body.currency || 'usd').toLowerCase();
    const amountToCharge = discounted;
    const successUrl = (process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/pay-success') + `?bookingId=${encodeURIComponent(notionPageId)}`;
    const cancelUrl = (process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/pay-cancel') + `?bookingId=${encodeURIComponent(notionPageId)}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: appointmentType, description: `Appointment on ${date} at ${time}` },
            unit_amount: amountToCharge
          },
          quantity: 1
        }
      ],
      metadata: { notionPageId, appointmentType, date, time },
      // populate customer email so Stripe can send receipts if enabled
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    // update notion appointment with session id and payment link
    try {
      await updateAppointment(notionPageId, {
        'Stripe Session': session.id,
        'Stripe Checkout URL': session.url || '',
        Status: 'pending_payment'
      });
    } catch (err) {
      console.warn('updateAppointment failed', err);
    }

    return new Response(JSON.stringify({ success: true, url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('create-checkout-session error', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
