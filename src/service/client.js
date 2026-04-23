import { z } from 'zod';
import { create as dbCreate } from '../model/client.js';

export async function create(client) {
  const validation = z.object({
    type: z.enum(['PF', 'PJ']),
    document: z.string().regex(/^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/, 'Document is invalid'),
    name: z.string().trim().min(1, 'Name is required'),
    email: z.email('Email is invalid').optional(),
    phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Phone is invalid').optional(),
  }).safeParse(client);
  if (!validation.success) {
    const error = new Error('INVALID-DATA');
    error.fields = z.flattenError(validation.error).fieldErrors;
    throw error;
  }
  const clientData = await dbCreate(validation.data);
  return clientData;
}
