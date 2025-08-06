import type { APIRoute } from 'astro';
import { getAvailableSlots } from '../../utils/notion';

export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get('date');
    const serviceDuration = url.searchParams.get('duration');
    
    if (!date) {
      return new Response(
        JSON.stringify({ success: false, message: 'Date required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duration = serviceDuration ? parseInt(serviceDuration) : 60;
    const slots = await getAvailableSlots(date, duration);
    
    return new Response(
      JSON.stringify({ success: true, availableSlots: slots }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Availability API error:', e);
    return new Response(
      JSON.stringify({ success: false, message: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
