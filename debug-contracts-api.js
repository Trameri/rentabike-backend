// Debug contratti via API
async function debugContracts() {
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
    const token = loginData.token;
    console.log('✅ Login successful');

    // 2. Ottieni tutti i contratti per ogni location
    const locations = ['cancano', 'arnoga', 'campo'];
    
    for (const locationCode of locations) {
      console.log(`\n🏢 === ${locationCode.toUpperCase()} ===`);
      
      // Login come utente della location
      const userLoginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: locationCode,
          password: `${locationCode}123`
        })
      });

      if (userLoginResponse.ok) {
        const userData = await userLoginResponse.json();
        const userToken = userData.token;
        
        // Ottieni contratti della location
        const contractsResponse = await fetch('http://localhost:4000/api/contracts', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });

        if (contractsResponse.ok) {
          const contracts = await contractsResponse.json();
          console.log(`📊 Totale contratti: ${contracts.length}`);
          
          contracts.forEach((contract, index) => {
            const createdDate = new Date(contract.createdAt).toLocaleString('it-IT');
            const endDate = contract.endAt ? new Date(contract.endAt).toLocaleString('it-IT') : 'N/A';
            const revenue = contract.finalAmount || contract.totals?.grandTotal || 0;
            
            console.log(`  ${index + 1}. Status: ${contract.status} | Paid: ${contract.paid} | PaymentCompleted: ${contract.paymentCompleted} | Revenue: €${revenue}`);
            console.log(`     Creato: ${createdDate} | Fine: ${endDate} | CreatedBy: ${contract.createdBy || 'N/A'}`);
          });
        } else {
          console.log('❌ Errore nel recupero contratti');
        }
      } else {
        console.log(`❌ Login fallito per ${locationCode}`);
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

debugContracts();