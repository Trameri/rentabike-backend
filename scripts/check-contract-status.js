import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';

async function checkContractStatus() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Verifica status contratto da €505...');

  const contract = await Contract.findById('68b9df0314427de3734fcd28');
  
  if (!contract) {
    console.log('❌ Contratto non trovato');
    await mongoose.disconnect();
    return;
  }

  console.log(`📋 Dettagli contratto:`);
  console.log(`  ID: ${contract._id}`);
  console.log(`  Status: ${contract.status}`);
  console.log(`  PaymentCompleted: ${contract.paymentCompleted}`);
  console.log(`  FinalAmount: ${contract.finalAmount}`);
  console.log(`  Subtotal: ${contract.totals?.subtotal}`);
  console.log(`  Created: ${contract.createdAt}`);
  
  // Verifica se soddisfa i criteri del summary
  const matchesSummaryFilter = 
    contract.status === 'completed' || 
    (contract.status === 'returned' && contract.paymentCompleted === true);
    
  console.log(`\n🎯 Soddisfa filtro summary: ${matchesSummaryFilter}`);
  
  if (!matchesSummaryFilter) {
    console.log('⚠️ Il contratto non viene incluso nel summary perché:');
    if (contract.status !== 'completed' && contract.status !== 'returned') {
      console.log(`  - Status è "${contract.status}" invece di "completed" o "returned"`);
    }
    if (contract.status === 'returned' && contract.paymentCompleted !== true) {
      console.log(`  - Status è "returned" ma paymentCompleted è ${contract.paymentCompleted}`);
    }
  }
  
  await mongoose.disconnect();
}

checkContractStatus().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});