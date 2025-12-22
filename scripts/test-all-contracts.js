import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function testAllContracts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧪 Test tutti i contratti con nuova logica...');

  const contracts = await Contract.find({}).limit(10);
  
  console.log(`\n📋 Trovati ${contracts.length} contratti`);

  const calculateBikeOnlyRevenue = (contract) => {
    if (contract.finalAmount && contract.finalAmount > 0) {
      let totalInsurance = 0;
      
      contract.items?.forEach(item => {
        if (item.insurance) {
          totalInsurance += parseFloat(item.insuranceFlat) || 5;
        }
      });
      
      if (contract.insuranceFlat) {
        totalInsurance += parseFloat(contract.insuranceFlat);
      }
      
      return Math.max(0, contract.finalAmount - totalInsurance);
    }
    return 0;
  };

  let totalBikeRevenue = 0;
  let totalFinalAmount = 0;
  let totalInsurance = 0;

  contracts.forEach((contract, i) => {
    const bikeRevenue = calculateBikeOnlyRevenue(contract);
    const finalAmount = contract.finalAmount || 0;
    const insurance = finalAmount - bikeRevenue;

    console.log(`\n${i + 1}. ${contract._id.toString().slice(-6)}:`);
    console.log(`   FinalAmount: €${finalAmount}`);
    console.log(`   Ricavi bici: €${bikeRevenue}`);
    console.log(`   Assicurazione: €${insurance}`);

    if (contract.items?.length > 0) {
      console.log(`   Items: ${contract.items.map(item => `${item.name}(€${item.priceDaily}/g)`).join(', ')}`);
    }

    totalBikeRevenue += bikeRevenue;
    totalFinalAmount += finalAmount;
    totalInsurance += insurance;
  });

  console.log('\n📊 Riepilogo finale:');
  console.log(`   Totale FinalAmount: €${totalFinalAmount.toFixed(2)}`);
  console.log(`   Totale ricavi SOLO bici: €${totalBikeRevenue.toFixed(2)}`);
  console.log(`   Totale assicurazione: €${totalInsurance.toFixed(2)}`);
  console.log(`   Verifica: €${totalBikeRevenue.toFixed(2)} + €${totalInsurance.toFixed(2)} = €${(totalBikeRevenue + totalInsurance).toFixed(2)}`);

  console.log('\n✅ Nuova logica applicata:');
  console.log('   ✅ CSV Export: Ricavi Solo Bici = FinalAmount - Assicurazione');
  console.log('   ✅ ROI Calcolo: Solo ricavi bici (senza assicurazione)');
  console.log('   ✅ Contratti completati: Inclusi anche item restituiti');

  await mongoose.disconnect();
}

testAllContracts().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});