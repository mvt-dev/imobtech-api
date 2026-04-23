import 'dotenv/config';

export default {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
  },
  migrations: {
    directory: './migrations'
  },
};
