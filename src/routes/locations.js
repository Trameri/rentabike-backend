import { Router } from 'express';
import { list } from '../controllers/locationController.js';
const r = Router();
r.get('/', list);
export default r;
