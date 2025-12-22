import { 
  getNotificationsForUser, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  getUnreadNotificationsCount 
} from '../utils/notificationHelper.js';

// Lista notifiche per l'utente corrente
export async function list(req, res) {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    
    const notifications = await getNotificationsForUser(req.user, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Errore lista notifiche:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notifiche' });
  }
}

// Conta notifiche non lette
export async function unreadCount(req, res) {
  try {
    const count = await getUnreadNotificationsCount(req.user);
    res.json({ count });
  } catch (error) {
    console.error('Errore conteggio notifiche non lette:', error);
    res.status(500).json({ error: 'Errore nel conteggio delle notifiche', count: 0 });
  }
}

// Marca una notifica come letta
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    
    const notification = await markNotificationAsRead(id, req.user);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Errore marcatura notifica come letta:', error);
    res.status(500).json({ error: 'Errore nella marcatura della notifica' });
  }
}

// Marca tutte le notifiche come lette
export async function markAllAsRead(req, res) {
  try {
    const result = await markAllNotificationsAsRead(req.user);
    
    res.json({ 
      success: true, 
      modifiedCount: result?.modifiedCount || 0 
    });
  } catch (error) {
    console.error('Errore marcatura tutte notifiche come lette:', error);
    res.status(500).json({ error: 'Errore nella marcatura delle notifiche' });
  }
}