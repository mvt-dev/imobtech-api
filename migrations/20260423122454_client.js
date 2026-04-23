export const up = function(knex) {
  return knex.schema.createTable('client', function(table) {
    table.string('id').primary();
    table.string('type').notNullable();
    table.string('document').unique().notNullable();
    table.string('name').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('email');
    table.string('phone');
  });
};

export const down = function(knex) {
  return knex.schema.dropTable('client');
};
