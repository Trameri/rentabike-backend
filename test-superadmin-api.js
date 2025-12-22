import fetch from 'node-fetch';

async function testSuperadminAPI() {
  try {
    // 1. Login come superadmin
    console.log('🔐 Login come superadmin...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    const token = loginData.token;
    if (!token) {
      throw new Error('No token received');
    }

    // 2. Chiama l'API superadmin-stats
    console.log('📊 Chiamata API superadmin-stats...');
    const statsResponse = await fetch('http://localhost:4000/api/reports/superadmin-stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      throw new Error(`API call failed: ${statsResponse.status} - ${errorText}`);
    }

    const statsData = await statsResponse.json();
    console.log('✅ API Response:');
    console.log(JSON.stringify(statsData, null, 2));

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

testSuperadminAPI();