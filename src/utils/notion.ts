// File: src/utils/notion.ts
import { Client } from '@notionhq/client';
import {
  appointmentsSchema,
  customersSchema,
  buildNotionProperties,
} from '../utils/notionmapping.ts';
import { siteConfig } from '../../config/site.config.mjs';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export interface CustomerData {
  'Customer Name': string;
  Email: string;
  'Phone Number': string;
  'Customer Type': string;
}

export interface AppointmentData {
  Appointment: string;
  'Client Name': string;
  'Phone Number': string;
  'Service Type': string;
  Date: string;
  Duration: string | number;
  Price?: string;
  Status: string;
  Notes?: string;
}

export interface ServiceType {
  name: string;
  duration: number;
  price: string;
  description?: string;
}

/**
 * Get service types from Notion database or fallback to config
 */
export async function getServiceTypes(): Promise<ServiceType[]> {
  try {
    // If Notion is configured, try to fetch from database
    if (process.env.NOTION_APPOINTMENTS_DB_ID) {
      const dbInfo = await notion.databases.retrieve({
        database_id: process.env.NOTION_APPOINTMENTS_DB_ID!,
      });

      // Look for service type property
      const serviceTypeProp = dbInfo.properties['Service Type'];
      if (serviceTypeProp && (serviceTypeProp as any).multi_select?.options) {
        const options = (serviceTypeProp as any).multi_select.options;
        return options.map((option: any) => ({
          name: option.name,
          duration: 60, // Default duration
          price: "$50", // Default price
          description: option.description || ""
        }));
      }
    }
    
    // Fallback to config
    return siteConfig.appointments.types;
  } catch (error) {
    console.log('Error fetching service types from Notion, using config:', error);
    return siteConfig.appointments.types;
  }
}

/**
 * Create a new Customer in Notion Customers DB
 */
export async function createCustomer(data: CustomerData) {
  if (!process.env.NOTION_CUSTOMERS_DB_ID) {
    throw new Error('Notion Customers DB ID not configured');
  }

  return notion.pages.create({
    parent: { database_id: process.env.NOTION_CUSTOMERS_DB_ID! },
    properties: buildNotionProperties(customersSchema, data),
  });
}

/**
 * Create a new Appointment in Notion Appointments DB
 * Validates the Status against actual DB options before sending.
 */
export async function createAppointment(data: AppointmentData) {
  if (!process.env.NOTION_APPOINTMENTS_DB_ID) {
    throw new Error('Notion Appointments DB ID not configured');
  }

  // 1) Retrieve DB schema from Notion so we can see allowed Status values
  const dbInfo = await notion.databases.retrieve({
    database_id: process.env.NOTION_APPOINTMENTS_DB_ID!,
  });

  const statusProp = dbInfo.properties['Status'];
  const allowedStatus: string[] = Array.isArray((statusProp as any)?.status?.options)
    ? (statusProp as any).status.options.map((o: any) => o.name)
    : [];

  // 2) Validate provided Status or default to the first available option
  if (!allowedStatus.includes(data.Status)) {
    console.warn(
      `⚠️ Status "${data.Status}" not found in Notion DB. ` +
      `Defaulting to "${allowedStatus[0] || 'Unknown'}".`
    );
    data.Status = allowedStatus[0] || 'Unknown';
  }

  // 3) Build Notion properties payload and create the page
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_APPOINTMENTS_DB_ID! },
    properties: buildNotionProperties(appointmentsSchema, data),
  });
}

/**
 * Check if a given datetime slot is available
 */
export async function checkAvailability(dateTime: string, duration: number): Promise<boolean> {
  try {
    if (!process.env.NOTION_APPOINTMENTS_DB_ID) {
      // If Notion is not configured, assume availability
      return true;
    }

    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const existingAppointments = await notion.databases.query({
      database_id: process.env.NOTION_APPOINTMENTS_DB_ID!,
      filter: {
        and: [
          {
            property: 'Date',
            date: {
              on_or_after: startTime.toISOString(),
            },
          },
          {
            property: 'Date',
            date: {
              before: endTime.toISOString(),
            },
          },
          {
            property: 'Status',
            status: {
              does_not_equal: 'Cancelled'
            }
          }
        ],
      },
    });

    return existingAppointments.results.length === 0;
  } catch (error) {
    console.log('Availability check failed, allowing booking:', error);
    return true;
  }
}

/**
 * Get available slots for a given date
 */
export async function getAvailableSlots(date: string, serviceDuration: number = 60) {
  try {
    const { businessHours, bufferTime } = siteConfig.appointments;
    const dayOfWeek = new Date(date).getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    const hours = (businessHours as any)[dayName];

    if (!hours || hours.closed) {
      return [];
    }

    const slots = [];
    const startTime = new Date(`${date}T${hours.open}:00`);
    const endTime = new Date(`${date}T${hours.close}:00`);

    let currentTime = new Date(startTime);
    const slotInterval = Math.max(serviceDuration, bufferTime || 30);
    
    while (currentTime < endTime) {
      const timeString = currentTime.toISOString();
      const isAvailable = await checkAvailability(timeString, serviceDuration);

      if (isAvailable) {
        slots.push({
          time: currentTime.toTimeString().slice(0, 5),
          display: currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          iso: timeString,
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }

    return slots;
  } catch (error) {
    console.log('Error getting available slots:', error);
    return [];
  }
}

/**
 * Get existing appointments for a date range
 */
export async function getAppointments(startDate: string, endDate: string) {
  try {
    if (!process.env.NOTION_APPOINTMENTS_DB_ID) {
      return [];
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_APPOINTMENTS_DB_ID!,
      filter: {
        and: [
          {
            property: 'Date',
            date: {
              on_or_after: startDate,
            },
          },
          {
            property: 'Date',
            date: {
              before: endDate,
            },
          },
          {
            property: 'Status',
            status: {
              does_not_equal: 'Cancelled'
            }
          }
        ],
      },
      sorts: [
        {
          property: 'Date',
          direction: 'ascending',
        },
      ],
    });

    return response.results;
  } catch (error) {
    console.log('Error getting appointments:', error);
    return [];
  }
}
