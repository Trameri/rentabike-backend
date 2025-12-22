import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from './src/models/Contract.js';
import Location from './src/models/Location.js';

async function debugUserContracts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Debug contratti utente...\n');

    // Ottieni tutte le location
    const locations = await Location.find({}).lean();
    console.log('📍 Location trovate:', locations.map(l => `${l.name} (${l.code})`).join(', '));

    // Per ogni location, mostra tutti i contratti
    for (const location of locations) {
      console.log(`\n🏢 === ${location.name.toUpperCase()} ===`);
      
      const allContracts = await Contract.find({ location: location._id })
        .select('status paid paymentCompleted createdAt endAt totals finalAmount createdBy')
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`📊 Totale contratti: ${allContracts.length}`);
      
      if (allContracts.length > 0) {
        allContracts.forEach((contract, index) => {
          const createdDate = new Date(contract.createdAt).toLocaleString('it-IT');
          const endDate = contract.endAt ? new Date(contract.endAt).toLocaleString('it-IT') : 'N/A';
          const revenue = contract.finalAmount || contract.totals?.grandTotal || 0;
          
          console.log(`  ${index + 1}. Status: ${contract.status} | Paid: ${contract.paid} | PaymentCompleted: ${contract.paymentCompleted} | Revenue: €${revenue}`);
          console.log(`     Creato: ${createdDate} | Fine: ${endDate} | CreatedBy: ${contract.createdBy || 'N/A'}`);
        });
      }
      
      // Contratti che dovrebbero essere nelle statistiche superadmin
      const statsContracts = await Contract.find({
        location: location._id,
        $or: [
          { status: 'completed' },
          { status: 'returned', paymentCompleted: true }
        ]
      }).lean();
      
      console.log(`✅ Contratti nelle statistiche superadmin: ${statsContracts.length}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

debugUserContracts();