import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import DailyStats from '../src/models/DailyStats.js';

async function cleanOrphanPayments() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧹 Pulizia payment orfani in DailyStats...');

  const stats = await DailyStats.find({}).select('_id payments revenue').lean();
  let totalCleaned = 0;
  let orphanCount = 0;

  for (const s of stats) {
    if (s.payments && s.payments.length > 0) {
      const orphanPayments = [];
      const validPayments = [];
      let orphanRevenue = 0;

      for (const p of s.payments) {
        const contractExists = await Contract.exists({ _id: p.contractId });
        if (!contractExists) {
          orphanPayments.push(p._id);
          orphanRevenue += p.amount;
          orphanCount++;
        } else {
          validPayments.push(p);
        }
      }

      if (orphanPayments.length > 0) {
        // Rimuovi i payment orfani e aggiorna i totali
        await DailyStats.updateOne(
          { _id: s._id },
          {
            $pull: { payments: { _id: { $in: orphanPayments } } },
            $inc: {
              'revenue.total': -orphanRevenue,
              'contracts.completed': -orphanPayments.length
            }
          }
        );
        totalCleaned += orphanRevenue;
      }
    }
  }

  console.log(`✅ Rimosse ${orphanCount} voci orfane per €${totalCleaned.toFixed(2)}`);
  await mongoose.disconnect();
}

cleanOrphanPayments().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});