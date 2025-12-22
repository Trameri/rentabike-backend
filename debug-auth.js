// Debug specifico dell'autenticazione
async function debugAuth() {
  try {
    console.log('🔍 === DEBUG AUTENTICAZIONE ===\n');

    // Test login e decodifica token
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'cancano',
        password: 'cancano123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login fallito');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('📋 Risposta login completa:');
    console.log(JSON.stringify(loginData, null, 2));

    // Decodifica il token JWT manualmente
    const token = loginData.token;
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('\n🔓 Payload JWT decodificato:');
    console.log(JSON.stringify(payload, null, 2));

    // Test API con token
    console.log('\n🧪 Test API con token...');
    const testResponse = await fetch('http://localhost:4000/api/bikes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`📊 Status API: ${testResponse.status}`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

debugAuth();