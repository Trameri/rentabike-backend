import mongoose from 'mongoose';

// Funzione per generare barcode Code128 professionale
function generateProfessionalBarcode() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RB${timestamp.slice(-8)}${random}`; // RB + 8 cifre timestamp + 4 cifre random
}

const BikeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photoUrl: String,
  barcode: { 
    type: String, 
    required: true, 
    unique: true,
    default: generateProfessionalBarcode
  },
  barcodeFormat: { type: String, default: 'CODE128' }, // Formato barcode professionale
  type: { type: String, enum: ['ebike-full','ebike-front','ebike-other','muscolare','altro'], required: true },
  priceHourly: { type: Number, required: true, min: 0 },
  priceDaily: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['available','in-use','maintenance','loan','reserved'], default: 'available' },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  // Campi per tracciamento acquisto e ROI
  purchaseDate: { type: Date },
  purchasePrice: { type: Number, min: 0 },
  model: { type: String },
  brand: { type: String }, // Marca della bici
  frameNumber: { type: String }, // Numero telaio
  totalRevenue: { type: Number, default: 0 }, // Ricavi totali generati da questa bici
  totalRentals: { type: Number, default: 0 }, // Numero totale di noleggi
  totalHours: { type: Number, default: 0 }, // Ore totali di utilizzo
  modificationHistory: [{
    date: { type: Date, default: Date.now },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    details: { type: Object }
  }]
}, { timestamps: true });
export default mongoose.model('Bike', BikeSchema);
