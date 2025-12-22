import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';

async function fixFinalAmounts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔧 Correzione finalAmount per escludere assicurazione...');

  // Trova tutti i contratti completati
  const contracts = await Contract.find({
    status: { $in: ['completed', 'returned'] }
  });

  console.log(`📊 Trovati ${contracts.length} contratti da correggere`);

  let updated = 0;
  for (const contract of contracts) {
    const oldFinalAmount = contract.finalAmount;
    const subtotal = contract.totals?.subtotal;
    
    if (subtotal !== undefined && subtotal !== null) {
      // Aggiorna finalAmount per usare solo subtotal (senza assicurazione)
      contract.finalAmount = subtotal;
      
      // Aggiorna anche grandTotal per coerenza
      if (contract.totals) {
        contract.totals.grandTotal = subtotal;
      }
      
      await contract.save();
      updated++;
      
      console.log(`✅ Contratto ${contract._id}: ${oldFinalAmount} → ${subtotal}`);
    } else {
      console.log(`⚠️ Contratto ${contract._id}: subtotal non trovato`);
    }
  }

  console.log(`🎉 Aggiornati ${updated} contratti`);
  await mongoose.disconnect();
}

fixFinalAmounts().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});