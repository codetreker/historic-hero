import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import factionsRouter from './routes/factions.js';
import personsRouter from './routes/persons.js';
import eventsRouter from './routes/events.js';
import searchRouter from './routes/search.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/factions', factionsRouter);
app.use('/api/persons', personsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/search', searchRouter);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
