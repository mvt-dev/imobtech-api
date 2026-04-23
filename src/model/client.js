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
  const clientData = { ...client, id: uuid() };
  try {
    await db('client').insert({
      ...clientData,
      status: 'ACTIVE',
      created_at: db.fn.now(),
    });
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
