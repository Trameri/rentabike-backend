import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(requireAuth);

// Lista notifiche
router.get('/', notificationController.list);

// Conta notifiche non lette
router.get('/unread-count', notificationController.unreadCount);

// Marca una notifica come letta
router.patch('/:id/read', notificationController.markAsRead);

// Marca tutte le notifiche come lette
router.patch('/mark-all-read', notificationController.markAllAsRead);

export default router;