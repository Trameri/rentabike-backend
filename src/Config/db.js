import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI non trovato nel file .env");
    }
    
    console.log("🔄 Connessione a MongoDB Cloud...");
    console.log("🌐 URI:", mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Nasconde le credenziali nel log
    
    // Configurazione ottimizzata per MongoDB Cloud
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 secondi per la selezione del server
      socketTimeoutMS: 45000,          // 45 secondi per le operazioni socket
      maxPoolSize: 10,                 // Massimo 10 connessioni nel pool
      retryWrites: true,               // Riprova automaticamente le scritture
      w: 'majority'                    // Write concern per la maggioranza dei nodi
    };
    
    await mongoose.connect(mongoUri, options);
    console.log("✅ MongoDB Cloud connesso con successo!");
    console.log("📊 Database:", mongoose.connection.name);
    
  } catch (err) {
    console.error("❌ Errore connessione MongoDB Cloud:", err.message);
    
    // Dettagli aggiuntivi per il debug
    if (err.message.includes('authentication')) {
      console.error("🔐 Problema di autenticazione - controlla username/password");
    } else if (err.message.includes('network')) {
      console.error("🌐 Problema di rete - controlla la connessione internet");
    } else if (err.message.includes('timeout')) {
      console.error("⏱️ Timeout - il server MongoDB potrebbe essere lento");
    }
    
    console.error("💡 Suggerimenti:");
    console.error("   - Verifica le credenziali nel file .env");
    console.error("   - Controlla che l'IP sia autorizzato in MongoDB Atlas");
    console.error("   - Verifica la connessione internet");
    
    // Esci dal processo se non riesce a connettersi
    process.exit(1);
  }
};

export default connectDB;
