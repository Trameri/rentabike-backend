import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';

async function restore505Contract() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔧 Ripristino contratto da €505...');

  // Trova il contratto specifico
  const contract = await Contract.findById('68b9df0314427de3734fcd28');
  
  if (!contract) {
    console.log('❌ Contratto non trovato');
    await mongoose.disconnect();
    return;
  }

  console.log(`📋 Contratto trovato:`);
  console.log(`  FinalAmount attuale: ${contract.finalAmount}`);
  console.log(`  Subtotal: ${contract.totals?.subtotal}`);
  
  // Ripristina il finalAmount corretto
  contract.finalAmount = 505;
  await contract.save();
  
  console.log(`✅ FinalAmount ripristinato a €505`);
  
  await mongoose.disconnect();
}

restore505Contract().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});