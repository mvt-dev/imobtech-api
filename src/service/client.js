import { z } from 'zod';
import {
  findAll as dbFindAll,
  findById as dbFindById,
  create as dbCreate,
  update as dbUpdate,
  remove as dbRemove,
} from '../model/client.js';

const baseClientFields = {
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Email is invalid').optional(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Phone is invalid').optional(),
};

export async function findAll() {
  return dbFindAll();
}

export async function findById(id) {
  const client = await dbFindById(id);
  if (!client) {
    throw new Error('NOT-FOUND');
  }
  return client;
}

export async function create(client) {
  const validation = z.discriminatedUnion('type', [
    z.object({
      type: z.literal('PF'),
      document: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF is invalid'),
      ...baseClientFields,
    }),
    z.object({
      type: z.literal('PJ'),
      document: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ is invalid'),
      ...baseClientFields,
    }),
  ]).safeParse(client);
  if (!validation.success) {
    const error = new Error('INVALID-DATA');
    error.fields = z.flattenError(validation.error).fieldErrors;
    throw error;
  }
  const clientData = await dbCreate(validation.data);
  return clientData;
}

export async function update(client) {
  const validation = z.discriminatedUnion('type', [
    z.object({
      id: z.uuid(),
      type: z.literal('PF'),
      document: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF is invalid'),
      ...baseClientFields,
    }),
    z.object({
      id: z.uuid(),
      type: z.literal('PJ'),
      document: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ is invalid'),
      ...baseClientFields,
    }),
  ]).safeParse(client);
  if (!validation.success) {
    const error = new Error('INVALID-DATA');
    error.fields = z.flattenError(validation.error).fieldErrors;
    throw error;
  }
  const clientData = await dbUpdate(validation.data);
  return clientData;
}

export async function remove(id) {
  const validation = z.uuid().safeParse(id);
  if (!validation.success) {
    const error = new Error('INVALID-DATA');
    error.fields = validation.error.issues[0].message;
    throw error;
  }
  await dbRemove(id);
}
