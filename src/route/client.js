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

/**
 * @openapi
 * /client:
 *   get:
 *     tags: [Client]
 *     summary: List clients
 *     description: Lists clients with filtering and pagination, ordered by name.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, REMOVED]
 *           default: ACTIVE
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PF, PJ]
 *         description: Filter by type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: ILIKE search on name, document, email and phone
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of clients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedClients'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /client/{id}:
 *   get:
 *     tags: [Client]
 *     summary: Find client by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     responses:
 *       200:
 *         description: Client found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /client:
 *   post:
 *     tags: [Client]
 *     summary: Create a new client
 *     description: Creates a client. Use type PF with CPF document or type PJ with CNPJ document.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateClientPF'
 *               - $ref: '#/components/schemas/CreateClientPJ'
 *     responses:
 *       201:
 *         description: Client created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       409:
 *         description: Duplicated document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /client/{id}:
 *   put:
 *     tags: [Client]
 *     summary: Update an existing client
 *     description: Updates a client. Use type PF with CPF document or type PJ with CNPJ document.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateClientPF'
 *               - $ref: '#/components/schemas/CreateClientPJ'
 *     responses:
 *       200:
 *         description: Client updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicated document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /client/status:
 *   patch:
 *     tags: [Client]
 *     summary: Update status of multiple clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatus'
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateStatus'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /client/{id}:
 *   delete:
 *     tags: [Client]
 *     summary: Soft remove a client
 *     description: Sets the client status to REMOVED.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     responses:
 *       204:
 *         description: Client removed
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
