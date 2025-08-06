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
      // Use fallback services from config
      services = siteConfig.appointments.types.map(service => ({
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: `${service.name} - Professional beauty service`
      }));
      console.log('Services loaded from config:', services.length);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        services,
        source: services.length > 0 ? 'config' : 'notion',
        count: services.length
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Services API error:', e);
    
    // Ultimate fallback - return basic services
    const fallbackServices = [
      { name: "Manicure", duration: 45, price: "$45", description: "Classic manicure with nail polish" },
      { name: "Pedicure", duration: 60, price: "$55", description: "Relaxing pedicure with foot massage" },
      { name: "Facial Treatment", duration: 90, price: "$85", description: "Deep cleansing facial treatment" },
      { name: "Gel Nails", duration: 75, price: "$65", description: "Long-lasting gel nail application" }
    ];
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        services: fallbackServices,
        source: 'fallback',
        count: fallbackServices.length,
        message: 'Using fallback services due to error'
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};