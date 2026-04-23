import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './lib/swagger.js';
import clientRouter from './route/client.js';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.debug(req.method, req.url);
  next();
});

app.get('/version', (req, res) => res.send(process.env.VERSION));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/client', clientRouter);

app.use((req, res) => {
  console.warn('Route not found:', req.method, req.url);
  res.status(404).send({ error: 'NOT-FOUND' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.info('Server running on port ' + port));
