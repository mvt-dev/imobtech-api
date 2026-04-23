import { z } from 'zod';
import { CLIENT_STATUS, CLIENT_TYPE } from '../constant/client.js';
import { ERROR } from '../constant/error.js';
import {
  findAll as dbFindAll,
  findById as dbFindById,
  create as dbCreate,
  update as dbUpdate,
  remove as dbRemove,
  updateStatus as dbUpdateStatus,
} from '../model/client.js';

const baseClientFields = {
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Email is invalid').optional(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Phone is invalid').optional(),
  status: z.enum([CLIENT_STATUS.ACTIVE, CLIENT_STATUS.INACTIVE]).optional(),
};

export async function findAll(query) {
  const validation = z.object({
    status: z.enum([CLIENT_STATUS.ACTIVE, CLIENT_STATUS.INACTIVE, CLIENT_STATUS.REMOVED]).default(CLIENT_STATUS.ACTIVE),
    type: z.enum([CLIENT_TYPE.PF, CLIENT_TYPE.PJ]).optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(50).default(10),
  }).safeParse(query);
  if (!validation.success) {
    const error = new Error(ERROR.INVALID_DATA);
    error.fields = z.flattenError(validation.error).fieldErrors;
    throw error;
  }
  return dbFindAll(validation.data);
}

export async function findById(id) {
  const client = await dbFindById(id);
  if (!client) {
    throw new Error(ERROR.NOT_FOUND);
  }
  return client;
}

export async function create(client) {
  const validation = z.discriminatedUnion('type', [
    z.object({
      type: z.literal(CLIENT_TYPE.PF),
      document: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF is invalid'),
      ...baseClientFields,
    }),
    z.object({
      type: z.literal(CLIENT_TYPE.PJ),
      document: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ is invalid'),
      ...baseClientFields,
    }),
  ]).safeParse(client);
  if (!validation.success) {
    const error = new Error(ERROR.INVALID_DATA);
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
      type: z.literal(CLIENT_TYPE.PF),
      document: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF is invalid'),
      ...baseClientFields,
    }),
    z.object({
      id: z.uuid(),
      type: z.literal(CLIENT_TYPE.PJ),
      document: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ is invalid'),
      ...baseClientFields,
    }),
  ]).safeParse(client);
  if (!validation.success) {
    const error = new Error(ERROR.INVALID_DATA);
    error.fields = z.flattenError(validation.error).fieldErrors;
    throw error;
  }
  const clientData = await dbUpdate(validation.data);
  return clientData;
}

export async function updateStatus(clients) {
  const validation = z.object({
    ids: z.array(z.uuid()).min(1, 'At least one id is required'),
    status: z.enum([CLIENT_STATUS.ACTIVE, CLIENT_STATUS.INACTIVE, CLIENT_STATUS.REMOVED]),
  }).safeParse(clients);
  if (!validation.success) {
    const error = new Error(ERROR.INVALID_DATA);
    error.fields = z.flattenError(validation.error).fieldErrors;
    throw error;
  }
  await dbUpdateStatus(validation.data);
  return validation.data;
}

export async function remove(id) {
  const validation = z.uuid().safeParse(id);
  if (!validation.success) {
    const error = new Error(ERROR.INVALID_DATA);
    error.fields = validation.error.issues[0].message;
    throw error;
  }
  await dbRemove(id);
}
