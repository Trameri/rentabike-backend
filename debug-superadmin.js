import mongoose from 'mongoose';
import Contract from './src/models/Contract.js';
import Location from './src/models/Location.js';
import 'dotenv/config';

async function debugSuperadminStats() {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rentabike');
    console.log('✅ Connesso a MongoDB');

    // Ottieni tutte le location
    const locations = await Location.find({}).lean();
    console.log('📍 Location trovate:', locations.map(l => l.name));

    // Per ogni location, controlla i contratti
    for (const location of locations) {
      console.log(`\n🏢 === ${location.name} ===`);
      
      // Tutti i contratti per questa location
      const allContracts = await Contract.find({ location: location._id }).lean();
      console.log(`📊 Contratti totali: ${allContracts.length}`);
      
      // Contratti per status
      const statusCounts = {};
      allContracts.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });
      console.log('📈 Per status:', statusCounts);
      
      // Contratti che dovrebbero essere conteggiati nelle statistiche superadmin
      const filter = { 
        location: location._id, 
        $or: [
          { status: 'completed' },
          { status: 'returned', paymentCompleted: true }
        ]
      };
      const validContracts = await Contract.find(filter).lean();
      console.log(`✅ Contratti validi per statistiche: ${validContracts.length}`);
      
      // Calcola il totale
      let total = 0;
      validContracts.forEach(contract => {
        if (contract.finalAmount !== undefined && contract.finalAmount !== null) {
          total += contract.finalAmount;
        } else if (contract.totals?.grandTotal) {
          total += contract.totals.grandTotal;
        }
      });
      console.log(`💰 Totale revenue: €${total.toFixed(2)}`);
    }

    // Test della funzione superadmin-stats
    console.log('\n🔍 === TEST API SUPERADMIN-STATS ===');
    
    const totalRevenue = await Contract.aggregate([
      {
        $match: {
          $or: [
            { status: 'completed' },
            { status: 'returned', paymentCompleted: true }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { 
            $sum: { 
              $cond: [
                { $ne: ['$finalAmount', null] },
                '$finalAmount',
                { $ifNull: ['$totals.grandTotal', 0] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 Aggregazione totale:', totalRevenue);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

debugSuperadminStats();