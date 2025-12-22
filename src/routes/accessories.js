import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, create, update, remove, byBarcode } from '../controllers/accessoryController.js';
const r = Router();
r.use(requireAuth);
r.get('/', list);
r.post('/', create);
r.get('/barcode/:code', byBarcode);
r.put('/:id', update);
r.patch('/:id', update); // Aggiungiamo anche PATCH per aggiornamenti parziali
r.delete('/:id', remove);
export default r;
