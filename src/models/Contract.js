import mongoose from 'mongoose';

const ContractItemSchema = new mongoose.Schema({
  kind: { type: String, enum: ['bike','accessory'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'items.kindRef' },
  kindRef: { type: String, enum: ['Bike','Accessory'], required: true },
  name: String,
  barcode: String,
  priceHourly: Number,
  priceDaily: Number,
  originalPriceHourly: Number, // Prezzo orario originale dell'item
  originalPriceDaily: Number,  // Prezzo giornaliero originale dell'item
  insurance: { type: Boolean, default: false },
  insuranceFlat: { type: Number, default: 0 },
  returnedAt: { type: Date },
  returnNotes: { type: String }
}, { _id: true }); // Abilita _id per gli item

const ContractSchema = new mongoose.Schema({
  customer: { 
    name: String, 
    phone: String, 
    idFrontUrl: String, 
    idBackUrl: String, 
    ocr: { type: Object, default: {} } 
  },
  documentPhotos: {
    idFront: String,
    idBack: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  items: [ContractItemSchema],
  startAt: { type: Date, default: ()=>new Date() },
  endAt: { type: Date },
  status: { type: String, enum: ['reserved','in-use','returned','completed','closed','cancelled'], default: 'in-use' },
  paymentMethod: { type: String, enum: ['cash','card','bank_transfer','paypal','stripe','other',null], default: null },
  paid: { type: Boolean, default: false },
  paymentCompleted: { type: Boolean, default: false },
  paymentDate: { type: Date },
  paymentLink: { type: String },
  paymentNotes: { type: String },
  isReservation: { type: Boolean, default: false },
  wasReserved: { type: Boolean, default: false }, // Traccia se il contratto era originariamente una prenotazione
  actualStartAt: { type: Date },
  finalPrice: { type: Number },
  finalAmount: { type: Number }, // Prezzo calcolato al momento della restituzione
  closureNotes: { type: String },
  notes: String,
  totals: { subtotal: { type: Number, default: 0 }, insurance: { type: Number, default: 0 }, grandTotal: { type: Number, default: 0 } },
  reservationPrepaid: { type: Boolean, default: false },
  swapHistory: [{ 
    date: Date, 
    oldBike: { id: String, name: String, barcode: String }, 
    newBike: { id: String, name: String, barcode: String }, 
    reason: String, 
    performedBy: String 
  }],
  modificationHistory: [{
    date: { type: Date, default: Date.now },
    action: { type: String, required: true }, // 'created', 'modified', 'cancelled', 'deleted', 'item_swapped'
    performedBy: { type: String, required: true }, // username
    details: { type: Object }, // dettagli della modifica
    oldValues: { type: Object }, // valori precedenti
    newValues: { type: Object }  // nuovi valori
  }],
  createdBy: { type: String, required: true },
  lastModifiedBy: { type: String }
}, { timestamps: true });

export default mongoose.model('Contract', ContractSchema);
