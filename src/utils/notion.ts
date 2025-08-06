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

/**
 * Create a new Customer in Notion Customers DB
 */
export async function createCustomer(data: CustomerData) {
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
export async function getAvailableSlots(date: string) {
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
    while (currentTime < endTime) {
      const timeString = currentTime.toISOString();
      const isAvailable = await checkAvailability(timeString, bufferTime);

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

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  } catch (error) {
    console.log('Error getting available slots:', error);
    return [];
  }
}
