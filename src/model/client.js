import db from '../lib/db.js';
import { uuid } from '../lib/utils.js';

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
  return query;
}

export async function findById(id) {
  const client = await db('client').where({ id }).first();
  return client || null;
}

export async function create(client) {
  const clientData = {
    ...client,
    id: uuid(),
    status: client.status || 'ACTIVE',
    created_at: new Date(),
  };
  try {
    await db('client').insert(clientData);
  } catch (error) {
    if (error.code === '23505') {
      const _error = new Error('DUPLICATED');
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
    if (!returning) throw new Error('NOT-FOUND');
  } catch (error) {
    if (error.code === '23505') {
      const _error = new Error('DUPLICATED');
      _error.details = error.message;
      throw _error;
    } else {
      throw error;
    }
  }
  return clientData;
}

export async function remove(id) {
  const returning = await db('client').where({ id }).update({
    status: 'REMOVED',
    updated_at: new Date(),
  });
  if (!returning) throw new Error('NOT-FOUND');
}
