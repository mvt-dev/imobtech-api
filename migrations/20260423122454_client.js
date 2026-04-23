export const up = function(knex) {
  return knex.schema.createTable('client', function(table) {
    table.string('id').primary();
    table.string('type').notNullable();
    table.string('document').unique().notNullable();
    table.string('name').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at');
    table.timestamp('updated_at');
    table.string('email');
    table.string('phone');
  });
};

export const down = function(knex) {
  return knex.schema.dropTable('client');
};
