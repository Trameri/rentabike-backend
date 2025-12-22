import mongoose from 'mongoose';

// Funzione per generare barcode Code128 professionale per accessori
function generateAccessoryBarcode() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `AC${timestamp.slice(-8)}${random}`; // AC + 8 cifre timestamp + 4 cifre random
}

const AccessorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  photoUrl: String,
  barcode: { 
    type: String, 
    required: true, 
    unique: true,
    default: generateAccessoryBarcode
  },
  barcodeFormat: { type: String, default: 'CODE128' }, // Formato barcode professionale
  priceHourly: { type: Number, required: true, min: 0 },
  priceDaily: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['available','in-use','maintenance','loan','reserved'], default: 'available' },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  modificationHistory: [{
    date: { type: Date, default: Date.now },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    details: { type: Object }
  }]
}, { timestamps: true });
export default mongoose.model('Accessory', AccessorySchema);
