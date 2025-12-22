import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  getDailyReportController, 
  getPeriodReport, 
  getDashboardStats 
} from '../controllers/statsController.js';

const r = Router();
r.use(requireAuth);

// Report giornaliero
r.get('/daily', getDailyReportController);

// Report per periodo
r.get('/period', getPeriodReport);

// Statistiche dashboard
r.get('/dashboard', getDashboardStats);

export default r;