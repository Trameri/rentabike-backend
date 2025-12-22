import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function debugContract() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Debug contratto dettagliato...');

  const contract = await Contract.findOne({
    'items.name': { $regex: /mia/i }
  });

  if (!contract) {
    console.log('❌ Contratto non trovato');
    await mongoose.disconnect();
    return;
  }

  console.log('\n📋 Contratto completo:');
  console.log(`   ID: ${contract._id}`);
  console.log(`   Status: ${contract.status}`);
  console.log(`   StartAt: ${contract.startAt}`);
  console.log(`   EndAt: ${contract.endAt}`);
  console.log(`   CreatedAt: ${contract.createdAt}`);
  console.log(`   FinalAmount: €${contract.finalAmount}`);

  console.log('\n🚲 Items dettaglio:');
  contract.items?.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.name}:`);
    console.log(`      - Kind: ${item.kind}`);
    console.log(`      - PriceHourly: €${item.priceHourly}`);
    console.log(`      - PriceDaily: €${item.priceDaily}`);
    console.log(`      - Insurance: ${item.insurance}`);
    console.log(`      - InsuranceFlat: €${item.insuranceFlat}`);
    console.log(`      - ReturnedAt: ${item.returnedAt || 'Non restituito'}`);
  });

  console.log('\n⏰ Calcolo durata:');
  const startDate = new Date(contract.startAt || contract.createdAt);
  const endDate = new Date(contract.endAt || new Date());
  const durationMs = Math.max(0, endDate - startDate);
  const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
  const durationDays = Math.max(1, Math.ceil(durationHours / 24));
  
  console.log(`   Start: ${startDate}`);
  console.log(`   End: ${endDate}`);
  console.log(`   Duration MS: ${durationMs}`);
  console.log(`   Duration Hours: ${durationHours}`);
  console.log(`   Duration Days: ${durationDays}`);

  console.log('\n💰 Calcolo ricavi step by step:');
  let totalRevenue = 0;
  
  contract.items?.forEach((item, i) => {
    console.log(`\n   Item ${i + 1}: ${item.name}`);
    console.log(`     - ReturnedAt: ${item.returnedAt || 'Non restituito'}`);
    
    if (!item.returnedAt) {
      const priceHourly = parseFloat(item.priceHourly) || 0;
      const priceDaily = parseFloat(item.priceDaily) || 0;
      
      console.log(`     - PriceHourly: €${priceHourly}`);
      console.log(`     - PriceDaily: €${priceDaily}`);
      
      let itemRevenue = 0;
      if (durationHours <= 24) {
        itemRevenue = priceHourly * durationHours;
        console.log(`     - Calcolo orario: €${priceHourly} x ${durationHours}h = €${itemRevenue}`);
      } else {
        itemRevenue = priceDaily * durationDays;
        console.log(`     - Calcolo giornaliero: €${priceDaily} x ${durationDays}g = €${itemRevenue}`);
      }
      
      totalRevenue += itemRevenue;
      console.log(`     - Revenue item: €${itemRevenue}`);
    } else {
      console.log(`     - SALTATO (restituito)`);
    }
  });

  console.log(`\n📊 Totale ricavi SOLO bici: €${totalRevenue}`);

  await mongoose.disconnect();
}

debugContract().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});