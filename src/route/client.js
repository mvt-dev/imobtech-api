import { Router } from 'express';
import { create, findAll, findById, update } from '../service/client.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const clients = await findAll();
    return res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await findById(req.params.id);
    return res.status(200).json(client);
  } catch (error) {
    if (error.message === 'NOT-FOUND') {
      console.warn(error);
      return res.status(404).json({ error: error.message, message: 'Client not found with id ' + req.params.id });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'INTERNAL' });
    }
  }
});

router.post('/', async (req, res) => {
  try {
    const client = await create(req.body);
    return res.status(201).json(client);
  } catch (error) {
    if (error.message === 'INVALID-DATA') {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else if (error.message === 'DUPLICATED') {
      console.warn(error);
      return res.status(409).json({ error: error.message, message: 'Client already exists with document ' + req.body.document });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'INTERNAL' });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const client = await update({ ...req.params, ...req.body });
    return res.status(200).json(client);
  } catch (error) {
    if (error.message === 'INVALID-DATA') {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else if (error.message === 'NOT-FOUND') {
      console.warn(error);
      return res.status(404).json({ error: error.message, message: 'Client not found with id ' + req.params.id });
    } else if (error.message === 'DUPLICATED') {
      console.warn(error);
      return res.status(409).json({ error: error.message, message: 'Client already exists with document ' + req.body.document });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'INTERNAL' });
    }
  }
});

export default router;
