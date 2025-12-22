import Notification from '../models/Notification.js';

// Crea notifica per creazione bici
export async function notifyBikeCreated(bikeData, user) {
  try {
    const notification = new Notification({
      type: 'bike_created',
      title: `Nuova bici creata: ${bikeData.name}`,
      message: `L'utente ${user.username} (${user.role}) ha creato una nuova bici "${bikeData.name}" presso ${user.location?.name || 'location sconosciuta'}`,
      data: {
        bikeId: bikeData._id,
        bikeName: bikeData.name,
        bikeBarcode: bikeData.barcode,
        bikeType: bikeData.type,
        priceHourly: bikeData.priceHourly,
        priceDaily: bikeData.priceDaily
      },
      sourceLocation: user.location?._id || user.locationId,
      sourceUser: user.username || user.role,
      sourceUserRole: user.role,
      targetRole: 'superadmin',
      priority: 'medium'
    });
    
    await notification.save();
    console.log('✅ Notifica bici creata inviata al superadmin');
    return notification;
  } catch (error) {
    console.error('❌ Errore creazione notifica bici:', error);
    return null;
  }
}

// Crea notifica per creazione accessorio
export async function notifyAccessoryCreated(accessoryData, user) {
  try {
    const notification = new Notification({
      type: 'accessory_created',
      title: `Nuovo accessorio creato: ${accessoryData.name}`,
      message: `L'utente ${user.username} (${user.role}) ha creato un nuovo accessorio "${accessoryData.name}" presso ${user.location?.name || 'location sconosciuta'}`,
      data: {
        accessoryId: accessoryData._id,
        accessoryName: accessoryData.name,
        accessoryBarcode: accessoryData.barcode,
        priceHourly: accessoryData.priceHourly,
        priceDaily: accessoryData.priceDaily
      },
      sourceLocation: user.location?._id || user.locationId,
      sourceUser: user.username || user.role,
      sourceUserRole: user.role,
      targetRole: 'superadmin',
      priority: 'medium'
    });
    
    await notification.save();
    console.log('✅ Notifica accessorio creato inviata al superadmin');
    return notification;
  } catch (error) {
    console.error('❌ Errore creazione notifica accessorio:', error);
    return null;
  }
}

// Crea notifica per modifica bici
export async function notifyBikeModified(bikeData, changes, user) {
  try {
    const notification = new Notification({
      type: 'bike_modified',
      title: `Bici modificata: ${bikeData.name}`,
      message: `L'utente ${user.username} (${user.role}) ha modificato la bici "${bikeData.name}" presso ${user.location?.name || 'location sconosciuta'}`,
      data: {
        bikeId: bikeData._id,
        bikeName: bikeData.name,
        bikeBarcode: bikeData.barcode,
        changes: changes
      },
      sourceLocation: user.location?._id || user.locationId,
      sourceUser: user.username || user.role,
      sourceUserRole: user.role,
      targetRole: 'superadmin',
      priority: 'low'
    });
    
    await notification.save();
    console.log('✅ Notifica modifica bici inviata al superadmin');
    return notification;
  } catch (error) {
    console.error('❌ Errore creazione notifica modifica bici:', error);
    return null;
  }
}

// Crea notifica per modifica accessorio
export async function notifyAccessoryModified(accessoryData, changes, user) {
  try {
    const notification = new Notification({
      type: 'accessory_modified',
      title: `Accessorio modificato: ${accessoryData.name}`,
      message: `L'utente ${user.username} (${user.role}) ha modificato l'accessorio "${accessoryData.name}" presso ${user.location?.name || 'location sconosciuta'}`,
      data: {
        accessoryId: accessoryData._id,
        accessoryName: accessoryData.name,
        accessoryBarcode: accessoryData.barcode,
        changes: changes
      },
      sourceLocation: user.location?._id || user.locationId,
      sourceUser: user.username || user.role,
      sourceUserRole: user.role,
      targetRole: 'superadmin',
      priority: 'low'
    });
    
    await notification.save();
    console.log('✅ Notifica modifica accessorio inviata al superadmin');
    return notification;
  } catch (error) {
    console.error('❌ Errore creazione notifica modifica accessorio:', error);
    return null;
  }
}

// Ottieni notifiche per un utente
export async function getNotificationsForUser(user, options = {}) {
  try {
    const { limit = 50, unreadOnly = false } = options;
    
    const filter = {
      targetRole: user.role
    };
    
    if (unreadOnly) {
      filter.read = false;
    }
    
    const notifications = await Notification.find(filter)
      .populate('sourceLocation', 'name code logoUrl')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return notifications;
  } catch (error) {
    console.error('❌ Errore recupero notifiche:', error);
    return [];
  }
}

// Marca notifica come letta
export async function markNotificationAsRead(notificationId, user) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
        readBy: user.username || user.role
      },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    console.error('❌ Errore marcatura notifica come letta:', error);
    return null;
  }
}

// Marca tutte le notifiche come lette per un utente
export async function markAllNotificationsAsRead(user) {
  try {
    const result = await Notification.updateMany(
      {
        targetRole: user.role,
        read: false
      },
      {
        read: true,
        readAt: new Date(),
        readBy: user.username || user.role
      }
    );
    
    return result;
  } catch (error) {
    console.error('❌ Errore marcatura tutte notifiche come lette:', error);
    return null;
  }
}

// Conta notifiche non lette
export async function getUnreadNotificationsCount(user) {
  try {
    const count = await Notification.countDocuments({
      targetRole: user.role,
      read: false
    });
    
    return count;
  } catch (error) {
    console.error('❌ Errore conteggio notifiche non lette:', error);
    return 0;
  }
}