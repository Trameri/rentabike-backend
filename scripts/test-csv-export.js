import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function testCSVExport() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧪 Test calcoli CSV export...');

  // Prendi il contratto da €505 per testare
  const contract = await Contract.findById('68b9df0314427de3734fcd28').populate('location');
  
  console.log('\n📋 Contratto test:');
  console.log(`   ID: ${contract._id}`);
  console.log(`   FinalAmount: ${contract.finalAmount}`);
  console.log(`   Totals:`, contract.totals);
  console.log(`   Items:`, contract.items?.length);
  
  // Simula il calcolo del DataExporter (SENZA assicurazione)
  const calculateContractTotalWithoutInsurance = (contract) => {
    // Priorità per CSV (SENZA assicurazione): totals.subtotal > calcolo dinamico > finalAmount (solo se necessario)
    if (contract.totals?.subtotal && contract.totals.subtotal > 0) {
      return parseFloat(contract.totals.subtotal);
    }
    if (contract.finalAmount !== undefined && contract.finalAmount !== null) {
      return parseFloat(contract.finalAmount);
    }
    
    // Calcolo dinamico senza assicurazione
    const startDate = new Date(contract.startAt || contract.createdAt);
    const endDate = new Date(contract.endAt || new Date());
    const durationMs = Math.max(0, endDate - startDate);
    const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
    const durationDays = Math.max(1, Math.ceil(durationHours / 24));
    
    const isReservation = contract.status === 'reserved' || contract.isReservation;
    let total = 0;
    
    contract.items?.forEach(item => {
      if (!item.returnedAt) {
        const priceHourly = parseFloat(item.priceHourly) || 0;
        const priceDaily = parseFloat(item.priceDaily) || 0;
        
        let itemTotal = 0;
        if (isReservation) {
          itemTotal = priceDaily * durationDays;
        } else {
          const hourlyTotal = priceHourly * durationHours;
          const dailyTotal = priceDaily * durationDays;
          itemTotal = (priceDaily > 0 && hourlyTotal >= dailyTotal) ? dailyTotal : hourlyTotal;
        }
        
        // NON aggiungere l'assicurazione per il CSV export
        total += itemTotal;
      }
    });
    
    // NON aggiungere l'assicurazione del contratto per il CSV export
    
    return total;
  };

  const totalWithoutInsurance = calculateContractTotalWithoutInsurance(contract);
  
  console.log('\n💰 Risultati calcolo CSV:');
  console.log(`   Totale SENZA assicurazione: €${totalWithoutInsurance}`);
  console.log(`   Totale CON assicurazione (finalAmount): €${contract.finalAmount}`);
  console.log(`   Differenza: €${contract.finalAmount - totalWithoutInsurance}`);

  await mongoose.disconnect();
}

testCSVExport().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});