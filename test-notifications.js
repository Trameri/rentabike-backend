import mongoose from 'mongoose';
import 'dotenv/config';
import Notification from './src/models/Notification.js';
import Location from './src/models/Location.js';

// Connetti al database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rentabike');
    console.log('✅ MongoDB connesso');
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
    process.exit(1);
  }
};

// Test delle notifiche
const testNotifications = async () => {
  try {
    console.log('\n🧪 Test Sistema Notifiche\n');

    // Trova una location di test
    const location = await Location.findOne();
    if (!location) {
      console.log('❌ Nessuna location trovata nel database');
      return;
    }

    console.log(`📍 Usando location: ${location.name} (${location.code})`);

    // Crea notifica di test
    const testNotification = new Notification({
      type: 'bike_created',
      title: 'Test Notifica - Bici Creata',
      message: `Test: Nuova bici creata presso ${location.name}`,
      data: {
        bikeId: new mongoose.Types.ObjectId(),
        bikeName: 'Bici Test',
        bikeBarcode: 'TEST123456',
        bikeType: 'city',
        priceHourly: 5,
        priceDaily: 25
      },
      sourceLocation: location._id,
      sourceUser: 'test_admin',
      sourceUserRole: 'admin',
      targetRole: 'superadmin',
      priority: 'medium'
    });

    await testNotification.save();
    console.log('✅ Notifica di test creata:', testNotification._id);

    // Verifica che la notifica sia stata salvata
    const savedNotification = await Notification.findById(testNotification._id)
      .populate('sourceLocation', 'name code');
    
    console.log('\n📋 Dettagli notifica salvata:');
    console.log(`- ID: ${savedNotification._id}`);
    console.log(`- Tipo: ${savedNotification.type}`);
    console.log(`- Titolo: ${savedNotification.title}`);
    console.log(`- Messaggio: ${savedNotification.message}`);
    console.log(`- Location: ${savedNotification.sourceLocation.name}`);
    console.log(`- Utente: ${savedNotification.sourceUser} (${savedNotification.sourceUserRole})`);
    console.log(`- Letta: ${savedNotification.read}`);
    console.log(`- Creata: ${savedNotification.createdAt}`);

    // Test conteggio notifiche non lette
    const unreadCount = await Notification.countDocuments({
      targetRole: 'superadmin',
      read: false
    });
    console.log(`\n📊 Notifiche non lette per superadmin: ${unreadCount}`);

    // Test query notifiche per superadmin
    const notifications = await Notification.find({
      targetRole: 'superadmin'
    })
    .populate('sourceLocation', 'name code logoUrl')
    .sort({ createdAt: -1 })
    .limit(5);

    console.log(`\n📝 Ultime ${notifications.length} notifiche per superadmin:`);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.sourceLocation.name} (${notif.read ? 'Letta' : 'Non letta'})`);
    });

    console.log('\n✅ Test completato con successo!');

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
};

// Esegui il test
const runTest = async () => {
  await connectDB();
  await testNotifications();
  
  console.log('\n🏁 Test terminato. Chiusura connessione...');
  await mongoose.connection.close();
  process.exit(0);
};

runTest();