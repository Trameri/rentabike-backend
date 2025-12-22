// Test di tutti gli utenti delle location
async function testAllLocations() {
  try {
    console.log('🧪 === TEST TUTTI GLI UTENTI LOCATION ===\n');

    const users = [
      { username: 'cancano', password: 'cancano123', locationName: 'Cancano' },
      { username: 'arnoga', password: 'arnoga123', locationName: 'Arnoga' },
      { username: 'campo', password: 'campo123', locationName: 'Campo Sportivo' }
    ];

    for (const user of users) {
      console.log(`🔐 === TEST ${user.locationName.toUpperCase()} ===`);
      
      // 1. Test login
      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });

      if (!loginResponse.ok) {
        console.log(`❌ Login fallito per ${user.username}: ${loginResponse.status}`);
        continue;
      }

      const loginData = await loginResponse.json();
      const token = loginData.token;
      console.log(`✅ Login ${user.username} successful`);
      console.log(`📍 Location ID: ${loginData.user.locationId || 'undefined'}`);
      console.log(`📍 Location: ${JSON.stringify(loginData.user.location)}`);

      // 2. Test bici disponibili
      const bikesResponse = await fetch('http://localhost:4000/api/bikes?status=available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (bikesResponse.ok) {
        const bikes = await bikesResponse.json();
        console.log(`🚲 Bici disponibili: ${bikes.length}`);
        if (bikes.length > 0) {
          console.log(`   Prima bici: ${bikes[0].name} (${bikes[0].barcode})`);
        }
      } else {
        console.log(`❌ Errore nel recupero bici: ${bikesResponse.status}`);
      }

      // 3. Test contratti esistenti
      const contractsResponse = await fetch('http://localhost:4000/api/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (contractsResponse.ok) {
        const contracts = await contractsResponse.json();
        console.log(`📋 Contratti esistenti: ${contracts.length}`);
        contracts.forEach((contract, index) => {
          console.log(`   ${index + 1}. Status: ${contract.status} | Location: ${contract.location}`);
        });
      } else {
        console.log(`❌ Errore nel recupero contratti: ${contractsResponse.status}`);
      }

      console.log(''); // Riga vuota per separare
    }

    // 4. Test statistiche superadmin
    console.log('📊 === STATISTICHE SUPERADMIN ===');
    const superLoginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'admin123'
      })
    });

    if (superLoginResponse.ok) {
      const superLoginData = await superLoginResponse.json();
      const superToken = superLoginData.token;

      const statsResponse = await fetch('http://localhost:4000/api/reports/superadmin-stats', {
        headers: { 'Authorization': `Bearer ${superToken}` }
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('📈 Statistiche attuali:');
        stats.locations.forEach(loc => {
          console.log(`🏢 ${loc.location.name}: €${loc.revenue} | ${loc.closedContracts} contratti chiusi`);
        });
        console.log(`🌍 Totale: €${stats.totals.revenue} | ${stats.totals.closedContracts} contratti chiusi`);
      }
    }

  } catch (error) {
    console.error('❌ Errore nel test:', error.message);
  }
}

testAllLocations();