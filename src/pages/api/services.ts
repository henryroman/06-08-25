import type { APIRoute } from 'astro';
import { getServiceTypes } from '../../utils/notion';

export const GET: APIRoute = async () => {
  try {
    const services = await getServiceTypes();
    
    return new Response(
      JSON.stringify({ success: true, services }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Services API error:', e);
    return new Response(
      JSON.stringify({ success: false, message: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};