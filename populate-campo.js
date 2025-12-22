import 'dotenv/config';
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import Bike from './src/models/Bike.js';
import Accessory from './src/models/Accessory.js';
import Location from './src/models/Location.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

async function populateCampo() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const campo = await Location.findOne({ name: 'Campo Sportivo' });
  if (!campo) {
    console.log('Campo Sportivo non trovato');
    await mongoose.disconnect();
    return;
  }
  
  console.log('Popolando inventario Campo Sportivo...');
  
  // Aggiungi 5 bici
  const bikeTypes = ['ebike-full', 'ebike-front', 'ebike-other', 'muscolare'];
  for(let i = 2; i <= 6; i++) {
    const type = bikeTypes[Math.floor(Math.random() * bikeTypes.length)];
    const priceHourly = type.includes('ebike') ? 8 + Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 3);
    const priceDaily = priceHourly * 6;
    
    await Bike.create({
      name: `Campo Sportivo Bike ${i}`,
      barcode: nanoid(),
      type: type,
      priceHourly: priceHourly,
      priceDaily: priceDaily,
      status: 'available',
      location: campo._id
    });
    console.log(`Bici ${i} creata`);
  }
  
  // Aggiungi 4 accessori
  const accessoryNames = ['Casco', 'Lucchetto', 'Borsa', 'Luci LED'];
  for(let i = 0; i < accessoryNames.length; i++) {
    const name = accessoryNames[i];
    const priceHourly = 2 + Math.floor(Math.random() * 3);
    const priceDaily = priceHourly * 4;
    
    await Accessory.create({
      name: `${name} Campo Sportivo`,
      barcode: nanoid(),
      priceHourly: priceHourly,
      priceDaily: priceDaily,
      status: 'available',
      location: campo._id
    });
    console.log(`Accessorio ${name} creato`);
  }
  
  console.log('Inventario Campo Sportivo popolato!');
  
  // Verifica finale
  const totalBikes = await Bike.countDocuments({ location: campo._id });
  const totalAccessories = await Accessory.countDocuments({ location: campo._id });
  console.log(`Totale bici: ${totalBikes}`);
  console.log(`Totale accessori: ${totalAccessories}`);
  
  await mongoose.disconnect();
}

populateCampo().catch(console.error);