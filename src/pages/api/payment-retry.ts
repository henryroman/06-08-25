// src/pages/api/payment-retry.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getAppointment, updateAppointment } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-11-15' as any, // Add 'as any' here
});

function parsePriceStringToCents(priceStr: any) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return Math.round(priceStr);
  const cleaned = String(priceStr).replace(/[^\d\.]/g, '');
  const f = parseFloat(cleaned || '0');
  if (Number.isNaN(f)) return 0;
  return Math.round(f * 100);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.notionPageId) return new Response(JSON.stringify({ success: false, message: 'notionPageId required' }), { status: 400 });

    const notionPageId = body.notionPageId;
    const appointment = await getAppointment(notionPageId);
    if (!appointment) return new Response(JSON.stringify({ success: false, message: 'Appointment not found' }), { status: 404 });

    const props = (appointment.properties || {});
    const service = (props['Service Type']?.select?.name) || props['Service Type']?.rich_text?.[0]?.plain_text || '';
    const dateIso = (props['Date']?.date?.start) || null;
    const priceRaw = (props['Price']?.rich_text?.[0]?.plain_text) || props['Price'] || '';
    let priceCents = parsePriceStringToCents(priceRaw);
    if (!priceCents) {
      const svc = (siteConfig.appointments?.types || []).find((t) => t.name === service);
      priceCents = parsePriceStringToCents(svc?.price);
    }
    const discounted = Math.round(priceCents * 0.9);
    const currency = 'usd';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency,
          product_data: { name: service || 'Appointment' },
          unit_amount: discounted
        },
        quantity: 1
      }],
      metadata: { notionPageId },
      customer_email: (props['Email']?.email) || (props['Email']?.rich_text?.[0]?.plain_text) || undefined,
      success_url: (process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/pay-success') + `?bookingId=${encodeURIComponent(notionPageId)}`,
      cancel_url: (process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/pay-cancel') + `?bookingId=${encodeURIComponent(notionPageId)}`
    });

    // update notion with session id & url
    try {
      await updateAppointment(notionPageId, { 'Stripe Session': session.id, 'Stripe Checkout URL': session.url || '', Status: 'pending_payment' });
    } catch (err) {
      console.warn('updateAppointment failed', err);
    }

    return new Response(JSON.stringify({ success: true, url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('payment-retry error', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
