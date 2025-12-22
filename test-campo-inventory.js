import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testCampoInventory() {
  try {
    console.log('🧪 TEST INVENTARIO CAMPO SPORTIVO\n');

    // 1. Login come campo
    console.log('🔐 Login come campo...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'campo',
      password: 'campo123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login riuscito!');
    console.log(`👤 Utente: ${user.username} (${user.role})`);
    console.log(`🏢 Location: ${user.location?.name || 'N/A'}`);
    console.log(`🆔 Location ID: ${user.location?._id || user.locationId || 'N/A'}\n`);

    // 2. Ottieni bici per campo
    console.log('🚲 Caricamento bici...');
    const bikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Bici trovate: ${bikesResponse.data.length}`);
    bikesResponse.data.forEach((bike, index) => {
      console.log(`  ${index + 1}. ${bike.name} (${bike.barcode}) - ${bike.status}`);
    });

    // 3. Ottieni accessori per campo
    console.log('\n🎒 Caricamento accessori...');
    const accessoriesResponse = await axios.get(`${API_BASE}/accessories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Accessori trovati: ${accessoriesResponse.data.length}`);
    accessoriesResponse.data.forEach((accessory, index) => {
      console.log(`  ${index + 1}. ${accessory.name} (${accessory.barcode}) - ${accessory.status}`);
    });

    // 4. Test creazione contratto
    console.log('\n📝 Test caricamento form contratto...');
    const contractFormResponse = await axios.get(`${API_BASE}/bikes?status=available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`🚲 Bici disponibili per contratto: ${contractFormResponse.data.length}`);

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

// Aspetta che il server sia avviato
setTimeout(testCampoInventory, 2000);