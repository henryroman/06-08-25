// src/pages/api/availability.ts
import type { APIRoute } from 'astro';
import { getAvailableSlots } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get('date');
    const serviceDuration = url.searchParams.get('duration');

    if (!date) {
      return new Response(JSON.stringify({ success: false, message: 'Date required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const duration = serviceDuration ? parseInt(serviceDuration) : 60;

    let slots = [];
    if (process.env.NOTION_APPOINTMENTS_DB_ID && process.env.NOTION_TOKEN) {
      try {
        slots = await getAvailableSlots(date, duration);
      } catch (err) {
        console.warn('Notion availability error, using fallback', err);
        // fallback generator uses siteConfig
        slots = generateFallbackSlots(date, duration);
      }
    } else {
      slots = generateFallbackSlots(date, duration);
    }

    return new Response(JSON.stringify({ success: true, availableSlots: slots, count: slots.length }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Availability API error', err);
    const fallbackSlots = generateFallbackSlots(url.searchParams.get('date') || new Date().toISOString().split('T')[0], 60);
    return new Response(JSON.stringify({ success: true, availableSlots: fallbackSlots, source: 'error_fallback' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

function generateFallbackSlots(date: string, serviceDuration: number = 60) {
  try {
    const { businessHours, bufferTime } = siteConfig.appointments || {};
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayName = days[new Date(date).getDay()];
    const hours = (businessHours as any)[dayName];
    if (!hours || hours.closed) return [];
    const slots = [];
    const start = new Date(`${date}T${hours.open}:00`);
    const end = new Date(`${date}T${hours.close}:00`);
    let cur = new Date(start);
    const interval = Math.max(serviceDuration, bufferTime || 30);
    while (cur < end) {
      const iso = cur.toISOString();
      slots.push({ time: iso.slice(11,19), iso, display: cur.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) });
      cur.setMinutes(cur.getMinutes() + interval);
    }
    return slots;
  } catch (err) {
    console.error('generateFallbackSlots error', err);
    return [];
  }
}
