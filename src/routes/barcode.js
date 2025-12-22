import express from 'express';
import bwipjs from 'bwip-js';
import Bike from '../models/Bike.js';
import Accessory from '../models/Accessory.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Genera barcode professionale in PNG ad alta qualità
router.get('/generate/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { format = 'png', width = 400, height = 100 } = req.query;
    
    let item;
    if (type === 'bike') {
      item = await Bike.findById(id);
    } else if (type === 'accessory') {
      item = await Accessory.findById(id);
    }
    
    if (!item) {
      return res.status(404).json({ error: 'Item non trovato' });
    }
    
    // Genera barcode Code128 professionale con bwip-js
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: item.barcode,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
      textsize: 14,
      backgroundcolor: 'FFFFFF'
    });
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${type}_${item.name}_${item.barcode}.png"`,
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Errore generazione barcode:', error);
    res.status(500).json({ error: 'Errore nella generazione del barcode' });
  }
});

// Genera barcode per stampa multipla
router.post('/generate-batch', requireAuth, async (req, res) => {
  try {
    const { items } = req.body; // Array di {type, id}
    const results = [];

    for (const itemData of items) {
      let item;
      if (itemData.type === 'bike') {
        item = await Bike.findById(itemData.id);
      } else if (itemData.type === 'accessory') {
        item = await Accessory.findById(itemData.id);
      }

      if (item) {
        const buffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: item.barcode,
          scale: 3,
          height: 12,
          includetext: true,
          textxalign: 'center',
          textsize: 14,
          backgroundcolor: 'FFFFFF'
        });

        results.push({
          id: item._id,
          name: item.name,
          barcode: item.barcode,
          type: itemData.type,
          image: `data:image/png;base64,${buffer.toString('base64')}`
        });
      }
    }

    res.json({ barcodes: results });
  } catch (error) {
    console.error('Errore generazione batch barcode:', error);
    res.status(500).json({ error: 'Errore nella generazione batch dei barcode' });
  }
});

// Rigenera barcode per un item esistente
router.post('/regenerate/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { username } = req.user;
    
    let item;
    let Model;
    
    if (type === 'bike') {
      Model = Bike;
    } else if (type === 'accessory') {
      Model = Accessory;
    } else {
      return res.status(400).json({ error: 'Tipo non valido' });
    }
    
    item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item non trovato' });
    }
    
    // Genera nuovo barcode
    const oldBarcode = item.barcode;
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newBarcode = `RB${timestamp.slice(-8)}${random}`;
    
    // Aggiorna item con nuovo barcode
    item.barcode = newBarcode;
    item.modificationHistory.push({
      action: 'barcode_regenerated',
      performedBy: username,
      details: { oldBarcode, newBarcode }
    });
    
    await item.save();
    
    res.json({ 
      message: 'Barcode rigenerato con successo',
      oldBarcode,
      newBarcode,
      item
    });
    
  } catch (error) {
    console.error('Errore rigenerazione barcode:', error);
    res.status(500).json({ error: 'Errore nella rigenerazione del barcode' });
  }
});

// Genera barcode da testo libero (senza DB)
router.get('/raw', async (req, res) => {
  try {
    const { text, scale = 3, height = 12 } = req.query;
    if (!text) return res.status(400).json({ error: 'Parametro text mancante' });

    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: String(text),
      scale: parseInt(scale, 10) || 3,
      height: parseInt(height, 10) || 12,
      includetext: true,
      textxalign: 'center',
      textsize: 14,
      backgroundcolor: 'FFFFFF'
    });

    res.set({ 'Content-Type': 'image/png' });
    res.send(buffer);
  } catch (error) {
    console.error('Errore generazione barcode raw:', error);
    res.status(500).json({ error: 'Errore nella generazione del barcode' });
  }
});

export default router;