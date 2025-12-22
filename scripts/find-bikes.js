import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function findBikes() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Ricerca bici nei contratti...');

  const contracts = await Contract.find({}).limit(10);
  
  console.log(`\n📋 Trovati ${contracts.length} contratti`);
  
  contracts.forEach((contract, i) => {
    console.log(`\n${i + 1}. Contratto ${contract._id.toString().slice(-6)}:`);
    console.log(`   FinalAmount: €${contract.finalAmount}`);
    console.log(`   Totals:`, contract.totals);
    
    if (contract.items && contract.items.length > 0) {
      console.log(`   Items:`);
      contract.items.forEach((item, j) => {
        console.log(`     ${j + 1}. ${item.name} (${item.kind}) - €${item.priceHourly}/h €${item.priceDaily}/g`);
        if (item.insurance) {
          console.log(`        + Assicurazione: €${item.insuranceFlat || 5}`);
        }
      });
    }
  });

  await mongoose.disconnect();
}

findBikes().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});