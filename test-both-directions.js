import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testBothDirections() {
  try {
    console.log('🧪 TEST COMUNICAZIONE BIDIREZIONALE\n');

    // SCENARIO 1: Campo crea → Superadmin vede
    console.log('📋 SCENARIO 1: CAMPO CREA → SUPERADMIN VEDE\n');

    // Login campo
    console.log('👤 Login campo...');
    const campoLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'campo',
      password: 'campo123'
    });
    
    const campoToken = campoLogin.data.token;
    const campoUser = campoLogin.data.user;
    console.log(`✅ Campo loggato! Location: ${campoUser.location?.name}`);
    console.log(`🆔 Location ID: ${campoUser.location?._id || campoUser.locationId}\n`);

    // Campo crea bici
    console.log('🚲 Campo crea bici...');
    const campoBike = {
      name: 'Bici Creata da Campo',
      barcode: 'CAMPO' + Date.now(),
      type: 'ebike-full',
      priceHourly: 6,
      priceDaily: 35
    };

    const campoBikeResponse = await axios.post(`${API_BASE}/bikes`, campoBike, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    
    console.log(`✅ Bici creata da campo: ${campoBikeResponse.data.name}`);
    console.log(`   Barcode: ${campoBikeResponse.data.barcode}`);
    console.log(`   Location nel DB: ${campoBikeResponse.data.location}`);
    console.log(`   Location type: ${typeof campoBikeResponse.data.location}\n`);

    // Login superadmin
    console.log('👑 Login superadmin...');
    const superadminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    
    const superadminToken = superadminLogin.data.token;
    console.log('✅ Superadmin loggato!\n');

    // Superadmin vede tutte le bici
    console.log('🔍 Superadmin carica tutte le bici...');
    const allBikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    const campoBikeFromSuperadmin = allBikesResponse.data.find(b => b.barcode === campoBike.barcode);
    
    if (campoBikeFromSuperadmin) {
      console.log(`✅ Superadmin VEDE la bici creata da campo!`);
      console.log(`   Nome: ${campoBikeFromSuperadmin.name}`);
      console.log(`   Location type: ${typeof campoBikeFromSuperadmin.location}`);
      console.log(`   Location value:`, JSON.stringify(campoBikeFromSuperadmin.location, null, 2));
      
      if (campoBikeFromSuperadmin.location?.name) {
        console.log(`   ✅ Location name: ${campoBikeFromSuperadmin.location.name}`);
      } else {
        console.log(`   ❌ Location name: N/A (problema qui!)`);
      }
    } else {
      console.log(`❌ Superadmin NON vede la bici creata da campo!`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // SCENARIO 2: Superadmin crea → Campo vede
    console.log('📋 SCENARIO 2: SUPERADMIN CREA → CAMPO VEDE\n');

    // Superadmin ottiene location Campo Sportivo
    console.log('🏢 Superadmin carica location...');
    const locationsResponse = await axios.get(`${API_BASE}/locations`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    const campoLocation = locationsResponse.data.find(l => l.code === 'campo');
    console.log(`✅ Campo Sportivo: ${campoLocation.name} (ID: ${campoLocation._id})\n`);

    // Superadmin crea bici per Campo Sportivo
    console.log('🚲 Superadmin crea bici per Campo Sportivo...');
    const superadminBike = {
      name: 'Bici Creata da Superadmin',
      barcode: 'SUPER' + Date.now(),
      type: 'ebike-full',
      priceHourly: 7,
      priceDaily: 40,
      location: campoLocation._id
    };

    const superadminBikeResponse = await axios.post(`${API_BASE}/bikes`, superadminBike, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    console.log(`✅ Bici creata da superadmin: ${superadminBikeResponse.data.name}`);
    console.log(`   Barcode: ${superadminBikeResponse.data.barcode}`);
    console.log(`   Location nel DB: ${superadminBikeResponse.data.location}\n`);

    // Campo vede le sue bici
    console.log('🔍 Campo carica le sue bici...');
    const campoBikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    
    console.log(`📋 Bici totali viste da campo: ${campoBikesResponse.data.length}`);
    
    const superadminBikeFromCampo = campoBikesResponse.data.find(b => b.barcode === superadminBike.barcode);
    
    if (superadminBikeFromCampo) {
      console.log(`✅ Campo VEDE la bici creata da superadmin!`);
      console.log(`   Nome: ${superadminBikeFromCampo.name}`);
      console.log(`   Location: ${superadminBikeFromCampo.location?.name || 'N/A'}`);
    } else {
      console.log(`❌ Campo NON vede la bici creata da superadmin!`);
      console.log('📋 Bici visibili da campo:');
      campoBikesResponse.data.forEach((bike, i) => {
        console.log(`   ${i+1}. ${bike.name} (${bike.barcode}) - Location: ${bike.location?.name || bike.location}`);
      });
    }

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

// Aspetta che il server sia avviato
setTimeout(testBothDirections, 2000);