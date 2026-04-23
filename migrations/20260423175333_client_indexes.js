export const up = function(knex) {
  return knex.schema.alterTable('client', function(table) {
    table.index('status', 'idx_client_status');
    table.index('type', 'idx_client_type');
    table.index('name', 'idx_client_name');
    table.index('email', 'idx_client_email');
    table.index('phone', 'idx_client_phone');
  });
};

export const down = function(knex) {
  return knex.schema.alterTable('client', function(table) {
    table.dropIndex('status', 'idx_client_status');
    table.dropIndex('type', 'idx_client_type');
    table.dropIndex('name', 'idx_client_name');
    table.dropIndex('email', 'idx_client_email');
    table.dropIndex('phone', 'idx_client_phone');
  });
};
