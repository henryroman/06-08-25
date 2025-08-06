import { appointmentsSchema, customersSchema } from '../utils/notionmapping.ts';

export function validateSchema(
  expected: Record<string, any>,
  schema: Record<string, string>
) {
  const missing = Object.keys(expected).filter(k => !(k in schema));
  if (missing.length) console.warn('Notion schema missing properties:', missing);
}
