// src/pages/api/webhook.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { updateAppointment } from '../../utils/notion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-11-15' });

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text(); // raw body required for signature verification
  const sig = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed', err?.message || err);
    return new Response(`Webhook error: ${err?.message || 'invalid signature'}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const notionPageId = (session.metadata && (session.metadata.notionPageId || session.metadata.bookingId));
      if (notionPageId) {
        await updateAppointment(notionPageId, {
          Status: 'paid',
          'Stripe Session': session.id,
          'Payment Received': new Date().toISOString()
        });
      }
    }

    // For failures/expired sessions we simply leave the appointment as pending_payment.
    // You can let staff handle follow-up or provide a retry flow in the UI that calls /api/payment-retry.

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('webhook handler error', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};
