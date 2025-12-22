import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testBikesAPI() {
  try {
    console.log('🧪 TEST API BICI - STRUTTURA DATI\n');

    // 1. Login come superadmin
    console.log('🔐 Login come superadmin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login riuscito!\n');

    // 2. Ottieni bici
    console.log('🚲 Caricamento bici...');
    const bikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Bici trovate: ${bikesResponse.data.length}\n`);

    // 3. Analizza struttura della prima bici
    if (bikesResponse.data.length > 0) {
      const firstBike = bikesResponse.data[0];
      console.log('🔍 STRUTTURA PRIMA BICI:');
      console.log(`Nome: ${firstBike.name}`);
      console.log(`Barcode: ${firstBike.barcode}`);
      console.log(`Location (tipo): ${typeof firstBike.location}`);
      console.log(`Location (valore):`, JSON.stringify(firstBike.location, null, 2));
      
      if (typeof firstBike.location === 'object' && firstBike.location) {
        console.log(`Location ID: ${firstBike.location._id}`);
        console.log(`Location Name: ${firstBike.location.name}`);
      }
    }

    // 4. Ottieni location
    console.log('\n🏢 Caricamento location...');
    const locationsResponse = await axios.get(`${API_BASE}/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Location trovate: ${locationsResponse.data.length}\n`);

    // 5. Analizza struttura della prima location
    if (locationsResponse.data.length > 0) {
      const firstLocation = locationsResponse.data[0];
      console.log('🔍 STRUTTURA PRIMA LOCATION:');
      console.log(`Nome: ${firstLocation.name}`);
      console.log(`ID: ${firstLocation._id}`);
      console.log(`Code: ${firstLocation.code}`);
    }

    // 6. Test confronto ID
    if (bikesResponse.data.length > 0 && locationsResponse.data.length > 0) {
      const bike = bikesResponse.data[0];
      const locations = locationsResponse.data;
      
      console.log('\n🔍 TEST CONFRONTO ID:');
      console.log(`bike.location._id: "${bike.location?._id}"`);
      console.log(`bike.location (se string): "${bike.location}"`);
      
      const foundLocation = locations.find(l => l._id === bike.location?._id);
      const foundLocationString = locations.find(l => l._id === bike.location);
      
      console.log(`Trovata con bike.location._id: ${foundLocation ? foundLocation.name : 'NON TROVATA'}`);
      console.log(`Trovata con bike.location: ${foundLocationString ? foundLocationString.name : 'NON TROVATA'}`);
    }

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

// Aspetta che il server sia avviato
setTimeout(testBikesAPI, 2000);