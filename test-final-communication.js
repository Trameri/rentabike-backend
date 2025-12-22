import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testFinalCommunication() {
  try {
    console.log('🧪 TEST FINALE COMUNICAZIONE SUPERADMIN ↔ CAMPO-SPORTIVO\n');

    // STEP 1: Login superadmin
    console.log('👑 STEP 1: Login superadmin...');
    const superadminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    const superadminToken = superadminLogin.data.token;
    console.log('✅ Superadmin loggato!\n');

    // STEP 2: Superadmin ottiene location Campo Sportivo
    console.log('🏢 STEP 2: Superadmin carica location...');
    const locationsResponse = await axios.get(`${API_BASE}/locations`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const campoLocation = locationsResponse.data.find(l => l.code === 'campo');
    console.log(`✅ Campo Sportivo: ${campoLocation.name} (ID: ${campoLocation._id})\n`);

    // STEP 3: Superadmin crea bici per Campo Sportivo
    console.log('🚲 STEP 3: Superadmin crea bici per Campo Sportivo...');
    const newBike = {
      name: 'Bici Test Finale',
      barcode: 'FINALE' + Date.now(),
      type: 'ebike-full',
      priceHourly: 8,
      priceDaily: 45,
      location: campoLocation._id
    };

    const createBikeResponse = await axios.post(`${API_BASE}/bikes`, newBike, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    console.log(`✅ Bici creata: ${createBikeResponse.data.name} (${createBikeResponse.data.barcode})\n`);

    // STEP 4: Login campo-sportivo
    console.log('👤 STEP 4: Login campo-sportivo...');
    const campoLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'campo-sportivo',
      password: 'campo123'
    });
    const campoToken = campoLogin.data.token;
    const campoUser = campoLogin.data.user;
    console.log(`✅ Campo-sportivo loggato! Location: ${campoUser.location?.name}\n`);

    // STEP 5: Campo-sportivo vede le sue bici
    console.log('🔍 STEP 5: Campo-sportivo carica le sue bici...');
    const campoBikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    
    console.log(`📋 Bici totali viste da campo-sportivo: ${campoBikesResponse.data.length}`);
    
    const createdBike = campoBikesResponse.data.find(b => b.barcode === newBike.barcode);
    if (createdBike) {
      console.log(`✅ SUCCESSO! Campo-sportivo VEDE la bici creata dal superadmin!`);
      console.log(`   Nome: ${createdBike.name}`);
      console.log(`   Location: ${createdBike.location?.name}`);
    } else {
      console.log(`❌ PROBLEMA! Campo-sportivo NON vede la bici creata dal superadmin!`);
    }

    // STEP 6: Campo-sportivo crea una bici
    console.log('\n🚲 STEP 6: Campo-sportivo crea una bici...');
    const campoBike = {
      name: 'Bici Creata da Campo',
      barcode: 'CAMPOBIKE' + Date.now(),
      type: 'ebike-full',
      priceHourly: 7,
      priceDaily: 40
    };

    const campoBikeResponse = await axios.post(`${API_BASE}/bikes`, campoBike, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    console.log(`✅ Bici creata da campo: ${campoBikeResponse.data.name} (${campoBikeResponse.data.barcode})\n`);

    // STEP 7: Superadmin vede tutte le bici
    console.log('🔍 STEP 7: Superadmin carica tutte le bici...');
    const allBikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    const campoBikeFromSuperadmin = allBikesResponse.data.find(b => b.barcode === campoBike.barcode);
    if (campoBikeFromSuperadmin) {
      console.log(`✅ SUCCESSO! Superadmin VEDE la bici creata da campo-sportivo!`);
      console.log(`   Nome: ${campoBikeFromSuperadmin.name}`);
      console.log(`   Location: ${campoBikeFromSuperadmin.location?.name}`);
    } else {
      console.log(`❌ PROBLEMA! Superadmin NON vede la bici creata da campo-sportivo!`);
    }

    console.log('\n🎉 TEST COMPLETATO!');
    console.log('Ora puoi usare nel frontend:');
    console.log('   Username: campo-sportivo');
    console.log('   Password: campo123');

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

setTimeout(testFinalCommunication, 2000);