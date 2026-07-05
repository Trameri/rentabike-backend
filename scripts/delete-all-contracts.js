import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';

async function deleteAllContracts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🗑️  Cancellazione tutti i contratti...');

  const result = await Contract.deleteMany({});
  console.log(`✅ Cancellati ${result.deletedCount} contratti`);
  
  await mongoose.disconnect();
}

deleteAllContracts().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});