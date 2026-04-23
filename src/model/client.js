import db from '../lib/db.js';
import { uuid } from '../lib/utils.js';

export async function findAll() {
  return db('client').select('*');
}

export async function findById(id) {
  const client = await db('client').where({ id }).first();
  return client || null;
}

export async function create(client) {
  const clientData = {
    ...client,
    id: uuid(),
    status: 'ACTIVE',
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
