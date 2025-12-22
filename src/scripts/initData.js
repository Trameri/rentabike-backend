import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Location from '../models/Location.js';
import 'dotenv/config';

const initializeData = async () => {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rentabike');
    console.log('✅ Connesso a MongoDB');

    // Crea le location
    const locations = [
      {
        name: 'Cancano',
        code: 'CAN',
        logoUrl: '/logos/valdidentro.png'
      },
      {
        name: 'Arnoga',
        code: 'ARN',
        logoUrl: '/logos/arnoga.png'
      },
      {
        name: 'Campo Sportivo',
        code: 'CSP',
        logoUrl: '/logos/campo-sportivo.svg'
      }
    ];

    // Elimina location esistenti e ricrea
    await Location.deleteMany({});
    const createdLocations = await Location.insertMany(locations);
    console.log('✅ Location create:', createdLocations.map(l => l.name));

    // Crea gli utenti
    const users = [
      {
        username: 'superadmin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'superadmin',
        location: null // Superadmin non ha location specifica
      },
      {
        username: 'cancano',
        passwordHash: await bcrypt.hash('cancano123', 10),
        role: 'admin',
        location: createdLocations.find(l => l.name === 'Cancano')._id
      },
      {
        username: 'arnoga', 
        passwordHash: await bcrypt.hash('arnoga123', 10),
        role: 'admin',
        location: createdLocations.find(l => l.name === 'Arnoga')._id
      },
      {
        username: 'campo-sportivo',
        passwordHash: await bcrypt.hash('campo123', 10), 
        role: 'admin',
        location: createdLocations.find(l => l.name === 'Campo Sportivo')._id
      }
    ];

    // Elimina utenti esistenti e ricrea
    await User.deleteMany({});
    await User.insertMany(users);
    console.log('✅ Utenti creati:', users.map(u => u.username));

    console.log('🎉 Inizializzazione completata!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    process.exit(1);
  }
};

initializeData();