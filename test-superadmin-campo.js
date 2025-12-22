import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testSuperadminCampo() {
  try {
    console.log('🧪 TEST SUPERADMIN CREA PER CAMPO SPORTIVO\n');

    // 1. Login come superadmin
    console.log('🔐 Login come superadmin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login superadmin riuscito!\n');

    // 2. Ottieni tutte le location
    console.log('🏢 Caricamento location...');
    const locationsResponse = await axios.get(`${API_BASE}/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Location disponibili:');
    locationsResponse.data.forEach((location, index) => {
      console.log(`  ${index + 1}. ${location.name} (${location.code}) - ID: ${location._id}`);
    });

    const campoLocation = locationsResponse.data.find(l => l.code === 'campo');
    if (!campoLocation) {
      console.log('❌ Campo Sportivo non trovato!');
      return;
    }

    console.log(`\n🎯 Campo Sportivo trovato: ${campoLocation.name} (ID: ${campoLocation._id})`);

    // 3. Crea una bici per Campo Sportivo
    console.log('\n🚲 Creazione bici per Campo Sportivo...');
    const newBike = {
      name: 'Test Superadmin Bike',
      barcode: 'SUPER' + Date.now(),
      type: 'ebike-full',
      priceHourly: 10,
      priceDaily: 50,
      location: campoLocation._id
    };

    const bikeResponse = await axios.post(`${API_BASE}/bikes`, newBike, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Bici creata:', bikeResponse.data.name);
    console.log(`   Barcode: ${bikeResponse.data.barcode}`);
    console.log(`   Location: ${bikeResponse.data.location}`);

    // 4. Verifica che l'utente campo la veda
    console.log('\n🔄 Verifica visibilità per utente campo...');
    
    const campoLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'campo',
      password: 'campo123'
    });
    
    const campoToken = campoLoginResponse.data.token;
    
    const campoBikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    
    const createdBike = campoBikesResponse.data.find(b => b.barcode === newBike.barcode);
    
    if (createdBike) {
      console.log('✅ Bici visibile per utente campo!');
      console.log(`   Nome: ${createdBike.name}`);
      console.log(`   Status: ${createdBike.status}`);
    } else {
      console.log('❌ Bici NON visibile per utente campo!');
      console.log(`📋 Bici totali viste da campo: ${campoBikesResponse.data.length}`);
    }

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

// Aspetta che il server sia avviato
setTimeout(testSuperadminCampo, 2000);