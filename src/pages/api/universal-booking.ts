import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';

// Dynamic schema detection and booking creation
export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  duration?: number;
  price?: string;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  customerId?: string;
  message: string;
  error?: string;
}

// Universal Notion property builder that works with any schema
function buildNotionProperty(value: any, type: string) {
  switch (type) {
    case 'title':
      return { title: [{ text: { content: String(value) } }] };
    case 'rich_text':
      return { rich_text: [{ text: { content: String(value) } }] };
    case 'number':
      return { number: Number(value) };
    case 'select':
      return { select: { name: String(value) } };
    case 'status':
      return { status: { name: String(value) } };
    case 'date':
      return { date: { start: new Date(value).toISOString() } };
    case 'email':
      return { email: String(value) };
    case 'phone_number':
      return { phone_number: String(value) };
    case 'checkbox':
      return { checkbox: Boolean(value) };
    case 'url':
      return { url: String(value) };
    default:
      console.warn(`Unsupported property type: ${type}`);
      return null;
  }
}

// Dynamic schema detection
async function getDatabaseSchema(notion: Client, databaseId: string) {
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const schema: Record<string, string> = {};
    
    for (const [key, prop] of Object.entries(db.properties)) {
      schema[key] = (prop as any).type;
    }
    
    return schema;
  } catch (error) {
    console.error('Error fetching database schema:', error);
    return null;
  }
}

// Smart field mapping for different database schemas
function mapBookingToSchema(schema: Record<string, string>, booking: BookingRequest) {
  const properties: Record<string, any> = {};
  
  // Common field mappings - try different possible field names
  const fieldMappings = {
    // Name fields
    name: ['Name', 'Customer Name', 'Client Name', 'Full Name', 'Title'],
    // Email fields
    email: ['Email', 'Customer Email', 'Client Email'],
    // Phone fields
    phone: ['Phone', 'Phone Number', 'Customer Phone', 'Client Phone'],
    // Service fields
    service: ['Service', 'Service Type', 'Treatment', 'Appointment Type'],
    // Date fields
    date: ['Date', 'Appointment Date', 'Booking Date'],
    // Duration fields
    duration: ['Duration', 'Service Duration', 'Time Duration'],
    // Price fields
    price: ['Price', 'Cost', 'Amount', 'Service Price'],
    // Status fields
    status: ['Status', 'Appointment Status', 'Booking Status'],
    // Notes fields
    notes: ['Notes', 'Comments', 'Details', 'Description']
  };
  
  // Map each booking field to the appropriate schema field
  for (const [bookingField, possibleSchemaFields] of Object.entries(fieldMappings)) {
    const value = booking[bookingField as keyof BookingRequest];
    if (value === undefined || value === null || value === '') continue;
    
    // Find the first matching field in the schema
    for (const schemaField of possibleSchemaFields) {
      if (schema[schemaField]) {
        const propType = schema[schemaField];
        const builtProp = buildNotionProperty(value, propType);
        if (builtProp) {
          properties[schemaField] = builtProp;
          break;
        }
      }
    }
  }
  
  return properties;
}

// Create customer with dynamic schema
async function createCustomerDynamic(notion: Client, customersDbId: string, booking: BookingRequest) {
  try {
    const schema = await getDatabaseSchema(notion, customersDbId);
    if (!schema) {
      throw new Error('Could not fetch customer database schema');
    }
    
    const customerData = {
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      notes: `Created from booking for ${booking.service} on ${booking.date}`
    };
    
    const properties = mapBookingToSchema(schema, customerData);
    
    // Add customer type if the field exists
    if (schema['Customer Type']) {
      properties['Customer Type'] = buildNotionProperty('Booking Customer', 'select');
    }
    
    const customer = await notion.pages.create({
      parent: { database_id: customersDbId },
      properties
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Create appointment with dynamic schema
async function createAppointmentDynamic(notion: Client, appointmentsDbId: string, booking: BookingRequest) {
  try {
    const schema = await getDatabaseSchema(notion, appointmentsDbId);
    if (!schema) {
      throw new Error('Could not fetch appointment database schema');
    }
    
    const appointmentData = {
      name: `Appointment for ${booking.service}`,
      service: booking.service,
      date: `${booking.date}T${booking.time}`,
      duration: booking.duration || 60,
      price: booking.price || '$0',
      notes: booking.notes || '',
      status: 'pending'
    };
    
    // Add customer info to appointment if fields exist
    const appointmentWithCustomer = {
      ...appointmentData,
      name: booking.name,
      phone: booking.phone,
      email: booking.email
    };
    
    const properties = mapBookingToSchema(schema, appointmentWithCustomer);
    
    const appointment = await notion.pages.create({
      parent: { database_id: appointmentsDbId },
      properties
    });
    
    return appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

export const POST: APIRoute = async ({ request }) => {
  console.log('=== UNIVERSAL BOOKING API CALLED ===');
  
  try {
    // Parse request
    const booking: BookingRequest = await request.json();
    console.log('Booking request:', booking);
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'service', 'date', 'time'];
    const missingFields = requiredFields.filter(field => !booking[field as keyof BookingRequest]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if Notion is configured
    const { NOTION_TOKEN, NOTION_CUSTOMERS_DB_ID, NOTION_APPOINTMENTS_DB_ID } = process.env;
    
    if (!NOTION_TOKEN || !NOTION_CUSTOMERS_DB_ID || !NOTION_APPOINTMENTS_DB_ID) {
      console.log('Notion not configured - simulating booking');
      
      // Simulate successful booking without Notion
      const simulatedAppointmentId = `simulated_${Date.now()}`;
      const simulatedCustomerId = `simulated_customer_${Date.now()}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          appointmentId: simulatedAppointmentId,
          customerId: simulatedCustomerId,
          message: 'Booking simulated successfully (Notion not configured)',
          simulated: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Notion client
    const notion = new Client({ auth: NOTION_TOKEN });
    
    // Create customer
    let customer;
    try {
      customer = await createCustomerDynamic(notion, NOTION_CUSTOMERS_DB_ID, booking);
      console.log('✅ Customer created:', customer.id);
    } catch (error) {
      console.error('Customer creation failed:', error);
      // Continue without customer if it fails
    }
    
    // Create appointment
    let appointment;
    try {
      appointment = await createAppointmentDynamic(notion, NOTION_APPOINTMENTS_DB_ID, booking);
      console.log('✅ Appointment created:', appointment.id);
    } catch (error) {
      console.error('Appointment creation failed:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to create appointment: ${error.message}`
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        appointmentId: appointment.id,
        customerId: customer?.id,
        message: 'Booking created successfully!',
        storedInNotion: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('=== BOOKING API ERROR ===', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};