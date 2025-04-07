import app from './app';
import { initializeFirebase } from './config/firebase.config';

const PORT = process.env.PORT || 3001;

// Inicializar Firebase
initializeFirebase();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('🔥 Firebase inicializado');
}); 