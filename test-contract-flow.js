// Test completo del flusso contratto
async function testContractFlow() {
  try {
    console.log('🧪 === TEST FLUSSO CONTRATTO ===\n');

    // 1. Login come arnoga
    console.log('🔐 1. Login come arnoga...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'arnoga',
        password: 'arnoga123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login arnoga fallito: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const arnogaToken = loginData.token;
    console.log('✅ Login arnoga successful');
    console.log('📍 Location ID:', loginData.user.locationId);

    // 2. Ottieni una bici disponibile
    console.log('\n🚲 2. Cerco bici disponibili...');
    const bikesResponse = await fetch('http://localhost:4000/api/bikes?status=available', {
      headers: { 'Authorization': `Bearer ${arnogaToken}` }
    });

    if (!bikesResponse.ok) {
      throw new Error(`Errore nel recupero bici: ${bikesResponse.status}`);
    }

    const bikes = await bikesResponse.json();
    console.log(`📊 Bici disponibili: ${bikes.length}`);
    
    if (bikes.length === 0) {
      console.log('❌ Nessuna bici disponibile per il test');
      return;
    }

    const testBike = bikes[0];
    console.log(`🎯 Uso bici: ${testBike.name} (${testBike.barcode})`);

    // 3. Crea contratto
    console.log('\n📝 3. Creo contratto...');
    const contractData = {
      customer: {
        name: 'Test User Debug',
        phone: '1234567890'
      },
      items: [{
        id: testBike._id,
        kind: 'bike',
        priceHourly: testBike.priceHourly,
        priceDaily: testBike.priceDaily,
        insurance: false
      }],
      status: 'in-use',
      notes: 'Contratto di test per debug'
    };

    const createResponse = await fetch('http://localhost:4000/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arnogaToken}`
      },
      body: JSON.stringify(contractData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Errore creazione contratto: ${createResponse.status} - ${errorText}`);
    }

    const newContract = await createResponse.json();
    console.log('✅ Contratto creato!');
    console.log(`📋 ID: ${newContract._id}`);
    console.log(`📍 Location: ${newContract.location}`);
    console.log(`📊 Status: ${newContract.status}`);

    // 4. Chiudi contratto
    console.log('\n🔒 4. Chiudo contratto...');
    const closeData = {
      endAt: new Date().toISOString(),
      paymentMethod: 'cash',
      isPaid: true,
      closureNotes: 'Test chiusura debug'
    };

    const closeResponse = await fetch(`http://localhost:4000/api/contracts/${newContract._id}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arnogaToken}`
      },
      body: JSON.stringify(closeData)
    });

    if (!closeResponse.ok) {
      const errorText = await closeResponse.text();
      throw new Error(`Errore chiusura contratto: ${closeResponse.status} - ${errorText}`);
    }

    const closedContract = await closeResponse.json();
    console.log('✅ Contratto chiuso!');
    console.log(`📊 Status: ${closedContract.status}`);
    console.log(`💰 Paid: ${closedContract.paid}`);
    console.log(`💳 PaymentCompleted: ${closedContract.paymentCompleted}`);
    console.log(`💵 FinalAmount: ${closedContract.finalAmount}`);
    console.log(`📈 Totals: ${JSON.stringify(closedContract.totals)}`);

    // 5. Verifica statistiche superadmin
    console.log('\n📊 5. Verifico statistiche superadmin...');
    
    // Login superadmin
    const superLoginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'admin123'
      })
    });

    const superLoginData = await superLoginResponse.json();
    const superToken = superLoginData.token;

    // Ottieni statistiche
    const statsResponse = await fetch('http://localhost:4000/api/reports/superadmin-stats', {
      headers: { 'Authorization': `Bearer ${superToken}` }
    });

    const stats = await statsResponse.json();
    console.log('📈 Statistiche superadmin:');
    
    const arnogaStats = stats.locations.find(l => l.location.code === 'arnoga');
    if (arnogaStats) {
      console.log(`🏢 Arnoga - Revenue: €${arnogaStats.revenue} | Contratti chiusi: ${arnogaStats.closedContracts}`);
    } else {
      console.log('❌ Statistiche Arnoga non trovate');
    }

    console.log(`🌍 Totale - Revenue: €${stats.totals.revenue} | Contratti chiusi: ${stats.totals.closedContracts}`);

  } catch (error) {
    console.error('❌ Errore nel test:', error.message);
  }
}

testContractFlow();