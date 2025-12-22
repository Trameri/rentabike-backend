import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function analyzeContract() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Analisi struttura contratto...');

  // Trova il contratto con mia123
  const contract = await Contract.findOne({
    'items.name': { $regex: /mia123/i }
  });

  if (!contract) {
    console.log('❌ Contratto con mia123 non trovato');
    await mongoose.disconnect();
    return;
  }

  console.log('\n📋 Contratto trovato:');
  console.log(`   ID: ${contract._id}`);
  console.log(`   Status: ${contract.status}`);
  console.log(`   FinalAmount: ${contract.finalAmount}`);
  console.log(`   CustomFinalPrice: ${contract.customFinalPrice}`);
  console.log(`   InsuranceFlat: ${contract.insuranceFlat}`);
  console.log(`   Totals:`, JSON.stringify(contract.totals, null, 2));

  console.log('\n🚲 Items nel contratto:');
  contract.items?.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.name} (${item.kind})`);
    console.log(`      - PriceHourly: €${item.priceHourly}`);
    console.log(`      - PriceDaily: €${item.priceDaily}`);
    console.log(`      - Insurance: ${item.insurance ? 'Sì' : 'No'}`);
    console.log(`      - InsuranceFlat: €${item.insuranceFlat || 0}`);
  });

  console.log('\n⏰ Durata contratto:');
  const startDate = new Date(contract.startAt || contract.createdAt);
  const endDate = new Date(contract.endAt || new Date());
  const durationMs = Math.max(0, endDate - startDate);
  const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
  const durationDays = Math.max(1, Math.ceil(durationHours / 24));
  
  console.log(`   Start: ${startDate.toLocaleString('it-IT')}`);
  console.log(`   End: ${endDate.toLocaleString('it-IT')}`);
  console.log(`   Durata: ${durationHours} ore (${durationDays} giorni)`);

  console.log('\n💰 Calcolo ricavi SOLO bici:');
  let totalBikeRevenue = 0;
  let totalInsurance = 0;

  contract.items?.forEach((item, i) => {
    if (!item.returnedAt) {
      const priceHourly = parseFloat(item.priceHourly) || 0;
      const priceDaily = parseFloat(item.priceDaily) || 0;
      
      let itemRevenue = 0;
      if (durationHours <= 24) {
        itemRevenue = priceHourly * durationHours;
        console.log(`   ${i + 1}. ${item.name}: €${priceHourly} x ${durationHours}h = €${itemRevenue}`);
      } else {
        itemRevenue = priceDaily * durationDays;
        console.log(`   ${i + 1}. ${item.name}: €${priceDaily} x ${durationDays}g = €${itemRevenue}`);
      }
      
      totalBikeRevenue += itemRevenue;
      
      if (item.insurance) {
        const insuranceAmount = parseFloat(item.insuranceFlat) || 5;
        totalInsurance += insuranceAmount;
        console.log(`      + Assicurazione item: €${insuranceAmount}`);
      }
    }
  });

  if (contract.insuranceFlat) {
    const contractInsurance = parseFloat(contract.insuranceFlat);
    totalInsurance += contractInsurance;
    console.log(`   + Assicurazione contratto: €${contractInsurance}`);
  }

  console.log('\n📊 Riepilogo:');
  console.log(`   Ricavi SOLO bici: €${totalBikeRevenue}`);
  console.log(`   Assicurazione totale: €${totalInsurance}`);
  console.log(`   Totale calcolato: €${totalBikeRevenue + totalInsurance}`);
  console.log(`   FinalAmount: €${contract.finalAmount}`);
  console.log(`   Differenza: €${contract.finalAmount - (totalBikeRevenue + totalInsurance)}`);

  await mongoose.disconnect();
}

analyzeContract().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});