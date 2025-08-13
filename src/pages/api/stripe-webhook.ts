// src/pages/api/stripe-webhook.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil' as any,
});
const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET!;
const NOTION_TOKEN = import.meta.env.NOTION_SECRET!;
const NOTION_DB = import.meta.env.NOTION_BOOKINGS_DB!;

async function createNotionBookingFromWebhook(payload: any) {
  if (!NOTION_TOKEN || !NOTION_DB) return;

  const body = {
    parent: { database_id: NOTION_DB },
    properties: {
      'Appointment': { title: [{ text: { content: payload.appointmentType || 'Booking' } }] },
      'Status': { select: { name: 'Paid' } },
      'Date': { date: { start: `${payload.date}T${payload.time || '00:00:00'}` } },
      'Client Name': { rich_text: [{ text: { content: payload.name || '' } }] },
      'Phone Number': { phone_number: payload.phone || '' },
      'Service Type': { select: { name: payload.appointmentType || '' } },
      'Duration': { select: { name: String(payload.duration || 60) } },
      ...(payload.stripeSessionId
        ? { 'Stripe Session': { rich_text: [{ text: { content: payload.stripeSessionId } }] } }
        : {}),
    },
  };

  await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });
}

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  if (!sig || !endpointSecret) return new Response('Missing signature', { status: 400 });

  const raw = await request.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(raw), sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed', err?.message);
    return new Response('Bad signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const md = session.metadata || {};
      await createNotionBookingFromWebhook({
        ...md,
        paid: true,
        stripeSessionId: session.id,
      });
    }
    return new Response('ok', { status: 200 });
  } catch (err: any) {
    console.error('Webhook handler error', err);
    return new Response('Webhook error', { status: 500 });
  }
};
