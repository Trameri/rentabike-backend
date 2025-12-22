import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testLocationMismatch() {
  try {
    console.log('🧪 TEST MISMATCH LOCATION ID\n');

    // Login superadmin
    const superadminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    const superadminToken = superadminLogin.data.token;

    // Ottieni location
    const locationsResponse = await axios.get(`${API_BASE}/locations`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    console.log('🏢 LOCATION DISPONIBILI:');
    locationsResponse.data.forEach(loc => {
      console.log(`   ${loc.name} (${loc.code}) - ID: ${loc._id}`);
    });

    // Ottieni tutte le bici
    const bikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    console.log('\n🚲 BICI E LORO LOCATION:');
    bikesResponse.data.forEach(bike => {
      console.log(`   ${bike.name} (${bike.barcode})`);
      console.log(`      Location ID: ${bike.location?._id || bike.location}`);
      console.log(`      Location Name: ${bike.location?.name || 'N/A'}`);
    });

    // Test filtro per utente campo (database)
    console.log('\n🔍 TEST FILTRO UTENTE CAMPO (database):');
    const campoLogin = await axios.get(`${API_BASE}/bikes`, {
      headers: { 
        Authorization: `Bearer ${(await axios.post(`${API_BASE}/auth/login`, {
          username: 'campo',
          password: 'campo123'
        })).data.token}`
      }
    });
    
    console.log(`   Bici viste da 'campo': ${campoLogin.data.length}`);
    campoLogin.data.forEach(bike => {
      console.log(`      ${bike.name} - Location: ${bike.location?.name}`);
    });

    // Test filtro per utente campo-sportivo (temporaneo)
    console.log('\n🔍 TEST FILTRO UTENTE CAMPO-SPORTIVO (temporaneo):');
    const campoSportivoLogin = await axios.get(`${API_BASE}/bikes`, {
      headers: { 
        Authorization: `Bearer ${(await axios.post(`${API_BASE}/auth/login`, {
          username: 'campo-sportivo',
          password: 'campo123'
        })).data.token}`
      }
    });
    
    console.log(`   Bici viste da 'campo-sportivo': ${campoSportivoLogin.data.length}`);
    campoSportivoLogin.data.forEach(bike => {
      console.log(`      ${bike.name} - Location: ${bike.location?.name}`);
    });

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

setTimeout(testLocationMismatch, 2000);