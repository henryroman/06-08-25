import 'dotenv/config';
import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function dumpSchema(dbId: string, name: string) {
  const db = await notion.databases.retrieve({ database_id: dbId });
  const mapping: Record<string, string> = {};
  for (const [k, p] of Object.entries(db.properties)) {
    mapping[k] = (p as any).type;
  }
  const out = path.join(__dirname, `../schema-${name}.json`);
  fs.writeFileSync(out, JSON.stringify(mapping, null, 2));
  console.log(`✓ ${name} schema saved to ${out}`);
}

(async () => {
  await dumpSchema(process.env.NOTION_APPOINTMENTS_DB_ID!, 'appointments');
  await dumpSchema(process.env.NOTION_CUSTOMERS_DB_ID!, 'customers');
})();
