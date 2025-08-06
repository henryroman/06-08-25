import type { APIRoute } from 'astro';
import { createCustomer } from '../../utils/notion';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, phone, message } = await request.json();
    const cust = await createCustomer({
      'Customer Name': name,
      Email: email,
      'Phone Number': phone,
      'Customer Type': 'Contact Inquiry'
    });
    return new Response(JSON.stringify({ success:true, customerId:cust.id }), { status:200, headers:{ 'Content-Type':'application/json' } });
  } catch (e:any) {
    return new Response(JSON.stringify({ success:false, message:e.message }), { status:500, headers:{ 'Content-Type':'application/json' } });
  }
};
