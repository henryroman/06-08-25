import type { APIRoute } from 'astro';
import Stripe from 'stripe';

// Do NOT set apiVersion here; let Stripe use your account default
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

export const GET: APIRoute = async ({ url }) => {
try {
const sessionId = url.searchParams.get('session_id');
if (!sessionId) {
return new Response(JSON.stringify({ message: 'session_id required' }), { status: 400 });
}

const session = await stripe.checkout.sessions.retrieve(sessionId);

let customerEmail = '';
if (typeof session.customer === 'string' && session.customer) {
  try {
    const customer = await stripe.customers.retrieve(session.customer);
    if (!('deleted' in customer) && customer.email) {
      customerEmail = customer.email;
    }
  } catch {
    // ignore lookup failure, fallback below
  }
} else if (session.customer_details?.email) {
  customerEmail = session.customer_details.email;
}

return new Response(
  JSON.stringify({
    status: session.status,
    payment_status: session.payment_status,
    customer_email: customerEmail || session.customer_details?.email || '',
  }),
  { status: 200 }
);
} catch (e: any) {
return new Response(
JSON.stringify({ message: e?.message || 'Failed to retrieve session' }),
{ status: 500 }
);
}
};
