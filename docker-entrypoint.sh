#!/bin/bash
set -e

PG_DATA="/var/lib/postgresql/data"
PG_LOG="/var/log/postgresql/postgresql.log"

mkdir -p /var/log/postgresql
chown postgres:postgres /var/log/postgresql

# Initialize PostgreSQL if needed
if [ ! -d "$PG_DATA" ]; then
  mkdir -p "$PG_DATA"
  chown postgres:postgres "$PG_DATA"
  sudo -u postgres /usr/lib/postgresql/*/bin/initdb -D "$PG_DATA"
fi

# Start PostgreSQL
sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl -D "$PG_DATA" -l "$PG_LOG" start

# Wait for PostgreSQL to be ready
until sudo -u postgres pg_isready -q; do
  echo "Waiting for PostgreSQL..."
  sleep 1
done

# Create database and user if they don't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='imobtech'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER imobtech WITH PASSWORD 'imobtech';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='imobtech'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE imobtech OWNER imobtech;"

# Run migrations
npx knex migrate:latest

echo "Starting application..."
exec node src/index.js
