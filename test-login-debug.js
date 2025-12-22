import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testLoginDebug() {
  try {
    console.log('🧪 TEST LOGIN DEBUG\n');

    // Test login campo
    console.log('👤 Test login campo...');
    try {
      const campoLogin = await axios.post(`${API_BASE}/auth/login`, {
        username: 'campo',
        password: 'campo123'
      });
      
      console.log('✅ Login campo riuscito!');
      console.log('User data:', JSON.stringify(campoLogin.data.user, null, 2));
      
      // Decodifica il token per vedere il payload
      const token = campoLogin.data.token;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('Token payload:', JSON.stringify(payload, null, 2));
      
    } catch (error) {
      console.log('❌ Login campo fallito:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test login campo-sportivo (nome temporaneo)
    console.log('👤 Test login campo-sportivo...');
    try {
      const campoSportivoLogin = await axios.post(`${API_BASE}/auth/login`, {
        username: 'campo-sportivo',
        password: 'campo123'
      });
      
      console.log('✅ Login campo-sportivo riuscito!');
      console.log('User data:', JSON.stringify(campoSportivoLogin.data.user, null, 2));
      
      // Decodifica il token per vedere il payload
      const token = campoSportivoLogin.data.token;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('Token payload:', JSON.stringify(payload, null, 2));
      
    } catch (error) {
      console.log('❌ Login campo-sportivo fallito:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

setTimeout(testLoginDebug, 2000);