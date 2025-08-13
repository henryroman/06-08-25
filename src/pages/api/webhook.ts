// src/pages/api/webhook.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { updateAppointment } from '../../utils/notion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-11-15' });

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text(); // important: raw text for signature verification
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
      // optionally call n8n for post-payment action
      if (process.env.N8N_WEBHOOK_URL) {
        fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'checkout_completed', notionPageId, sessionId: session.id })
        }).catch(e => console.warn('n8n notify failed', e));
      }
    }

    if (event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.expired') {
      const obj = event.data.object as any;
      const notionPageId = obj?.metadata?.notionPageId || obj?.metadata?.bookingId;
      if (notionPageId) {
        // leave appointment as pending_payment but notify via n8n to send retry link
        if (process.env.N8N_WEBHOOK_URL) {
          fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'payment_failed', notionPageId, reason: event.type })
          }).catch(e => console.warn('n8n notify failed', e));
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('webhook handler error', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};
// src/pages/api/webhook.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { updateAppointment } from '../../utils/notion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-11-15' });

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text(); // important: raw text for signature verification
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
      // optionally call n8n for post-payment action
      if (process.env.N8N_WEBHOOK_URL) {
        fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'checkout_completed', notionPageId, sessionId: session.id })
        }).catch(e => console.warn('n8n notify failed', e));
      }
    }

    if (event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.expired') {
      const obj = event.data.object as any;
      const notionPageId = obj?.metadata?.notionPageId || obj?.metadata?.bookingId;
      if (notionPageId) {
        // leave appointment as pending_payment but notify via n8n to send retry link
        if (process.env.N8N_WEBHOOK_URL) {
          fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'payment_failed', notionPageId, reason: event.type })
          }).catch(e => console.warn('n8n notify failed', e));
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('webhook handler error', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};
