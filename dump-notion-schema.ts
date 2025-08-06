import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function dumpDb(dbId: string, name: string) {
  try {
    const db = await notion.databases.retrieve({ database_id: dbId });
    console.log(`\n📋 ${name} schema:`);
    console.log('--------------------------------');
    for (const [key, prop] of Object.entries(db.properties)) {
      console.log(`  • ${key}  (type=${(prop as any).type})`);
    }
  } catch (err) {
    console.error(`❌ Could not retrieve ${name} schema:`, err);
  }
}

(async () => {
  await dumpDb(process.env.NOTION_APPOINTMENTS_DB_ID!, 'Appointments DB');
  await dumpDb(process.env.NOTION_CUSTOMERS_DB_ID!, 'Customers DB');
})();
