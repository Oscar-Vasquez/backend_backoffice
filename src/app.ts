import express from 'express';
import cors from 'cors';
import emailRoutes from './routes/email.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rutas
app.use('/api/v1/email', emailRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error en la aplicación:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log('❌ Ruta no encontrada:', req.url);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app; 