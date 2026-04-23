import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ImobTech API',
      version: '1.0.0',
      description: 'ImobTech REST API for client management',
    },
    components: {
      schemas: {
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['PF', 'PJ'] },
            document: { type: 'string', description: 'CPF (XXX.XXX.XXX-XX) for PF or CNPJ (XX.XXX.XXX/XXXX-XX) for PJ' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', description: 'Phone with mask (XX) XXXXX-XXXX' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'REMOVED'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateClientPF: {
          type: 'object',
          required: ['type', 'document', 'name'],
          properties: {
            type: { type: 'string', enum: ['PF'] },
            document: { type: 'string', example: '123.456.789-00', description: 'CPF with mask' },
            name: { type: 'string', example: 'Alice' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            phone: { type: 'string', example: '(11) 99999-9999' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        CreateClientPJ: {
          type: 'object',
          required: ['type', 'document', 'name'],
          properties: {
            type: { type: 'string', enum: ['PJ'] },
            document: { type: 'string', example: '12.345.678/0001-00', description: 'CNPJ with mask' },
            name: { type: 'string', example: 'Company' },
            email: { type: 'string', format: 'email', example: 'contact@company.com' },
            phone: { type: 'string', example: '(11) 3333-4444' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        UpdateStatus: {
          type: 'object',
          required: ['ids', 'status'],
          properties: {
            ids: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'REMOVED'] },
          },
        },
        PaginatedClients: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            page_size: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'INVALID-DATA' },
            message: { type: 'object', description: 'Field errors' },
          },
        },
      },
    },
  },
  apis: ['./src/route/*.js'],
};

export default swaggerJsdoc(options);
