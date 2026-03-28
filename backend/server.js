import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import courseRoutes from './routes/courseRoutes.js';

dotenv.config({ path: '../.env' });

connectDB();

const app = express();

// Enable CORS
app.use(cors());

app.get('/', (req, res) => {
  res.send('<h1>SDU Parser Backend</h1>');
});

// Mount router
app.use('/api/courses', courseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
