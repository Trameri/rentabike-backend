import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, create, update, remove, byBarcode, bulkCreate } from '../controllers/bikeController.js';
const r = Router();
r.use(requireAuth);
r.get('/', list);
r.post('/', create);
r.post('/bulk', bulkCreate); // Rotta per caricamento in batch
r.get('/barcode/:code', byBarcode);
r.put('/:id', update);
r.patch('/:id', update); // Aggiungiamo anche PATCH per aggiornamenti parziali
r.delete('/:id', remove);
export default r;
