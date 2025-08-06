import type { APIRoute } from 'astro';
import { getAvailableSlots } from '../../utils/notion';

export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get('date');
    if (!date) throw new Error('Date required');

    const slots = await getAvailableSlots(date);
    return new Response(JSON.stringify({ success:true, availableSlots:slots }), { status:200, headers:{ 'Content-Type':'application/json' } });
  } catch (e:any) {
    return new Response(
      JSON.stringify({ success:false, message:e.message }),
      { status: e.message==='Date required'?400:500, headers:{ 'Content-Type':'application/json' } }
    );
  }
};
