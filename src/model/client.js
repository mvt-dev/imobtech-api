import db from '../lib/db.js';
import { uuid } from '../lib/utils.js';
import { CLIENT_STATUS } from '../constant/client.js';
import { ERROR } from '../constant/error.js';

/**
 * Lists clients with filtering and pagination.
 * @param {Object} filters
 * @param {string} filters.status - Client status (ACTIVE, INACTIVE, REMOVED)
 * @param {string} [filters.type] - Client type (PF, PJ)
 * @param {string} [filters.search] - ILIKE search on name, document, email and phone
 * @param {number} filters.page - Page number (1-indexed)
 * @param {number} filters.page_size - Items per page
 * @returns {Promise<{data: Object[], total: number, page: number, page_size: number}>}
 */
export async function findAll(filters) {
  const query = db('client').where('status', filters.status);
  if (filters.type) {
    query.where('type', filters.type);
  }
  if (filters.search) {
    const search = `%${filters.search}%`;
    query.whereILike('name', search)
      .orWhereILike('document', search)
      .orWhereILike('email', search)
      .orWhereILike('phone', search);
  }
  const [{ count }] = await query.clone().count();
  const total = Number(count);
  const offset = (filters.page - 1) * filters.page_size;
  const data = await query.orderBy('name').limit(filters.page_size).offset(offset);
  return { data, total, page: filters.page, page_size: filters.page_size };
}

/**
 * Finds a client by id.
 * @param {string} id - Client UUID
 * @returns {Promise<Object|null>} Client object or null if not found
 */
export async function findById(id) {
  const client = await db('client').where({ id }).first();
  return client || null;
}

/**
 * Inserts a new client.
 * @param {Object} client
 * @param {string} client.type - PF or PJ
 * @param {string} client.document - CPF or CNPJ with mask
 * @param {string} client.name - Client name
 * @param {string} [client.email] - Client email
 * @param {string} [client.phone] - Client phone with mask (XX) XXXXX-XXXX
 * @param {string} [client.status] - Initial status (defaults to ACTIVE)
 * @returns {Promise<Object>} Created client with generated id, status and created_at
 * @throws {Error} DUPLICATED - When document already exists
 */
export async function create(client) {
  const clientData = {
    ...client,
    id: uuid(),
    status: client.status || CLIENT_STATUS.ACTIVE,
    created_at: new Date(),
  };
  try {
    await db('client').insert(clientData);
  } catch (error) {
    if (error.code === '23505') {
      const _error = new Error(ERROR.DUPLICATED);
      _error.details = error.message;
      throw _error;
    } else {
      throw error;
    }
  }
  return clientData;
}

/**
 * Updates an existing client.
 * @param {Object} client
 * @param {string} client.id - Client UUID
 * @param {string} client.type - PF or PJ
 * @param {string} client.document - CPF or CNPJ with mask
 * @param {string} client.name - Client name
 * @param {string} [client.email] - Client email
 * @param {string} [client.phone] - Client phone with mask (XX) XXXXX-XXXX
 * @param {string} [client.status] - ACTIVE or INACTIVE
 * @returns {Promise<Object>} Updated client with updated_at
 * @throws {Error} NOT-FOUND - When client does not exist
 * @throws {Error} DUPLICATED - When document already exists
 */
export async function update(client) {
  const clientData = {
    ...client,
    updated_at: new Date(),
  };
  try {
    const returning = await db('client').where({ id: client.id }).update(clientData);
    if (!returning) throw new Error(ERROR.NOT_FOUND);
  } catch (error) {
    if (error.code === '23505') {
      const _error = new Error(ERROR.DUPLICATED);
      _error.details = error.message;
      throw _error;
    } else {
      throw error;
    }
  }
  return clientData;
}

/**
 * Updates the status of multiple clients.
 * @param {Object} clients
 * @param {string[]} clients.ids - Array of client UUIDs
 * @param {string} clients.status - New status (ACTIVE, INACTIVE, REMOVED)
 * @returns {Promise<number>} Number of affected rows
 */
export async function updateStatus(clients) {
  return db('client').whereIn('id', clients.ids).update({
    status: clients.status,
    updated_at: new Date(),
  });
}

/**
 * Soft removes a client by setting status to REMOVED.
 * @param {string} id - Client UUID
 * @throws {Error} NOT-FOUND - When client does not exist
 */
export async function remove(id) {
  const returning = await db('client').where({ id }).update({
    status: CLIENT_STATUS.REMOVED,
    updated_at: new Date(),
  });
  if (!returning) throw new Error(ERROR.NOT_FOUND);
}
