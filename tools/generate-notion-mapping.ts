import 'dotenv/config';
import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function generateMapping(dbId: string, name: string) {
  const db = await notion.databases.retrieve({ database_id: dbId });
  const mapping: Record<string, string> = {};

  for (const [key, prop] of Object.entries(db.properties)) {
    mapping[key] = (prop as any).type;
  }

  const filename = path.resolve(__dirname, `../schema-${name}.json`);
  fs.writeFileSync(filename, JSON.stringify(mapping, null, 2));
  console.log(`Saved ${name} schema mapping to ${filename}`);
}

(async () => {
  await generateMapping(process.env.NOTION_APPOINTMENTS_DB_ID!, 'appointments');
  await generateMapping(process.env.NOTION_CUSTOMERS_DB_ID!, 'customers');
})();
