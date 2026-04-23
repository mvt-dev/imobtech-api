import { Router } from 'express';
import { ERROR } from '../constant/error.js';
import {
  create,
  findAll,
  findById,
  update,
  updateStatus,
  remove
} from '../service/client.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const clients = await findAll(req.query);
    return res.status(200).json(clients);
  } catch (error) {
    if (error.message === ERROR.INVALID_DATA) {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else {
      console.error(error);
      return res.status(500).json({ error: ERROR.INTERNAL });
    }
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await findById(req.params.id);
    return res.status(200).json(client);
  } catch (error) {
    if (error.message === ERROR.NOT_FOUND) {
      console.warn(error);
      return res.status(404).json({ error: error.message, message: 'Client not found with id ' + req.params.id });
    } else {
      console.error(error);
      return res.status(500).json({ error: ERROR.INTERNAL });
    }
  }
});

router.post('/', async (req, res) => {
  try {
    const client = await create(req.body);
    return res.status(201).json(client);
  } catch (error) {
    if (error.message === ERROR.INVALID_DATA) {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else if (error.message === ERROR.DUPLICATED) {
      console.warn(error);
      return res.status(409).json({ error: error.message, message: 'Client already exists with document ' + req.body.document });
    } else {
      console.error(error);
      return res.status(500).json({ error: ERROR.INTERNAL });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const client = await update({ ...req.params, ...req.body });
    return res.status(200).json(client);
  } catch (error) {
    if (error.message === ERROR.INVALID_DATA) {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else if (error.message === ERROR.NOT_FOUND) {
      console.warn(error);
      return res.status(404).json({ error: error.message, message: 'Client not found with id ' + req.params.id });
    } else if (error.message === ERROR.DUPLICATED) {
      console.warn(error);
      return res.status(409).json({ error: error.message, message: 'Client already exists with document ' + req.body.document });
    } else {
      console.error(error);
      return res.status(500).json({ error: ERROR.INTERNAL });
    }
  }
});

router.patch('/status', async (req, res) => {
  try {
    const updated = await updateStatus(req.body);
    return res.status(200).json(updated);
  } catch (error) {
    if (error.message === ERROR.INVALID_DATA) {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else {
      console.error(error);
      return res.status(500).json({ error: ERROR.INTERNAL });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await remove(req.params.id);
    return res.status(204).send();
  } catch (error) {
    if (error.message === ERROR.INVALID_DATA) {
      console.warn(error);
      return res.status(422).json({ error: error.message, message: error.fields });
    } else if (error.message === ERROR.NOT_FOUND) {
      console.warn(error);
      return res.status(404).json({ error: error.message, message: 'Client not found with id ' + req.params.id });
    } else {
      console.error(error);
      return res.status(500).json({ error: ERROR.INTERNAL });
    }
  }
});

export default router;
