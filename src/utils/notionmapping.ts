import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filenameNM = fileURLToPath(import.meta.url);
const __dirnameNM = path.dirname(__filenameNM);

export type Schema = Record<string,string>;

export const appointmentsSchema: Schema = JSON.parse(
  fs.readFileSync(path.join(__dirnameNM, '../../schema-appointments.json'), 'utf-8')
);
export const customersSchema: Schema = JSON.parse(
  fs.readFileSync(path.join(__dirnameNM, '../../schema-customers.json'), 'utf-8')
);

export function buildNotionProperties(
  schema: Schema,
  data: Record<string, any>
): Record<string, any> {
  const props: Record<string, any> = {};
  for (const [k, t] of Object.entries(schema)) {
    if (data[k] == null) continue;
    const v = data[k];
    switch (t) {
      case 'title':       props[k] = { title: [{ text: { content: String(v) } }] }; break;
      case 'rich_text':   props[k] = { rich_text: [{ text: { content: String(v) } }] }; break;
      case 'select':      props[k] = { select: { name: String(v) } }; break;
      case 'status':      props[k] = { status: { name: String(v) } }; break;
      case 'date':        props[k] = { date: { start: new Date(v).toISOString() } }; break;
      case 'number':      props[k] = { number: Number(v) }; break;
      case 'email':       props[k] = { email: String(v) }; break;
      case 'phone_number':props[k] = { phone_number: String(v) }; break;
      case 'checkbox':    props[k] = { checkbox: Boolean(v) }; break;
      case 'relation':    props[k] = { relation: [{ id: String(v) }] }; break;
      default:            console.warn(`Unsupported ${t} for ${k}`);
    }
  }
  return props;
}
