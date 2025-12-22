import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';

async function countCompletedContracts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📊 Conteggio contratti completati...');

  // Stesso filtro usato dal summary
  const filter = { 
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ]
  };

  const contracts = await Contract.find(filter).select('_id finalAmount totals status createdAt').lean();
  
  console.log(`\n📋 Trovati ${contracts.length} contratti che soddisfano il filtro:`);
  
  let totalCalculated = 0;
  contracts.forEach((contract, i) => {
    const finalAmount = contract.finalAmount;
    const subtotal = contract.totals?.subtotal;
    
    // Stessa logica del summary
    let contractTotal = 0;
    if (finalAmount !== undefined && finalAmount !== null) {
      contractTotal = finalAmount;
    } else if (subtotal !== undefined) {
      contractTotal = subtotal;
    }
    
    totalCalculated += contractTotal;
    
    console.log(`${i + 1}. ${contract._id} - Status: ${contract.status} - FinalAmount: ${finalAmount} - Subtotal: ${subtotal} - Usato: ${contractTotal}`);
  });
  
  console.log(`\n💰 Totale calcolato: €${totalCalculated}`);
  
  await mongoose.disconnect();
}

countCompletedContracts().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});