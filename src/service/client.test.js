import { jest } from '@jest/globals';

const mockModel = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
};

jest.unstable_mockModule('../model/client.js', () => ({
  findAll: mockModel.findAll,
  findById: mockModel.findById,
  create: mockModel.create,
  update: mockModel.update,
  updateStatus: mockModel.updateStatus,
  remove: mockModel.remove,
}));

const { findAll, findById, create, update, updateStatus, remove } = await import('./client.js');

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validPFClient = {
  type: 'PF',
  document: '123.456.789-00',
  name: 'Alice',
};

const validPJClient = {
  type: 'PJ',
  document: '12.345.678/0001-00',
  name: 'Company',
};

describe('Service: client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should apply defaults and call model', async () => {
      const mockResult = { data: [], total: 0, page: 1, page_size: 10 };
      mockModel.findAll.mockResolvedValue(mockResult);

      const result = await findAll({});

      expect(mockModel.findAll).toHaveBeenCalledWith({
        status: 'ACTIVE',
        page: 1,
        page_size: 10,
      });
      expect(result).toEqual(mockResult);
    });

    it('should pass all filters to model', async () => {
      mockModel.findAll.mockResolvedValue({ data: [], total: 0, page: 2, page_size: 5 });

      await findAll({ status: 'INACTIVE', type: 'PF', search: 'test', page: '2', page_size: '5' });

      expect(mockModel.findAll).toHaveBeenCalledWith({
        status: 'INACTIVE',
        type: 'PF',
        search: 'test',
        page: 2,
        page_size: 5,
      });
    });

    it('should throw INVALID-DATA for invalid status', async () => {
      await expect(findAll({ status: 'INVALID' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for page_size > 50', async () => {
      await expect(findAll({ page_size: '51' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for page < 1', async () => {
      await expect(findAll({ page: '0' })).rejects.toThrow('INVALID-DATA');
    });
  });

  describe('findById', () => {
    it('should return client when found', async () => {
      const mockClient = { id: VALID_UUID, name: 'Alice' };
      mockModel.findById.mockResolvedValue(mockClient);

      const result = await findById(VALID_UUID);

      expect(mockModel.findById).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toEqual(mockClient);
    });

    it('should throw NOT-FOUND when client does not exist', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(findById(VALID_UUID)).rejects.toThrow('NOT-FOUND');
    });
  });

  describe('create', () => {
    it('should validate and create PF client', async () => {
      mockModel.create.mockResolvedValue({ ...validPFClient, id: VALID_UUID });

      const result = await create(validPFClient);

      expect(mockModel.create).toHaveBeenCalledWith(validPFClient);
      expect(result.id).toBe(VALID_UUID);
    });

    it('should validate and create PJ client', async () => {
      mockModel.create.mockResolvedValue({ ...validPJClient, id: VALID_UUID });

      const result = await create(validPJClient);

      expect(mockModel.create).toHaveBeenCalledWith(validPJClient);
      expect(result.id).toBe(VALID_UUID);
    });

    it('should throw INVALID-DATA when name is missing', async () => {
      await expect(create({ type: 'PF', document: '123.456.789-00' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA when type is missing', async () => {
      await expect(create({ document: '123.456.789-00', name: 'Alice' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for invalid CPF mask', async () => {
      await expect(create({ type: 'PF', document: '12345678900', name: 'Alice' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for invalid CNPJ mask', async () => {
      await expect(create({ type: 'PJ', document: '12345678000100', name: 'Company' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for PF type with CNPJ document', async () => {
      await expect(create({ type: 'PF', document: '12.345.678/0001-00', name: 'Alice' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for PJ type with CPF document', async () => {
      await expect(create({ type: 'PJ', document: '123.456.789-00', name: 'Company' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for invalid email', async () => {
      await expect(create({ ...validPFClient, email: 'invalid' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for invalid phone mask', async () => {
      await expect(create({ ...validPFClient, phone: '11999999999' })).rejects.toThrow('INVALID-DATA');
    });

    it('should accept valid optional fields', async () => {
      const input = { ...validPFClient, email: 'alice@example.com', phone: '(11) 99999-9999', status: 'INACTIVE' };
      mockModel.create.mockResolvedValue({ ...input, id: VALID_UUID });

      const result = await create(input);

      expect(result).toBeDefined();
      expect(mockModel.create).toHaveBeenCalledWith(input);
    });

    it('should propagate DUPLICATED error from model', async () => {
      mockModel.create.mockRejectedValue(new Error('DUPLICATED'));

      await expect(create(validPFClient)).rejects.toThrow('DUPLICATED');
    });
  });

  describe('update', () => {
    it('should validate and update PF client', async () => {
      const input = { id: VALID_UUID, ...validPFClient };
      mockModel.update.mockResolvedValue(input);

      const result = await update(input);

      expect(mockModel.update).toHaveBeenCalledWith(input);
      expect(result).toEqual(input);
    });

    it('should validate and update PJ client', async () => {
      const input = { id: VALID_UUID, ...validPJClient };
      mockModel.update.mockResolvedValue(input);

      const result = await update(input);

      expect(mockModel.update).toHaveBeenCalledWith(input);
      expect(result).toEqual(input);
    });

    it('should throw INVALID-DATA when id is missing', async () => {
      await expect(update(validPFClient)).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA when id is not a valid UUID', async () => {
      await expect(update({ id: 'not-a-uuid', ...validPFClient })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA for invalid document', async () => {
      await expect(update({ id: VALID_UUID, type: 'PF', document: 'invalid', name: 'Alice' })).rejects.toThrow('INVALID-DATA');
    });

    it('should propagate NOT-FOUND error from model', async () => {
      mockModel.update.mockRejectedValue(new Error('NOT-FOUND'));

      await expect(update({ id: VALID_UUID, ...validPFClient })).rejects.toThrow('NOT-FOUND');
    });
  });

  describe('updateStatus', () => {
    it('should validate and update status for multiple clients', async () => {
      const input = { ids: [VALID_UUID], status: 'INACTIVE' };
      mockModel.updateStatus.mockResolvedValue();

      const result = await updateStatus(input);

      expect(mockModel.updateStatus).toHaveBeenCalledWith(input);
      expect(result).toEqual(input);
    });

    it('should throw INVALID-DATA when ids is empty', async () => {
      await expect(updateStatus({ ids: [], status: 'ACTIVE' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA when ids contains invalid UUID', async () => {
      await expect(updateStatus({ ids: ['not-a-uuid'], status: 'ACTIVE' })).rejects.toThrow('INVALID-DATA');
    });

    it('should throw INVALID-DATA when status is invalid', async () => {
      await expect(updateStatus({ ids: [VALID_UUID], status: 'INVALID' })).rejects.toThrow('INVALID-DATA');
    });

    it('should accept REMOVED as a valid status', async () => {
      const input = { ids: [VALID_UUID], status: 'REMOVED' };
      mockModel.updateStatus.mockResolvedValue();

      const result = await updateStatus(input);

      expect(result).toEqual(input);
    });
  });

  describe('remove', () => {
    it('should validate and call model remove', async () => {
      mockModel.remove.mockResolvedValue();

      await remove(VALID_UUID);

      expect(mockModel.remove).toHaveBeenCalledWith(VALID_UUID);
    });

    it('should throw INVALID-DATA when id is not a valid UUID', async () => {
      await expect(remove('not-a-uuid')).rejects.toThrow('INVALID-DATA');
    });

    it('should propagate NOT-FOUND error from model', async () => {
      mockModel.remove.mockRejectedValue(new Error('NOT-FOUND'));

      await expect(remove(VALID_UUID)).rejects.toThrow('NOT-FOUND');
    });
  });
});
