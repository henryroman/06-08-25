// src/pages/api/services.ts
import type { APIRoute } from 'astro';
import { getServiceTypes } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const GET: APIRoute = async () => {
  try {
    const services = await getServiceTypes();
    return new Response(JSON.stringify({ success: true, services }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('services API error', err);
    // fallback to siteConfig
    const fallback = (siteConfig.appointments && siteConfig.appointments.types) || [];
    return new Response(JSON.stringify({ success: true, services: fallback, message: 'fallback' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
