import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function fixUsernameViaAPI() {
  try {
    console.log('🔧 CORREZIONE USERNAME VIA API\n');

    // Prima verifichiamo che l'utente 'campo' esista
    console.log('🔍 Test login utente "campo"...');
    try {
      const campoLogin = await axios.post(`${API_BASE}/auth/login`, {
        username: 'campo',
        password: 'campo123'
      });
      console.log('✅ Utente "campo" esiste e funziona');
      console.log('Location:', campoLogin.data.user.location?.name);
    } catch (error) {
      console.log('❌ Utente "campo" non funziona:', error.response?.data?.error);
    }

    // Verifichiamo che l'utente 'campo-sportivo' esista
    console.log('\n🔍 Test login utente "campo-sportivo"...');
    try {
      const campoSportivoLogin = await axios.post(`${API_BASE}/auth/login`, {
        username: 'campo-sportivo',
        password: 'campo123'
      });
      console.log('✅ Utente "campo-sportivo" esiste e funziona');
      console.log('Location:', campoSportivoLogin.data.user.location?.name);
      console.log('Location ID:', campoSportivoLogin.data.user.location?._id);
    } catch (error) {
      console.log('❌ Utente "campo-sportivo" non funziona:', error.response?.data?.error);
    }

    console.log('\n📋 RACCOMANDAZIONE:');
    console.log('Usa "campo-sportivo" come username nel frontend');
    console.log('Username: campo-sportivo');
    console.log('Password: campo123');

  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

setTimeout(fixUsernameViaAPI, 2000);