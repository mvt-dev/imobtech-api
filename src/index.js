import 'dotenv/config';
import express from 'express';

const app = express();

app.use(express.json()); 

app.get('/version', (req, res) => res.send(process.env.VERSION));

app.use((req, res) => res.status(404).send({ error: 'NOT-FOUND' }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.info('Server running on port ' + port));
