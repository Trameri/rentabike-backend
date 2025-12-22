import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Chiave segreta per JWT (in produzione usa una variabile d'ambiente)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Endpoint di test per verificare che il server funzioni
router.get("/test", (req, res) => {
  res.json({ message: "Server funzionante!", timestamp: new Date().toISOString() });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).populate('location');

    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Verifica la password con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Genera il token JWT
    const token = jwt.sign(
      { 
        uid: user._id, 
        username: user.username, 
        role: user.role,
        locationId: user.location?._id || null,
        locationCode: user.location?.code || null
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login riuscito",
      token: token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Errore server", message: err.message });
  }
});

// Rotta per ottenere informazioni sull'utente corrente
router.get("/me", requireAuth, async (req, res) => {
  try {
    // req.user contiene i dati dal token JWT
    const user = await User.findById(req.user.uid).populate('location');
    
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

export default router;
