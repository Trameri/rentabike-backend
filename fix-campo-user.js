import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Location from './src/models/Location.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connesso al database');

    // Trova la location "Campo Sportivo"
    const campoLocation = await Location.findOne({ code: 'campo' });
    if (!campoLocation) {
      console.log('❌ Location "Campo Sportivo" non trovata');
      return;
    }

    console.log('📍 Location trovata:', campoLocation.name, '(', campoLocation.code, ')');

    // Controlla se esiste già l'utente "campo"
    const existingCampo = await User.findOne({ username: 'campo' });
    
    if (existingCampo) {
      console.log('✅ Utente "campo" già esistente');
      console.log('   - Username:', existingCampo.username);
      console.log('   - Role:', existingCampo.role);
      console.log('   - Location ID:', existingCampo.location);
    } else {
      console.log('➕ Creazione utente "campo"...');
      
      // Crea l'utente "campo"
      const hashedPassword = await bcrypt.hash('campo123', 10);
      const newUser = await User.create({
        username: 'campo',
        passwordHash: hashedPassword,
        role: 'admin',
        location: campoLocation._id
      });
      
      console.log('✅ Utente "campo" creato con successo');
      console.log('   - ID:', newUser._id);
      console.log('   - Username:', newUser.username);
      console.log('   - Role:', newUser.role);
      console.log('   - Location:', campoLocation.name);
    }

    // Controlla se esiste l'utente "campo-sportivo" da eliminare
    const campoSportivo = await User.findOne({ username: 'campo-sportivo' });
    if (campoSportivo) {
      console.log('🗑️ Eliminazione utente "campo-sportivo"...');
      await User.deleteOne({ username: 'campo-sportivo' });
      console.log('✅ Utente "campo-sportivo" eliminato');
    } else {
      console.log('ℹ️ Utente "campo-sportivo" non trovato (già eliminato o mai esistito)');
    }

    // Lista tutti gli utenti per verifica
    console.log('\n📋 Lista utenti attuali:');
    const allUsers = await User.find().populate('location');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) -> ${user.location?.name || 'Nessuna location'}`);
    });

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnesso dal database');
  }
}

run();