// src/utils/notionmapping.ts
import type { Client } from '@notionhq/client';

type NotionSchema = Record<string, any>;

/**
 * Retrieve schema for a database (property names -> types)
 */
export async function getDatabaseSchema(notion: Client, databaseId: string): Promise<NotionSchema> {
  if (!databaseId) throw new Error('databaseId required');
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const schema: NotionSchema = {};
  for (const [k, v] of Object.entries(db.properties || {})) {
    schema[k] = (v as any).type;
  }
  return schema;
}

/**
 * Build Notion properties given a schema and input data.
 * - schema: propertyName -> propertyType
 * - data: propertyName (or friendly name) -> value
 *
 * This function attempts to map provided data keys to actual schema property names:
 *  - if data key exactly matches schema property, use that
 *  - else looks for case-insensitive match
 */
export function buildNotionProperties(schema: NotionSchema, data: Record<string, any>): Record<string, any> {
  const props: Record<string, any> = {};
  const schemaKeys = Object.keys(schema);

  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined || v === '') continue;

    // find schema key
    let matched = schemaKeys.find(sk => sk === k);
    if (!matched) {
      matched = schemaKeys.find(sk => sk.toLowerCase() === k.toLowerCase());
    }
    if (!matched) {
      // attempt fuzzy: includes
      matched = schemaKeys.find(sk => sk.toLowerCase().includes(k.toLowerCase()));
    }
    if (!matched) continue;

    const type = schema[matched];
    switch (type) {
      case 'title':
        props[matched] = { title: [{ text: { content: String(v) } }] };
        break;
      case 'rich_text':
        props[matched] = { rich_text: [{ text: { content: String(v) } }] };
        break;
      case 'number':
        props[matched] = { number: Number(v) };
        break;
      case 'select':
        props[matched] = { select: { name: String(v) } };
        break;
      case 'multi_select':
        props[matched] = { multi_select: Array.isArray(v) ? v.map(String).map(name => ({ name })) : [{ name: String(v) }] };
        break;
      case 'status':
        props[matched] = { status: { name: String(v) } };
        break;
      case 'date':
        // Accept ISO string or Date-like
        const start = new Date(String(v));
        if (!isNaN(start.getTime())) {
          props[matched] = { date: { start: start.toISOString() } };
        } else {
          // try if v is already { start, end }
          props[matched] = v;
        }
        break;
      case 'email':
        props[matched] = { email: String(v) };
        break;
      case 'phone_number':
        props[matched] = { phone_number: String(v) };
        break;
      case 'checkbox':
        props[matched] = { checkbox: Boolean(v) };
        break;
      case 'url':
        props[matched] = { url: String(v) };
        break;
      default:
        // fallback to rich_text
        props[matched] = { rich_text: [{ text: { content: String(v) } }] };
        break;
    }
  }

  return props;
}
