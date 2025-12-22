import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { requireAuth } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Crea la cartella uploads se non esiste
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configurazione multer per l'upload delle immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    // Genera un nome file unico
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    cb(null, 'accessory-' + uniqueSuffix + extension)
  }
})

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Solo file immagine sono permessi!'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
})

// Endpoint per upload immagine
router.post('/image', requireAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' })
    }

    // Costruisci l'URL dell'immagine
    const imageUrl = `/uploads/${req.file.filename}`
    
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    })
  } catch (error) {
    console.error('Errore upload immagine:', error)
    res.status(500).json({ error: 'Errore durante l\'upload dell\'immagine' })
  }
})

// Endpoint per eliminare immagine
router.delete('/image/:filename', requireAuth, (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(uploadsDir, filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true, message: 'Immagine eliminata' })
    } else {
      res.status(404).json({ error: 'File non trovato' })
    }
  } catch (error) {
    console.error('Errore eliminazione immagine:', error)
    res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'immagine' })
  }
})

export default router