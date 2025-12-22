import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';

async function testSummaryQuery() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Test query summary...');

  // Stessa query del summary (per superadmin senza filtri)
  const filter = { 
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ]
  };

  console.log('🔎 Filtro usato:', JSON.stringify(filter, null, 2));

  const rows = await Contract.find(filter)
    .select('totals finalAmount createdAt location items status')
    .populate('location')
    .lean();

  console.log(`\n📋 Trovati ${rows.length} contratti:`);
  
  let total = 0;
  rows.forEach((r, i) => {
    let contractTotal = 0;
    
    if (r.finalAmount !== undefined && r.finalAmount !== null) {
      contractTotal = r.finalAmount;
    } else if (r.totals?.subtotal !== undefined) {
      contractTotal = r.totals.subtotal;
    }
    
    total += contractTotal;
    
    console.log(`${i + 1}. ${r._id}`);
    console.log(`   Location: ${r.location?.name || 'N/A'}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   PaymentCompleted: ${r.paymentCompleted}`);
    console.log(`   FinalAmount: ${r.finalAmount}`);
    console.log(`   Subtotal: ${r.totals?.subtotal}`);
    console.log(`   Usato: ${contractTotal}`);
    console.log(`   Created: ${r.createdAt}`);
    console.log('');
  });
  
  console.log(`💰 Totale calcolato: €${total}`);
  
  await mongoose.disconnect();
}

testSummaryQuery().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});