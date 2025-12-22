// Test specifico per creare contratto Campo Sportivo
async function testCampoContract() {
  try {
    console.log('🧪 === TEST CONTRATTO CAMPO SPORTIVO ===\n');

    // 1. Login come campo
    console.log('🔐 1. Login come campo...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'campo',
        password: 'campo123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Decodifica token per debug
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log(`📍 LocationId nel token: ${payload.locationId}`);

    // 2. Ottieni bici disponibili
    console.log('\n🚲 2. Cerco bici disponibili...');
    const bikesResponse = await fetch('http://localhost:4000/api/bikes?status=available', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const bikes = await bikesResponse.json();
    console.log(`📊 Bici disponibili: ${bikes.length}`);
    
    if (bikes.length === 0) {
      console.log('❌ Nessuna bici disponibile');
      return;
    }

    const testBike = bikes[0];
    console.log(`🎯 Uso bici: ${testBike.name} (${testBike.barcode})`);

    // 3. Crea contratto
    console.log('\n📝 3. Creo contratto...');
    const contractData = {
      customer: {
        name: 'Test Campo User',
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
      notes: 'Contratto test Campo Sportivo'
    };

    const createResponse = await fetch('http://localhost:4000/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contractData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`❌ Errore creazione: ${createResponse.status} - ${errorText}`);
      return;
    }

    const newContract = await createResponse.json();
    console.log('✅ Contratto creato!');
    console.log(`📋 ID: ${newContract._id}`);
    console.log(`📍 Location: ${newContract.location}`);

    // 4. Chiudi contratto
    console.log('\n🔒 4. Chiudo contratto...');
    const closeResponse = await fetch(`http://localhost:4000/api/contracts/${newContract._id}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endAt: new Date().toISOString(),
        paymentMethod: 'cash',
        isPaid: true,
        closureNotes: 'Test chiusura Campo'
      })
    });

    if (!closeResponse.ok) {
      const errorText = await closeResponse.text();
      console.log(`❌ Errore chiusura: ${closeResponse.status} - ${errorText}`);
      return;
    }

    const closedContract = await closeResponse.json();
    console.log('✅ Contratto chiuso!');
    console.log(`📊 Status: ${closedContract.status}`);
    console.log(`💰 Paid: ${closedContract.paid}`);
    console.log(`💳 PaymentCompleted: ${closedContract.paymentCompleted}`);
    console.log(`💵 FinalAmount: ${closedContract.finalAmount}`);

    // 5. Verifica statistiche
    console.log('\n📊 5. Verifico statistiche...');
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

    const statsResponse = await fetch('http://localhost:4000/api/reports/superadmin-stats', {
      headers: { 'Authorization': `Bearer ${superToken}` }
    });

    const stats = await statsResponse.json();
    const campoStats = stats.locations.find(l => l.location.code === 'campo');
    
    console.log(`🏢 Campo Sportivo - Revenue: €${campoStats.revenue} | Contratti: ${campoStats.closedContracts}`);
    console.log(`🌍 Totale - Revenue: €${stats.totals.revenue} | Contratti: ${stats.totals.closedContracts}`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

testCampoContract();