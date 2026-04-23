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

/**
 * Lists clients with filtering and pagination.
 * @param {Object} query
 * @param {string} [query.status=ACTIVE] - Filter by status (ACTIVE, INACTIVE, REMOVED)
 * @param {string} [query.type] - Filter by type (PF, PJ)
 * @param {string} [query.search] - ILIKE search on name, document, email and phone
 * @param {number} [query.page=1] - Page number (min 1)
 * @param {number} [query.page_size=10] - Items per page (min 1, max 50)
 * @returns {Promise<{data: Object[], total: number, page: number, page_size: number}>}
 * @throws {Error} INVALID-DATA - When query params fail validation
 */
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

/**
 * Finds a client by id.
 * @param {string} id - Client UUID
 * @returns {Promise<Object>} Client object
 * @throws {Error} NOT-FOUND - When client does not exist
 */
export async function findById(id) {
  const client = await dbFindById(id);
  if (!client) {
    throw new Error(ERROR.NOT_FOUND);
  }
  return client;
}

/**
 * Creates a new client with validation.
 * @param {Object} client
 * @param {string} client.type - PF or PJ (discriminates document validation)
 * @param {string} client.document - CPF (XXX.XXX.XXX-XX) when PF, CNPJ (XX.XXX.XXX/XXXX-XX) when PJ
 * @param {string} client.name - Client name (min 1 char)
 * @param {string} [client.email] - Valid email
 * @param {string} [client.phone] - Phone with mask (XX) XXXXX-XXXX
 * @param {string} [client.status] - ACTIVE or INACTIVE
 * @returns {Promise<Object>} Created client
 * @throws {Error} INVALID-DATA - When body fails validation
 * @throws {Error} DUPLICATED - When document already exists
 */
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

/**
 * Updates an existing client with validation.
 * @param {Object} client
 * @param {string} client.id - Client UUID
 * @param {string} client.type - PF or PJ (discriminates document validation)
 * @param {string} client.document - CPF (XXX.XXX.XXX-XX) when PF, CNPJ (XX.XXX.XXX/XXXX-XX) when PJ
 * @param {string} client.name - Client name (min 1 char)
 * @param {string} [client.email] - Valid email
 * @param {string} [client.phone] - Phone with mask (XX) XXXXX-XXXX
 * @param {string} [client.status] - ACTIVE or INACTIVE
 * @returns {Promise<Object>} Updated client
 * @throws {Error} INVALID-DATA - When body fails validation
 * @throws {Error} NOT-FOUND - When client does not exist
 * @throws {Error} DUPLICATED - When document already exists
 */
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

/**
 * Updates the status of multiple clients.
 * @param {Object} clients
 * @param {string[]} clients.ids - Array of client UUIDs (min 1)
 * @param {string} clients.status - New status (ACTIVE, INACTIVE, REMOVED)
 * @returns {Promise<{ids: string[], status: string}>} Validated input data
 * @throws {Error} INVALID-DATA - When body fails validation
 */
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

/**
 * Soft removes a client by setting status to REMOVED.
 * @param {string} id - Client UUID
 * @throws {Error} INVALID-DATA - When id is not a valid UUID
 * @throws {Error} NOT-FOUND - When client does not exist
 */
export async function remove(id) {
  const validation = z.uuid().safeParse(id);
  if (!validation.success) {
    const error = new Error(ERROR.INVALID_DATA);
    error.fields = validation.error.issues[0].message;
    throw error;
  }
  await dbRemove(id);
}
