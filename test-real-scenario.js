import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testRealScenario() {
  try {
    console.log('🧪 TEST SCENARIO REALE: SUPERADMIN CREA → CAMPO VEDE\n');

    // STEP 1: Login come superadmin
    console.log('👑 STEP 1: Login come superadmin...');
    const superadminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    
    const superadminToken = superadminLogin.data.token;
    console.log('✅ Superadmin loggato!\n');

    // STEP 2: Superadmin vede le location disponibili
    console.log('🏢 STEP 2: Superadmin carica location...');
    const locationsResponse = await axios.get(`${API_BASE}/locations`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    const campoLocation = locationsResponse.data.find(l => l.code === 'campo');
    console.log(`✅ Campo Sportivo trovato: ${campoLocation.name} (ID: ${campoLocation._id})\n`);

    // STEP 3: Superadmin crea una bici per Campo Sportivo
    console.log('🚲 STEP 3: Superadmin crea bici per Campo Sportivo...');
    const newBike = {
      name: 'Bici Test Comunicazione',
      barcode: 'TEST' + Date.now(),
      type: 'ebike-full',
      priceHourly: 8,
      priceDaily: 40,
      location: campoLocation._id
    };

    const createBikeResponse = await axios.post(`${API_BASE}/bikes`, newBike, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    console.log(`✅ Bici creata: ${createBikeResponse.data.name}`);
    console.log(`   Barcode: ${createBikeResponse.data.barcode}`);
    console.log(`   Location: ${createBikeResponse.data.location}\n`);

    // STEP 4: Superadmin crea un accessorio per Campo Sportivo
    console.log('🎒 STEP 4: Superadmin crea accessorio per Campo Sportivo...');
    const newAccessory = {
      name: 'Accessorio Test Comunicazione',
      barcode: 'ACCTEST' + Date.now(),
      priceHourly: 2,
      priceDaily: 10,
      location: campoLocation._id
    };

    const createAccessoryResponse = await axios.post(`${API_BASE}/accessories`, newAccessory, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    
    console.log(`✅ Accessorio creato: ${createAccessoryResponse.data.name}`);
    console.log(`   Barcode: ${createAccessoryResponse.data.barcode}\n`);

    // STEP 5: Logout superadmin e login come campo
    console.log('🔄 STEP 5: Cambio utente - Login come campo...');
    const campoLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'campo',
      password: 'campo123'
    });
    
    const campoToken = campoLogin.data.token;
    const campoUser = campoLogin.data.user;
    console.log(`✅ Campo loggato! Location: ${campoUser.location?.name}\n`);

    // STEP 6: Campo carica le sue bici
    console.log('🚲 STEP 6: Campo carica le sue bici...');
    const campoBikesResponse = await axios.get(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    
    console.log(`📋 Bici totali viste da campo: ${campoBikesResponse.data.length}`);
    
    const createdBike = campoBikesResponse.data.find(b => b.barcode === newBike.barcode);
    if (createdBike) {
      console.log(`✅ BICI CREATA DAL SUPERADMIN VISIBILE!`);
      console.log(`   Nome: ${createdBike.name}`);
      console.log(`   Location: ${createdBike.location?.name || createdBike.location}`);
    } else {
      console.log(`❌ BICI CREATA DAL SUPERADMIN NON VISIBILE!`);
      console.log('📋 Bici visibili:');
      campoBikesResponse.data.forEach((bike, i) => {
        console.log(`   ${i+1}. ${bike.name} (${bike.barcode})`);
      });
    }

    // STEP 7: Campo carica i suoi accessori
    console.log('\n🎒 STEP 7: Campo carica i suoi accessori...');
    const campoAccessoriesResponse = await axios.get(`${API_BASE}/accessories`, {
      headers: { Authorization: `Bearer ${campoToken}` }
    });
    
    console.log(`📋 Accessori totali visti da campo: ${campoAccessoriesResponse.data.length}`);
    
    const createdAccessory = campoAccessoriesResponse.data.find(a => a.barcode === newAccessory.barcode);
    if (createdAccessory) {
      console.log(`✅ ACCESSORIO CREATO DAL SUPERADMIN VISIBILE!`);
      console.log(`   Nome: ${createdAccessory.name}`);
      console.log(`   Location: ${createdAccessory.location?.name || createdAccessory.location}`);
    } else {
      console.log(`❌ ACCESSORIO CREATO DAL SUPERADMIN NON VISIBILE!`);
      console.log('📋 Accessori visibili:');
      campoAccessoriesResponse.data.forEach((accessory, i) => {
        console.log(`   ${i+1}. ${accessory.name} (${accessory.barcode})`);
      });
    }

    // STEP 8: Test creazione contratto
    console.log('\n📝 STEP 8: Campo prova a creare un contratto...');
    const availableBikes = campoBikesResponse.data.filter(b => b.status === 'available');
    console.log(`🚲 Bici disponibili per contratto: ${availableBikes.length}`);
    
    if (availableBikes.length > 0) {
      console.log('✅ Campo può creare contratti con le bici disponibili');
    } else {
      console.log('❌ Campo non ha bici disponibili per creare contratti');
    }

  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

// Aspetta che il server sia avviato
setTimeout(testRealScenario, 3000);