import type { APIRoute } from 'astro';
import { getServiceTypes } from '../../utils/notion';
import { siteConfig } from '../../../config/site.config.mjs';

export const GET: APIRoute = async () => {
  try {
    console.log('Services API called');
    
    // Try to get services from Notion first
    let services = [];
    try {
      services = await getServiceTypes();
      console.log('Services loaded from Notion:', services.length);
    } catch (notionError) {
      console.log('Notion services failed, using config fallback:', notionError.message);
      // Fallback to config services
      services = siteConfig.appointments.types;
      console.log('Services loaded from config:', services.length);
    }
    
    return new Response(
      JSON.stringify({ success: true, services }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Services API error:', e);
    // Even if everything fails, return config services
    const fallbackServices = siteConfig.appointments.types;
    console.log('Using fallback services:', fallbackServices.length);
    
    return new Response(
      JSON.stringify({ success: true, services: fallbackServices }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};