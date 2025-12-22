import express from 'express'
import { getAllUsers, getUserById, changeUserPassword } from '../controllers/userController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Tutte le route richiedono autenticazione
router.use(requireAuth)

// GET /api/users - Lista tutti gli utenti (solo superadmin)
router.get('/', getAllUsers)

// GET /api/users/:id - Dettagli utente specifico (solo superadmin)
router.get('/:id', getUserById)

// PUT /api/users/:id/password - Cambia password utente (solo superadmin)
router.put('/:id/password', changeUserPassword)

export default router