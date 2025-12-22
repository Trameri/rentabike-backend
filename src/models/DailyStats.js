import mongoose from 'mongoose';

const dailyStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
    index: true
  },
  
  // Statistiche contratti
  contracts: {
    created: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    returned: { type: Number, default: 0 }
  },
  
  // Statistiche finanziarie
  revenue: {
    total: { type: Number, default: 0 },
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    paypal: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // Statistiche noleggi
  rentals: {
    bikes: { type: Number, default: 0 },
    accessories: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    averageHours: { type: Number, default: 0 }
  },
  
  // Statistiche assicurazioni
  insurance: {
    totalSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },
  
  // Dettagli pagamenti
  payments: [{
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, {
  timestamps: true
});

// Indice composto per data e location (unico)
dailyStatsSchema.index({ date: 1, location: 1 }, { unique: true });

export default mongoose.model('DailyStats', dailyStatsSchema);