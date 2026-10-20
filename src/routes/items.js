import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { lookup } from '../controllers/itemController.js';

const r = Router();
r.use(requireAuth);
r.get('/lookup', lookup);

export default r;
