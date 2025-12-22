import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Location from '../src/models/Location.js';

async function fixCancanoLocation() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔧 Correzione locationId per utente Cancano...');

  // Trova l'utente Cancano
  const cancanoUser = await User.findOne({ username: 'cancano' });
  console.log(`👤 Utente Cancano trovato: ${cancanoUser._id}`);
  console.log(`   LocationId attuale: ${cancanoUser.locationId}`);

  // Trova la location Cancano
  const cancanoLocation = await Location.findOne({ name: 'Cancano' });
  console.log(`📍 Location Cancano trovata: ${cancanoLocation._id}`);

  // Aggiorna l'utente
  cancanoUser.locationId = cancanoLocation._id;
  await cancanoUser.save();

  console.log(`✅ LocationId aggiornato: ${cancanoUser.locationId}`);

  await mongoose.disconnect();
}

fixCancanoLocation().catch(e => {
  console.error('❌ Errore:', e);
  process.exit(1);
});