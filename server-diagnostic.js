import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 DIAGNOSTICA SERVER');
console.log('====================');

// Test variabili ambiente
console.log('\n📋 VARIABILI AMBIENTE:');
console.log('PORT:', process.env.PORT || 'NON DEFINITA');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'DEFINITA' : 'NON DEFINITA');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINITA' : 'NON DEFINITA');

// Test connessione MongoDB
console.log('\n🔗 TEST CONNESSIONE MONGODB:');
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connessione MongoDB riuscita');
  
  // Test query semplice
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📊 Collections trovate:', collections.map(c => c.name));
  
  await mongoose.disconnect();
  console.log('✅ Disconnessione MongoDB riuscita');
} catch (error) {
  console.error('❌ Errore connessione MongoDB:', error.message);
}

// Test porte
console.log('\n🌐 TEST PORTE:');
import net from 'net';

const testPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => {
        resolve(true);
      });
    });
    server.on('error', () => {
      resolve(false);
    });
  });
};

const port = process.env.PORT || 4000;
const portAvailable = await testPort(port);
console.log(`Porta ${port}:`, portAvailable ? '✅ Disponibile' : '❌ Occupata');

console.log('\n🔍 DIAGNOSTICA COMPLETATA');