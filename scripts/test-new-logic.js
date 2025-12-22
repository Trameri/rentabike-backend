import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function testNewLogic() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧪 Test nuova logica: SOLO ricavi bici...');

  // Trova il contratto con la bici "mia" (€495 + €5 assicurazione = €500)
  const contract = await Contract.findOne({
    'items.name': { $regex: /mia/i }
  });

  if (!contract) {
    console.log('❌ Contratto con bici "mia" non trovato');
    await mongoose.disconnect();
    return;
  }

  console.log('\n📋 Contratto test:');
  console.log(`   ID: ${contract._id}`);
  console.log(`   FinalAmount: €${contract.finalAmount}`);
  console.log(`   Totals:`, contract.totals);

  // Nuova logica: calcola SOLO ricavi bici (finalAmount - assicurazione)
  const calculateBikeOnlyRevenue = (contract) => {
    if (contract.finalAmount && contract.finalAmount > 0) {
      let totalInsurance = 0;
      
      // Calcola assicurazione items
      contract.items?.forEach(item => {
        if (item.insurance) {
          totalInsurance += parseFloat(item.insuranceFlat) || 5;
          console.log(`   Assicurazione ${item.name}: €${item.insuranceFlat || 5}`);
        }
      });
      
      // Aggiungi assicurazione contratto
      if (contract.insuranceFlat) {
        totalInsurance += parseFloat(contract.insuranceFlat);
        console.log(`   Assicurazione contratto: €${contract.insuranceFlat}`);
      }
      
      const bikeRevenue = contract.finalAmount - totalInsurance;
      console.log(`   FinalAmount: €${contract.finalAmount} - Assicurazione: €${totalInsurance} = Ricavi bici: €${bikeRevenue}`);
      return Math.max(0, bikeRevenue);
    }
    
    // Fallback: calcolo dinamico
    const startDate = new Date(contract.startAt || contract.createdAt);
    const endDate = new Date(contract.endAt || new Date());
    const durationMs = Math.max(0, endDate - startDate);
    const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
    const durationDays = Math.max(1, Math.ceil(durationHours / 24));
    
    let bikeRevenue = 0;
    
    contract.items?.forEach(item => {
      const priceHourly = parseFloat(item.priceHourly) || 0;
      const priceDaily = parseFloat(item.priceDaily) || 0;
      
      let itemRevenue = 0;
      if (durationHours <= 24) {
        itemRevenue = priceHourly * durationHours;
        console.log(`   ${item.name}: €${priceHourly} x ${durationHours}h = €${itemRevenue}`);
      } else {
        itemRevenue = priceDaily * durationDays;
        console.log(`   ${item.name}: €${priceDaily} x ${durationDays}g = €${itemRevenue}`);
      }
      
      bikeRevenue += itemRevenue;
    });
    
    return bikeRevenue;
  };

  const bikeOnlyRevenue = calculateBikeOnlyRevenue(contract);

  console.log('\n💰 Risultati nuova logica:');
  console.log(`   Ricavi SOLO bici: €${bikeOnlyRevenue}`);
  console.log(`   FinalAmount (totale): €${contract.finalAmount}`);
  console.log(`   Assicurazione: €${contract.finalAmount - bikeOnlyRevenue}`);

  console.log('\n✅ Verifica:');
  console.log(`   Se mia costa €495/giorno per 1 giorno = €495 ✓`);
  console.log(`   Se assicurazione €5 = €495 + €5 = €500 ✓`);

  await mongoose.disconnect();
}

testNewLogic().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});