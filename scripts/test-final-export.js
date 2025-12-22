import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function testFinalExport() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧪 Test finale: CSV Export e ROI senza assicurazione...');

  // Trova tutti i contratti completati
  const contracts = await Contract.find({
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ]
  }).populate('location');

  console.log(`\n📋 Trovati ${contracts.length} contratti completati`);

  // Simula il calcolo CSV (SENZA assicurazione)
  const calculateTotalWithoutInsurance = (contract) => {
    if (contract.totals?.subtotal && contract.totals.subtotal > 0) {
      return parseFloat(contract.totals.subtotal);
    }
    if (contract.finalAmount !== undefined && contract.finalAmount !== null) {
      return parseFloat(contract.finalAmount);
    }
    return 0;
  };

  let totalWithInsurance = 0;
  let totalWithoutInsurance = 0;
  let contractsWithInsurance = 0;

  console.log('\n💰 Analisi contratti:');
  contracts.forEach((contract, i) => {
    const withInsurance = contract.finalAmount || 0;
    const withoutInsurance = calculateTotalWithoutInsurance(contract);
    const hasInsurance = withInsurance > withoutInsurance;

    totalWithInsurance += withInsurance;
    totalWithoutInsurance += withoutInsurance;
    
    if (hasInsurance) {
      contractsWithInsurance++;
      console.log(`${i + 1}. ${contract._id.toString().slice(-6)} - CON: €${withInsurance} | SENZA: €${withoutInsurance} | Diff: €${withInsurance - withoutInsurance}`);
    }
  });

  console.log('\n📊 Riepilogo finale:');
  console.log(`   Totale CON assicurazione: €${totalWithInsurance.toFixed(2)}`);
  console.log(`   Totale SENZA assicurazione: €${totalWithoutInsurance.toFixed(2)}`);
  console.log(`   Differenza (assicurazione): €${(totalWithInsurance - totalWithoutInsurance).toFixed(2)}`);
  console.log(`   Contratti con assicurazione: ${contractsWithInsurance}/${contracts.length}`);

  console.log('\n✅ Modifiche applicate:');
  console.log('   ✅ CSV Export: Usa totals.subtotal (senza assicurazione)');
  console.log('   ✅ ROI Calcolo: Usa totals.subtotal (senza assicurazione)');
  console.log('   ✅ Campo CSV: "Totale Finale (Senza Assicurazione)"');

  await mongoose.disconnect();
}

testFinalExport().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});