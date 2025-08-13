// src/utils/notion.ts
import { Client } from '@notionhq/client';
import { buildNotionProperties, getDatabaseSchema } from './notionmapping';
import { validateSchemaMapping } from './schemaValidator';
import { siteConfig } from '../../config/site.config.mjs';

const token = process.env.NOTION_TOKEN;
const notion = token ? new Client({ auth: token }) : undefined;

export interface NotionPage { id: string; properties?: any; }

export async function createCustomer(data: Record<string, any>): Promise<NotionPage> {
  const dbId = process.env.NOTION_CUSTOMERS_DB_ID;
  if (!dbId) throw new Error('NOTION_CUSTOMERS_DB_ID not configured');
  if (!notion) throw new Error('Notion client not initialized');

  const schema = await getDatabaseSchema(notion, dbId);
  validateSchemaMapping(schema);
  const properties = buildNotionProperties(schema, data);
  return notion.pages.create({ parent: { database_id: dbId }, properties });
}

export async function createAppointment(data: Record<string, any>): Promise<NotionPage> {
  const dbId = process.env.NOTION_APPOINTMENTS_DB_ID;
  if (!dbId) throw new Error('NOTION_APPOINTMENTS_DB_ID not configured');
  if (!notion) throw new Error('Notion client not initialized');

  const schema = await getDatabaseSchema(notion, dbId);
  validateSchemaMapping(schema);

  const dbInfo = await notion.databases.retrieve({ database_id: dbId });
  const statusProp = (dbInfo.properties as any)['Status'];
  if (statusProp && statusProp.status && Array.isArray(statusProp.status.options)) {
    const allowed = statusProp.status.options.map((o: any) => o.name);
    if (data.Status && !allowed.includes(data.Status)) {
      data.Status = allowed[0] ?? data.Status;
    }
  }

  const properties = buildNotionProperties(schema, data);
  return notion.pages.create({ parent: { database_id: dbId }, properties });
}

export async function updateAppointment(pageId: string, data: Record<string, any>): Promise<any> {
  const dbId = process.env.NOTION_APPOINTMENTS_DB_ID;
  if (!dbId) throw new Error('NOTION_APPOINTMENTS_DB_ID not configured');
  if (!notion) throw new Error('Notion client not initialized');
  // fetch db schema to build properties correctly
  const schema = await getDatabaseSchema(notion, dbId);
  validateSchemaMapping(schema);
  const properties = buildNotionProperties(schema, data);
  return notion.pages.update({ page_id: pageId, properties });
}

export async function getAppointment(pageId: string): Promise<any> {
  if (!notion) return null;
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    return page;
  } catch (err) {
    console.warn('getAppointment failed', err);
    return null;
  }
}

/**
 * Efficient availability check:
 * - We query appointments for the day once, extract start/end times,
 * - For the requested start & duration we check overlaps in-memory.
 */
export async function checkAvailability(startIso: string, duration: number): Promise<boolean> {
  if (!notion) return true;
  const dbId = process.env.NOTION_APPOINTMENTS_DB_ID;
  if (!dbId) return true;

  try {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) throw new Error('Invalid start');

    const end = new Date(start.getTime() + Math.max(1, duration) * 60000);

    const dayStart = new Date(start);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate()+1);

    const resp = await notion.databases.query({
      database_id: dbId,
      filter: {
        and: [
          { property: 'Date', date: { on_or_after: dayStart.toISOString() } },
          { property: 'Date', date: { before: dayEnd.toISOString() } },
          { property: 'Status', status: { does_not_equal: 'Cancelled' } }
        ]
      },
      page_size: 100
    });

    const appointments = (resp.results || []).map(r => {
      try {
        const props = (r as any).properties || {};
        const dateProp = props['Date']?.date;
        const startS = dateProp?.start;
        const endS = dateProp?.end || null;
        return { start: startS ? new Date(startS) : null, end: endS ? new Date(endS) : null };
      } catch (e) { return { start: null, end: null }; }
    }).filter(a => a.start);

    for (const ap of appointments) {
      const aStart = ap.start!;
      const aEnd = ap.end ? ap.end : new Date(aStart.getTime() + Math.max(30, 60) * 60000);
      if (aStart < end && aEnd > start) {
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('checkAvailability error', err);
    return true;
  }
}

export async function getServiceTypes(): Promise<{ name: string; duration: number; price?: string }[]> {
  try {
    const dbId = process.env.NOTION_APPOINTMENTS_DB_ID;
    if (dbId && notion) {
      const dbInfo = await notion.databases.retrieve({ database_id: dbId });
      const prop = (dbInfo.properties as any)['Service Type'] ?? (dbInfo.properties as any)['Service'];
      if (prop && prop.multi_select && Array.isArray(prop.multi_select.options)) {
        return prop.multi_select.options.map((o: any) => ({ name: o.name, duration: 60 }));
      }
    }
  } catch (err) {
    console.warn('getServiceTypes: failed to read from Notion', err);
  }
  return siteConfig.appointments.types || [];
}

export async function getAppointments(startDateIso: string, endDateIso: string) {
  const dbId = process.env.NOTION_APPOINTMENTS_DB_ID;
  if (!dbId || !notion) return [];
  try {
    const resp = await notion.databases.query({
      database_id: dbId,
      filter: {
        and: [
          { property: 'Date', date: { on_or_after: startDateIso } },
          { property: 'Date', date: { before: endDateIso } },
          { property: 'Status', status: { does_not_equal: 'Cancelled' } }
        ]
      },
      sorts: [{ property: 'Date', direction: 'ascending' }],
      page_size: 100
    });
    return resp.results;
  } catch (err) {
    console.error('getAppointments failed', err);
    return [];
  }
}

export async function getAvailableSlots(date: string, serviceDuration: number = 60) {
  try {
    const { businessHours = {}, bufferTime = 30 } = siteConfig.appointments || {};
    const dt = new Date(date);
    if (Number.isNaN(dt.getTime())) return [];
    const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][dt.getDay()];
    const hours = (businessHours as any)[dayName];
    if (!hours || hours.closed) return [];

    const start = new Date(`${date}T${hours.open}:00`);
    const end = new Date(`${date}T${hours.close}:00`);
    const interval = Math.max(1, serviceDuration, bufferTime);

    const slots = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const iso = cursor.toISOString();
      const avail = await checkAvailability(iso, serviceDuration);
      if (avail) {
        slots.push({ time: iso.slice(11,19), iso, display: cursor.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) });
      }
      cursor.setMinutes(cursor.getMinutes() + interval);
    }
    return slots;
  } catch (err) {
    console.error('getAvailableSlots failed', err);
    return [];
  }
}
