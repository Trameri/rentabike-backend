import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function find505Contract() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Ricerca contratto da €505...');

  // Trova tutti i contratti completati
  const contracts = await Contract.find({
    status: { $in: ['completed', 'returned'] }
  }).populate('location').lean();

  console.log(`📊 Trovati ${contracts.length} contratti completati`);

  // Cerca contratti con valori alti
  contracts.forEach(contract => {
    const finalAmount = contract.finalAmount || 0;
    const subtotal = contract.totals?.subtotal || 0;
    const grandTotal = contract.totals?.grandTotal || 0;
    
    console.log(`\n📋 Contratto ${contract._id}:`);
    console.log(`  Location: ${contract.location?.name}`);
    console.log(`  FinalAmount: ${finalAmount}`);
    console.log(`  Subtotal: ${subtotal}`);
    console.log(`  GrandTotal: ${grandTotal}`);
    console.log(`  Created: ${contract.createdAt}`);
    
    // Mostra dettagli se ha valori alti
    if (finalAmount > 100 || subtotal > 100 || grandTotal > 100) {
      console.log(`  🔥 VALORE ALTO TROVATO!`);
      if (contract.items?.length > 0) {
        const item = contract.items[0];
        console.log(`  Item: ${item.name} (${item.barcode})`);
        console.log(`  PriceHourly: ${item.priceHourly}`);
        console.log(`  PriceDaily: ${item.priceDaily}`);
      }
      
      if (contract.startAt && contract.endAt) {
        const start = new Date(contract.startAt);
        const end = new Date(contract.endAt);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        console.log(`  Durata: ${diffHours.toFixed(2)} ore (${diffDays.toFixed(2)} giorni)`);
      }
    }
  });

  await mongoose.disconnect();
}

find505Contract().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});