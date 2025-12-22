import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Location from './src/models/Location.js';

async function fixUsername() {
  try {
    console.log('🔧 CORREZIONE USERNAME: campo → campo-sportivo\n');

    // Connetti a MongoDB
    const MONGODB_URI = 'mongodb+srv://nicotrameri:Weimia@cluster0.jj5whnf.mongodb.net/rentabike';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Trova l'utente 'campo'
    const campoUser = await User.findOne({ username: 'campo' }).populate('location');
    
    if (!campoUser) {
      console.log('❌ Utente "campo" non trovato');
      return;
    }

    console.log('👤 Utente trovato:');
    console.log(`   Username: ${campoUser.username}`);
    console.log(`   Role: ${campoUser.role}`);
    console.log(`   Location: ${campoUser.location?.name} (${campoUser.location?.code})`);

    // Cambia username da 'campo' a 'campo-sportivo'
    campoUser.username = 'campo-sportivo';
    await campoUser.save();

    console.log('\n✅ Username cambiato con successo!');
    console.log(`   Nuovo username: ${campoUser.username}`);

    // Verifica il cambiamento
    const updatedUser = await User.findById(campoUser._id).populate('location');
    console.log('\n🔍 Verifica:');
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Location: ${updatedUser.location?.name}`);

    console.log('\n🎉 Operazione completata!');
    console.log('Ora puoi fare login con:');
    console.log('   Username: campo-sportivo');
    console.log('   Password: campo123');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnesso da MongoDB');
  }
}

fixUsername();