import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['bike_created', 'accessory_created', 'bike_modified', 'accessory_modified', 'system_alert'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object }, // Dati aggiuntivi (es. ID bici, location, etc.)
  
  // Chi ha generato la notifica
  sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  sourceUser: { type: String, required: true }, // username
  sourceUserRole: { type: String, required: true },
  
  // A chi è destinata
  targetRole: { type: String, enum: ['superadmin', 'admin'], default: 'superadmin' },
  targetUser: { type: String }, // username specifico (opzionale)
  
  // Stato
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  readBy: { type: String },
  
  // Priorità
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Auto-expire dopo 30 giorni
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  }
}, { timestamps: true });

// Indici per performance
NotificationSchema.index({ targetRole: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ sourceLocation: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);