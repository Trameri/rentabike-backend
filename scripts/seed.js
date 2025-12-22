import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';
import Location from '../src/models/Location.js';
import User from '../src/models/User.js';
import Bike from '../src/models/Bike.js';
import Accessory from '../src/models/Accessory.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

async function run(){
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Seeding...');

  // Controlla se ci sono già dati nel database
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log(`⚠️ Database già popolato con ${existingUsers} utenti. Saltando il seed per preservare i dati esistenti.`);
    console.log('💡 Per forzare il reset, usa: npm run seed:force');
    await mongoose.disconnect();
    return;
  }

  console.log('🗑️ Database vuoto, inizializzazione in corso...');
  // Pulisci tutti i dati (solo se il database è vuoto)
  await Promise.all([
    Location.deleteMany({}), 
    User.deleteMany({}),
    Bike.deleteMany({}),
    Accessory.deleteMany({})
  ]);

  // Crea le location
  const cancano = await Location.create({ name:'Cancano', code:'cancano' });
  const arnoga = await Location.create({ name:'Arnoga', code:'arnoga' });
  const campo  = await Location.create({ name:'Campo Sportivo', code:'campo' });

  const hash = (pw)=> bcrypt.hash(pw, 10);

  // Crea gli utenti
  await User.create([
    { username:'cancano', passwordHash: await hash('cancano123'), role:'admin', location: cancano._id },
    { username:'arnoga', passwordHash: await hash('arnoga123'), role:'admin', location: arnoga._id },
    { username:'campo', passwordHash: await hash('campo123'), role:'admin', location: campo._id },
    { username:'superadmin', passwordHash: await hash('admin123'), role:'superadmin' }
  ]);

  // Crea bici per ogni location
  const bikeTypes = ['ebike-full', 'ebike-front', 'ebike-other', 'muscolare'];
  const locations = [cancano, arnoga, campo];
  
  for(const location of locations) {
    // 3-5 bici per location
    const bikeCount = 3 + Math.floor(Math.random() * 3);
    for(let i = 0; i < bikeCount; i++) {
      const type = bikeTypes[Math.floor(Math.random() * bikeTypes.length)];
      const priceHourly = type.includes('ebike') ? 8 + Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 3);
      const priceDaily = priceHourly * 6;
      
      await Bike.create({
        name: `${location.name} Bike ${i + 1}`,
        barcode: nanoid(),
        type: type,
        priceHourly: priceHourly,
        priceDaily: priceDaily,
        status: 'available',
        location: location._id
      });
    }
    
    // 2-3 accessori per location
    const accessoryCount = 2 + Math.floor(Math.random() * 2);
    const accessoryNames = ['Casco', 'Lucchetto', 'Borsa', 'Luci LED', 'Seggiolino'];
    for(let i = 0; i < accessoryCount; i++) {
      const name = accessoryNames[Math.floor(Math.random() * accessoryNames.length)];
      const priceHourly = 2 + Math.floor(Math.random() * 3);
      const priceDaily = priceHourly * 4;
      
      await Accessory.create({
        name: `${name} ${location.name}`,
        barcode: nanoid(),
        priceHourly: priceHourly,
        priceDaily: priceDaily,
        status: 'available',
        location: location._id
      });
    }
  }

  console.log('Seed completato!');
  console.log(`- ${locations.length} location create`);
  console.log(`- 4 utenti creati (3 admin + 1 superadmin)`);
  console.log(`- ${await Bike.countDocuments()} bici create`);
  console.log(`- ${await Accessory.countDocuments()} accessori creati`);
  
  await mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
