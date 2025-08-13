// src/pages/api/webhook.ts
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { updateAppointment } from '../../utils/notion';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text(); // Raw body required for signature verification
  const sig = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed', err?.message || err);
    return new Response(`Webhook error: ${err?.message || 'invalid signature'}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const notionPageId = session.metadata?.notionPageId;

        if (notionPageId) {
          console.log(`Payment completed for appointment ${notionPageId}`);
          await updateAppointment(notionPageId, {
            Status: 'paid',
            'Stripe Session': session.id,
            'Payment Received': new Date().toISOString(),
            'Payment Amount': `$${((session.amount_total || 0) / 100).toFixed(2)}`,
            'Currency': (session.currency || 'usd').toUpperCase()
          });

          console.log(`Updated Notion appointment ${notionPageId} to paid status`);
        } else {
          console.warn('checkout.session.completed webhook missing notionPageId in metadata');
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // Optional: additional confirmation that payment went through
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message || 'unknown'}`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const notionPageId = session.metadata?.notionPageId;
        if (notionPageId) {
          console.log(`Checkout session expired for appointment ${notionPageId}`);
          // Optionally update appointment status to 'expired' or keep as 'pending_payment'
          // for manual follow-up
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Webhook handler error', err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || 'webhook processing failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
