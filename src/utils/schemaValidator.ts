// src/utils/schemaValidator.ts
export function validateSchemaMapping(schema: Record<string, any>): true {
  if (!schema || typeof schema !== 'object') throw new Error('Invalid schema object');
  const hasTitle = Object.values(schema).some((p: any) => p === 'title' || (p?.type === 'title'));
  const hasDate = Object.values(schema).some((p: any) => p === 'date' || (p?.type === 'date'));

  if (!hasTitle) throw new Error('Appointments DB must have a title property (type: title).');
  if (!hasDate) throw new Error('Appointments DB must have a date property (type: date).');

  return true;
}
