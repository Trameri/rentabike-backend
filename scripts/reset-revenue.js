import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function resetRevenue() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔄 Azzeramento fatturato per location Cancano...');

  // Trova la location Cancano
  const cancanoLocation = await Location.findOne({ code: 'cancano' });
  
  if (!cancanoLocation) {
    console.log('❌ Location Cancano non trovata');
    await mongoose.disconnect();
    return;
  }

  const result = await Contract.updateMany(
    { 
      location: cancanoLocation._id,
      status: { $in: ['completed', 'returned'] } 
    },
    { 
      $set: { 
        finalAmount: 0,
        totals: {
          bikesTotal: 0,
          insuranceTotal: 0,
          extrasTotal: 0,
          grandTotal: 0
        }
      } 
    }
  );

  console.log(`✅ Azzerati ${result.modifiedCount} contratti per Cancano`);
  await mongoose.disconnect();
}

resetRevenue().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});