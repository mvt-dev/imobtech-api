import { jest } from '@jest/globals';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  whereIn: jest.fn().mockReturnThis(),
  whereILike: jest.fn().mockReturnThis(),
  orWhereILike: jest.fn().mockReturnThis(),
  first: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  clone: jest.fn(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn(),
  select: jest.fn().mockReturnThis(),
};

const mockDb = jest.fn(() => mockQueryBuilder);

jest.unstable_mockModule('../lib/db.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('../lib/utils.js', () => ({
  uuid: jest.fn(() => 'test-uuid'),
}));

const { findAll, findById, create, update, updateStatus, remove } = await import('./client.js');

describe('Model: client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.mockReturnValue(mockQueryBuilder);
    Object.values(mockQueryBuilder).forEach((fn) => {
      if (typeof fn.mockReturnThis === 'function') fn.mockReturnThis();
    });
  });

  describe('findAll', () => {
    it('should return paginated results with default filters', async () => {
      const mockData = [{ id: '1', name: 'Alice' }];
      mockQueryBuilder.clone.mockReturnValue({ count: jest.fn().mockResolvedValue([{ count: '1' }]) });
      mockQueryBuilder.offset.mockResolvedValue(mockData);

      const result = await findAll({ status: 'ACTIVE', page: 1, page_size: 10 });

      expect(mockDb).toHaveBeenCalledWith('client');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('status', 'ACTIVE');
      expect(result).toEqual({ data: mockData, total: 1, page: 1, page_size: 10 });
    });

    it('should apply type filter when provided', async () => {
      mockQueryBuilder.clone.mockReturnValue({ count: jest.fn().mockResolvedValue([{ count: '0' }]) });
      mockQueryBuilder.offset.mockResolvedValue([]);

      await findAll({ status: 'ACTIVE', type: 'PF', page: 1, page_size: 10 });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('status', 'ACTIVE');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('type', 'PF');
    });

    it('should apply search filter when provided', async () => {
      mockQueryBuilder.clone.mockReturnValue({ count: jest.fn().mockResolvedValue([{ count: '0' }]) });
      mockQueryBuilder.offset.mockResolvedValue([]);

      await findAll({ status: 'ACTIVE', search: 'test', page: 1, page_size: 10 });

      expect(mockQueryBuilder.whereILike).toHaveBeenCalledWith('name', '%test%');
      expect(mockQueryBuilder.orWhereILike).toHaveBeenCalledWith('document', '%test%');
      expect(mockQueryBuilder.orWhereILike).toHaveBeenCalledWith('email', '%test%');
      expect(mockQueryBuilder.orWhereILike).toHaveBeenCalledWith('phone', '%test%');
    });
  });

  describe('findById', () => {
    it('should return client when found', async () => {
      const mockClient = { id: 'test-uuid', name: 'Alice' };
      mockQueryBuilder.first.mockResolvedValue(mockClient);

      const result = await findById('test-uuid');

      expect(mockDb).toHaveBeenCalledWith('client');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'test-uuid' });
      expect(result).toEqual(mockClient);
    });

    it('should return null when client not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should insert and return client with generated fields', async () => {
      mockQueryBuilder.insert.mockResolvedValue();

      const input = { type: 'PF', document: '123.456.789-00', name: 'Alice' };
      const result = await create(input);

      expect(result.id).toBe('test-uuid');
      expect(result.status).toBe('ACTIVE');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.name).toBe('Alice');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
    });

    it('should use provided status when given', async () => {
      mockQueryBuilder.insert.mockResolvedValue();

      const input = { type: 'PF', document: '123.456.789-00', name: 'Alice', status: 'INACTIVE' };
      const result = await create(input);

      expect(result.status).toBe('INACTIVE');
    });

    it('should throw DUPLICATED on unique constraint violation', async () => {
      const dbError = new Error('unique violation');
      dbError.code = '23505';
      mockQueryBuilder.insert.mockRejectedValue(dbError);

      const input = { type: 'PF', document: '123.456.789-00', name: 'Alice' };

      await expect(create(input)).rejects.toThrow('DUPLICATED');
    });

    it('should rethrow unknown errors', async () => {
      mockQueryBuilder.insert.mockRejectedValue(new Error('unknown'));

      await expect(create({ type: 'PF', document: '123.456.789-00', name: 'Alice' })).rejects.toThrow('unknown');
    });
  });

  describe('update', () => {
    it('should update and return client with updated_at', async () => {
      mockQueryBuilder.update.mockResolvedValue(1);

      const input = { id: 'test-uuid', type: 'PF', document: '123.456.789-00', name: 'Alice Updated' };
      const result = await update(input);

      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.name).toBe('Alice Updated');
    });

    it('should throw NOT-FOUND when no rows affected', async () => {
      mockQueryBuilder.update.mockResolvedValue(0);

      await expect(update({ id: 'non-existent', name: 'Test' })).rejects.toThrow('NOT-FOUND');
    });

    it('should throw DUPLICATED on unique constraint violation', async () => {
      const dbError = new Error('unique violation');
      dbError.code = '23505';
      mockQueryBuilder.update.mockRejectedValue(dbError);

      await expect(update({ id: 'test-uuid', name: 'Test' })).rejects.toThrow('DUPLICATED');
    });
  });

  describe('updateStatus', () => {
    it('should update status for multiple clients', async () => {
      mockQueryBuilder.update.mockResolvedValue(2);

      const result = await updateStatus({ ids: ['id1', 'id2'], status: 'INACTIVE' });

      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('id', ['id1', 'id2']);
      expect(result).toBe(2);
    });
  });

  describe('remove', () => {
    it('should soft remove client by setting status to REMOVED', async () => {
      mockQueryBuilder.update.mockResolvedValue(1);

      await remove('test-uuid');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'test-uuid' });
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'REMOVED' }),
      );
    });

    it('should throw NOT-FOUND when client does not exist', async () => {
      mockQueryBuilder.update.mockResolvedValue(0);

      await expect(remove('non-existent')).rejects.toThrow('NOT-FOUND');
    });
  });
});
