import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from '../src/models/Contract.js';
import Location from '../src/models/Location.js';
import User from '../src/models/User.js';

async function checkCancanoLocation() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔍 Verifica location Cancano...');

  // Trova l'utente Cancano
  const cancanoUser = await User.findOne({ username: 'cancano' });
  console.log(`👤 Utente Cancano:`);
  console.log(`   ID: ${cancanoUser._id}`);
  console.log(`   LocationId: ${cancanoUser.locationId}`);

  // Trova la location Cancano
  const cancanoLocation = await Location.findOne({ name: 'Cancano' });
  console.log(`\n📍 Location Cancano:`);
  console.log(`   ID: ${cancanoLocation._id}`);
  console.log(`   Name: ${cancanoLocation.name}`);

  // Verifica se coincidono
  const locationMatch = cancanoUser.locationId?.toString() === cancanoLocation._id.toString();
  console.log(`\n🎯 LocationId dell'utente corrisponde: ${locationMatch}`);

  // Trova il contratto da €505
  const contract505 = await Contract.findById('68b9df0314427de3734fcd28').populate('location');
  console.log(`\n💰 Contratto da €505:`);
  console.log(`   ID: ${contract505._id}`);
  console.log(`   Location ID: ${contract505.location?._id}`);
  console.log(`   Location Name: ${contract505.location?.name}`);
  console.log(`   Status: ${contract505.status}`);
  console.log(`   FinalAmount: ${contract505.finalAmount}`);

  // Verifica se il contratto appartiene alla location Cancano
  const contractLocationMatch = contract505.location?._id?.toString() === cancanoLocation._id.toString();
  console.log(`\n🎯 Contratto appartiene a Cancano: ${contractLocationMatch}`);

  // Verifica filtro summary per Cancano
  const summaryFilter = { 
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ],
    location: cancanoUser.locationId
  };

  console.log(`\n🔎 Filtro summary per Cancano:`, JSON.stringify(summaryFilter, null, 2));

  const cancanoContracts = await Contract.find(summaryFilter).populate('location');
  console.log(`\n📋 Contratti trovati per Cancano: ${cancanoContracts.length}`);
  
  let total = 0;
  cancanoContracts.forEach((contract, i) => {
    const contractTotal = contract.finalAmount || contract.totals?.subtotal || 0;
    total += contractTotal;
    
    console.log(`${i + 1}. ${contract._id} - €${contractTotal} - ${contract.location?.name}`);
  });
  
  console.log(`\n💰 Totale Cancano: €${total}`);

  await mongoose.disconnect();
}

checkCancanoLocation().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});