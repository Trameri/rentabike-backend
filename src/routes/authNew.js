import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { login } from '../controllers/authController.js';
import User from '../models/User.js';

const r = Router();

// Utenti temporanei per quando MongoDB non è disponibile
const tempUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    username: 'superadmin',
    role: 'superadmin',
    location: null
  },
  {
    _id: '507f1f77bcf86cd799439012',
    username: 'cancano',
    role: 'admin',
    location: { _id: '507f1f77bcf86cd799439021', name: 'Cancano', code: 'CAN' }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    username: 'arnoga',
    role: 'admin',
    location: { _id: '507f1f77bcf86cd799439022', name: 'Arnoga', code: 'ARN' }
  },
  {
    _id: '507f1f77bcf86cd799439014',
    username: 'campo-sportivo',
    role: 'admin',
    location: { _id: '507f1f77bcf86cd799439023', name: 'Campo Sportivo', code: 'CSP' }
  }
];

// Endpoint di test per verificare che il server funzioni
r.get("/test", (req, res) => {
  res.json({ message: "Server funzionante!", timestamp: new Date().toISOString() });
});

// Login usando il controller
r.post('/login', login);

// Rotta per ottenere informazioni sull'utente corrente
r.get("/me", requireAuth, async (req, res) => {
  try {
    // req.user contiene i dati dal token JWT
    let user;
    
    try {
      // Prova prima con il database
      user = await User.findById(req.user.uid).populate('location');
    } catch (error) {
      console.log('Database non disponibile, uso utenti temporanei');
      // Fallback con utenti temporanei
      user = tempUsers.find(u => u._id === req.user.uid);
    }
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        location: user.location
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Errore server", message: err.message });
  }
});

export default r;