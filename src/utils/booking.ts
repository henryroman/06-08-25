// src/pages/api/booking.ts
import type { APIRoute } from 'astro';

const NOTION_TOKEN = process.env.NOTION_SECRET!;
const NOTION_DB = process.env.NOTION_BOOKINGS_DB!;

async function createNotionBooking(payload: any) {
  if (!NOTION_TOKEN || !NOTION_DB) {
    console.warn('Notion env not set; skipping Notion write.');
    return { ok: true, skipped: true };
  }

  const body = {
    parent: { database_id: NOTION_DB },
    properties: {
      'Appointment': { title: [{ text: { content: `${payload.appointmentType || 'Appointment'} — ${payload.name || 'Guest'}` } }] },
      'Status': { select: { name: payload.paid ? 'Paid' : 'Pending' } },
      'Date': { date: { start: `${payload.date}T${payload.time || '00:00:00'}` } },
      'Client Name': { rich_text: [{ text: { content: payload.name || '' } }] },
      'Phone Number': { phone_number: payload.phone || '' },
      'Service Type': { select: { name: payload.appointmentType || '' } },
      'Duration': { select: { name: String(payload.duration || 60) } },
      'Notes': { rich_text: [{ text: { content: payload.notes || '' } }] },
      'Stripe Session': payload.stripeSessionId ? { rich_text: [{ text: { content: payload.stripeSessionId } }] } : undefined,
    },
  };

  const resp = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Notion error ${resp.status}: ${txt}`);
  }

  return resp.json();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    const required = ['name', 'email', 'phone', 'appointmentType', 'date', 'time'];
    const missing = required.filter((k) => !payload?.[k]);
    if (missing.length) {
      return new Response(JSON.stringify({ message: `Missing: ${missing.join(', ')}` }), {
        status: 400,
      });
    }

    await createNotionBooking(payload);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('/api/booking error', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Booking failed' }), {
      status: 500,
    });
  }
};
