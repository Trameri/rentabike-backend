import User from '../models/User.js'
import bcrypt from 'bcryptjs'

// GET /api/users - Lista tutti gli utenti (solo superadmin)
export const getAllUsers = async (req, res) => {
  try {
    // Verifica che l'utente sia superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accesso negato. Solo i superadmin possono vedere gli utenti.' })
    }

    const users = await User.find().populate('location').select('-password')
    res.json(users)
  } catch (error) {
    console.error('Errore nel recupero utenti:', error)
    res.status(500).json({ error: 'Errore del server' })
  }
}

// PUT /api/users/:id/password - Cambia password utente (solo superadmin)
export const changeUserPassword = async (req, res) => {
  try {
    // Verifica che l'utente sia superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accesso negato. Solo i superadmin possono cambiare le password.' })
    }

    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword) {
      return res.status(400).json({ error: 'Nuova password richiesta' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' })
    }

    // Trova l'utente
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' })
    }

    // Non permettere di cambiare password di altri superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Non puoi cambiare la password di altri superadmin' })
    }

    // Hash della nuova password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Aggiorna la password
    await User.findByIdAndUpdate(id, { password: hashedPassword })

    console.log(`Password cambiata per utente ${user.username} da ${req.user.username}`)
    
    res.json({ 
      message: 'Password cambiata con successo',
      user: user.username
    })
  } catch (error) {
    console.error('Errore nel cambio password:', error)
    res.status(500).json({ error: 'Errore del server' })
  }
}

// GET /api/users/:id - Dettagli utente specifico (solo superadmin)
export const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accesso negato' })
    }

    const user = await User.findById(req.params.id).populate('location').select('-password')
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' })
    }

    res.json(user)
  } catch (error) {
    console.error('Errore nel recupero utente:', error)
    res.status(500).json({ error: 'Errore del server' })
  }
}