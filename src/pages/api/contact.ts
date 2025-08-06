import type { APIRoute } from 'astro';
import { createCustomer } from '../../utils/notion';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, phone, message } = await request.json();
    
    console.log('=== CONTACT FORM SUBMISSION ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone || 'Not provided');
    console.log('Message:', message || 'No message provided');
    console.log('====================================');
    
    // Prepare customer data with message
    const customerData: any = {
      'Customer Name': name,
      Email: email,
      'Phone Number': phone || '',
      'Customer Type': 'Contact Inquiry'
    };
    
    // Add message to communication history if provided
    if (message && message.trim()) {
      customerData['Communication History'] = `Contact Form Message:\n\n${message}\n\nReceived: ${new Date().toLocaleString()}`;
    }
    
    const cust = await createCustomer(customerData);
    
    console.log('Customer created successfully in Notion:', cust.id);
    
    // Return success response with full message details
    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: cust.id,
        message: 'Contact form submitted successfully!',
        details: {
          name: name,
          email: email,
          phone: phone || 'Not provided',
          message: message || 'No message provided',
          submittedAt: new Date().toISOString()
        }
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (e: any) {
    console.error('Contact form error:', e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: e.message || 'Failed to submit contact form'
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
