import { jest } from '@jest/globals';

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
};

jest.unstable_mockModule('../service/client.js', () => ({
  findAll: mockService.findAll,
  findById: mockService.findById,
  create: mockService.create,
  update: mockService.update,
  updateStatus: mockService.updateStatus,
  remove: mockService.remove,
}));

const express = (await import('express')).default;
const request = (await import('supertest')).default;
const clientRouter = (await import('./client.js')).default;

const app = express();
app.use(express.json());
app.use('/client', clientRouter);

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeError(message, fields) {
  const error = new Error(message);
  if (fields) error.fields = fields;
  return error;
}

describe('Route: client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /client', () => {
    it('should return 200 with paginated list', async () => {
      const mockResult = { data: [{ id: VALID_UUID, name: 'Alice' }], total: 1, page: 1, page_size: 10 };
      mockService.findAll.mockResolvedValue(mockResult);

      const res = await request(app).get('/client');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockResult);
      expect(mockService.findAll).toHaveBeenCalled();
    });

    it('should return 422 on validation error', async () => {
      mockService.findAll.mockRejectedValue(makeError('INVALID-DATA', { status: ['Invalid'] }));

      const res = await request(app).get('/client?status=WRONG');

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('INVALID-DATA');
    });

    it('should return 500 on internal error', async () => {
      mockService.findAll.mockRejectedValue(new Error('unexpected'));

      const res = await request(app).get('/client');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL');
    });
  });

  describe('GET /client/:id', () => {
    it('should return 200 with client', async () => {
      const mockClient = { id: VALID_UUID, name: 'Alice' };
      mockService.findById.mockResolvedValue(mockClient);

      const res = await request(app).get(`/client/${VALID_UUID}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockClient);
    });

    it('should return 404 when not found', async () => {
      mockService.findById.mockRejectedValue(makeError('NOT-FOUND'));

      const res = await request(app).get(`/client/${VALID_UUID}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT-FOUND');
    });

    it('should return 500 on internal error', async () => {
      mockService.findById.mockRejectedValue(new Error('unexpected'));

      const res = await request(app).get(`/client/${VALID_UUID}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL');
    });
  });

  describe('POST /client', () => {
    const validBody = { type: 'PF', document: '123.456.789-00', name: 'Alice' };

    it('should return 201 with created client', async () => {
      const mockClient = { ...validBody, id: VALID_UUID };
      mockService.create.mockResolvedValue(mockClient);

      const res = await request(app).post('/client').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockClient);
    });

    it('should return 422 on validation error', async () => {
      mockService.create.mockRejectedValue(makeError('INVALID-DATA', { name: ['Required'] }));

      const res = await request(app).post('/client').send({});

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('INVALID-DATA');
    });

    it('should return 409 on duplicated document', async () => {
      mockService.create.mockRejectedValue(makeError('DUPLICATED'));

      const res = await request(app).post('/client').send(validBody);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('DUPLICATED');
    });

    it('should return 500 on internal error', async () => {
      mockService.create.mockRejectedValue(new Error('unexpected'));

      const res = await request(app).post('/client').send(validBody);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL');
    });
  });

  describe('PUT /client/:id', () => {
    const validBody = { type: 'PF', document: '123.456.789-00', name: 'Alice Updated' };

    it('should return 200 with updated client', async () => {
      const mockClient = { id: VALID_UUID, ...validBody };
      mockService.update.mockResolvedValue(mockClient);

      const res = await request(app).put(`/client/${VALID_UUID}`).send(validBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockClient);
      expect(mockService.update).toHaveBeenCalledWith({ id: VALID_UUID, ...validBody });
    });

    it('should return 422 on validation error', async () => {
      mockService.update.mockRejectedValue(makeError('INVALID-DATA', { name: ['Required'] }));

      const res = await request(app).put(`/client/${VALID_UUID}`).send({});

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('INVALID-DATA');
    });

    it('should return 404 when not found', async () => {
      mockService.update.mockRejectedValue(makeError('NOT-FOUND'));

      const res = await request(app).put(`/client/${VALID_UUID}`).send(validBody);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT-FOUND');
    });

    it('should return 409 on duplicated document', async () => {
      mockService.update.mockRejectedValue(makeError('DUPLICATED'));

      const res = await request(app).put(`/client/${VALID_UUID}`).send(validBody);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('DUPLICATED');
    });

    it('should return 500 on internal error', async () => {
      mockService.update.mockRejectedValue(new Error('unexpected'));

      const res = await request(app).put(`/client/${VALID_UUID}`).send(validBody);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL');
    });
  });

  describe('PATCH /client/status', () => {
    it('should return 200 with updated data', async () => {
      const input = { ids: [VALID_UUID], status: 'INACTIVE' };
      mockService.updateStatus.mockResolvedValue(input);

      const res = await request(app).patch('/client/status').send(input);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(input);
    });

    it('should return 422 on validation error', async () => {
      mockService.updateStatus.mockRejectedValue(makeError('INVALID-DATA', { ids: ['Required'] }));

      const res = await request(app).patch('/client/status').send({});

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('INVALID-DATA');
    });

    it('should return 500 on internal error', async () => {
      mockService.updateStatus.mockRejectedValue(new Error('unexpected'));

      const res = await request(app).patch('/client/status').send({});

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL');
    });
  });

  describe('DELETE /client/:id', () => {
    it('should return 204 on success', async () => {
      mockService.remove.mockResolvedValue();

      const res = await request(app).delete(`/client/${VALID_UUID}`);

      expect(res.status).toBe(204);
      expect(mockService.remove).toHaveBeenCalledWith(VALID_UUID);
    });

    it('should return 422 on validation error', async () => {
      mockService.remove.mockRejectedValue(makeError('INVALID-DATA', { id: ['Invalid UUID'] }));

      const res = await request(app).delete('/client/not-a-uuid');

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('INVALID-DATA');
    });

    it('should return 404 when not found', async () => {
      mockService.remove.mockRejectedValue(makeError('NOT-FOUND'));

      const res = await request(app).delete(`/client/${VALID_UUID}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT-FOUND');
    });

    it('should return 500 on internal error', async () => {
      mockService.remove.mockRejectedValue(new Error('unexpected'));

      const res = await request(app).delete(`/client/${VALID_UUID}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL');
    });
  });
});
