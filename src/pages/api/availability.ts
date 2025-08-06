import type { APIRoute } from 'astro';
import { getAvailableSlots } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const GET: APIRoute = async ({ url }) => {
  try {
    console.log('=== AVAILABILITY API CALLED ===');
    
    const date = url.searchParams.get('date');
    const serviceDuration = url.searchParams.get('duration');
    
    console.log('Availability request:', { date, serviceDuration });
    
    if (!date) {
      console.log('Date parameter missing');
      return new Response(
        JSON.stringify({ success: false, message: 'Date required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duration = serviceDuration ? parseInt(serviceDuration) : 60;
    console.log('Checking availability for:', { date, duration });
    
    let slots = [];
    
    // Check if Notion is configured
    if (process.env.NOTION_APPOINTMENTS_DB_ID && process.env.NOTION_TOKEN) {
      try {
        console.log('Using Notion for availability check');
        slots = await getAvailableSlots(date, duration);
        console.log('Notion slots returned:', slots.length);
      } catch (notionError) {
        console.log('Notion availability check failed, using fallback:', notionError.message);
        slots = generateFallbackSlots(date, duration);
      }
    } else {
      console.log('Notion not configured, using fallback availability');
      slots = generateFallbackSlots(date, duration);
    }
    
    console.log('Final slots count:', slots.length);
    console.log('=== AVAILABILITY API COMPLETED ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        availableSlots: slots,
        source: process.env.NOTION_APPOINTMENTS_DB_ID && process.env.NOTION_TOKEN ? 'notion' : 'fallback',
        count: slots.length
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('=== AVAILABILITY API ERROR ===', e);
    
    // Fallback slots even in case of error
    const fallbackSlots = generateFallbackSlots(url.searchParams.get('date') || new Date().toISOString().split('T')[0], 60);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        availableSlots: fallbackSlots,
        source: 'error_fallback',
        count: fallbackSlots.length,
        message: 'Using fallback slots due to error'
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Generate fallback time slots when Notion is not available
function generateFallbackSlots(date: string, serviceDuration: number = 60) {
  try {
    const { businessHours, bufferTime } = siteConfig.appointments;
    const dayOfWeek = new Date(date).getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    const hours = (businessHours as any)[dayName];

    if (!hours || hours.closed) {
      console.log(`Business closed on ${dayName}`);
      return [];
    }

    const slots = [];
    const startTime = new Date(`${date}T${hours.open}:00`);
    const endTime = new Date(`${date}T${hours.close}:00`);

    let currentTime = new Date(startTime);
    const slotInterval = Math.max(serviceDuration, bufferTime || 30);
    
    console.log(`Generating slots from ${hours.open} to ${hours.close} with ${slotInterval}min intervals`);
    
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      // Skip slots that are too close to current time (if booking for today)
      const now = new Date();
      const isToday = date === now.toISOString().split('T')[0];
      if (isToday && currentTime <= now) {
        currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
        continue;
      }
      
      slots.push({
        time: timeString,
        display: currentTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        iso: currentTime.toISOString(),
      });

      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }

    console.log(`Generated ${slots.length} fallback slots`);
    return slots;
  } catch (error) {
    console.error('Error generating fallback slots:', error);
    // Return some basic slots even if there's an error
    return [
      { time: '09:00', display: '9:00 AM', iso: `${date}T09:00:00` },
      { time: '10:00', display: '10:00 AM', iso: `${date}T10:00:00` },
      { time: '11:00', display: '11:00 AM', iso: `${date}T11:00:00` },
      { time: '14:00', display: '2:00 PM', iso: `${date}T14:00:00` },
      { time: '15:00', display: '3:00 PM', iso: `${date}T15:00:00` },
      { time: '16:00', display: '4:00 PM', iso: `${date}T16:00:00` }
    ];
  }
}
