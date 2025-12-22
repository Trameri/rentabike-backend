import 'dotenv/config';
import mongoose from 'mongoose';
import Contract from './src/models/Contract.js';
import Location from './src/models/Location.js';
import User from './src/models/User.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connesso");
  } catch (err) {
    console.error("❌ Errore connessione MongoDB:", err.message);
    process.exit(1);
  }
};

const debugContracts = async () => {
  try {
    await connectDB();
    
    // Trova l'utente Cancano
    const cancanoUser = await User.findOne({ username: 'cancano' }).populate('location');
    console.log('👤 Utente Cancano:', {
      username: cancanoUser.username,
      role: cancanoUser.role,
      locationId: cancanoUser.location._id.toString(),
      locationName: cancanoUser.location.name
    });
    
    // Trova tutti i contratti per la location di Cancano
    const contracts = await Contract.find({ 
      location: cancanoUser.location._id,
      $or: [
        { status: 'completed' },
        { status: 'returned', paymentCompleted: true }
      ]
    }).populate('location');
    
    console.log(`\n📋 Contratti per ${cancanoUser.location.name}:`, contracts.length);
    
    contracts.forEach((contract, idx) => {
      console.log(`   ${idx + 1}. Status: ${contract.status}, Amount: €${contract.finalAmount}, Location: ${contract.location.name}`);
    });
    
    // Calcola totale
    const total = contracts.reduce((sum, c) => sum + (c.finalAmount || 0), 0);
    console.log(`\n💰 Totale per Cancano: €${total}`);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnesso da MongoDB');
  }
};

debugContracts();