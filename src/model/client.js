import db from '../lib/db.js';
import { uuid } from '../lib/utils.js';
import { CLIENT_STATUS } from '../constant/client.js';
import { ERROR } from '../constant/error.js';

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

export async function findById(id) {
  const client = await db('client').where({ id }).first();
  return client || null;
}

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

export async function updateStatus(clients) {
  return db('client').whereIn('id', clients.ids).update({
    status: clients.status,
    updated_at: new Date(),
  });
}

export async function remove(id) {
  const returning = await db('client').where({ id }).update({
    status: CLIENT_STATUS.REMOVED,
    updated_at: new Date(),
  });
  if (!returning) throw new Error(ERROR.NOT_FOUND);
}
