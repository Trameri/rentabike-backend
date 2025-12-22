import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { 
  create, 
  list, 
  byId, 
  close, 
  activeByBarcode, 
  history, 
  swapBike, 
  getSwapHistory,
  deleteContract, 
  returnItem,
  updateContract,
  cancelContract,
  getModificationHistory,
  updateItemPrices,
  completePayment
} from '../controllers/contractController.js';

const r = Router();
r.use(requireAuth);

// Routes esistenti
r.get('/', list);
r.get('/history', history);
r.get('/swap-history', getSwapHistory);
r.get('/active-by-barcode/:code', activeByBarcode);
r.get('/:id', byId);
r.post('/', create);
r.post('/swap-bike', swapBike);
r.post('/:id/close', close);
r.put('/:id/close', close);
r.post('/:id/return-item', returnItem);
r.post('/:id/complete-payment', completePayment); // Completa pagamento contratto restituito

// Nuove routes per admin
r.put('/:id', requireAdmin, updateContract); // Modifica contratto (tutti gli admin)
r.post('/:id/cancel', requireAdmin, cancelContract); // Annulla contratto (tutti gli admin)
r.delete('/:id', requireAdmin, deleteContract); // Elimina contratto (tutti gli admin)
r.get('/:id/modifications', getModificationHistory); // Storico modifiche
r.put('/:contractId/item-prices', requireAdmin, updateItemPrices); // Modifica prezzi item
r.put('/:contractId/update-item-price', requireAdmin, updateItemPrices); // Alias per compatibilità frontend

export default r;
