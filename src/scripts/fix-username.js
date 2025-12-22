import User from '../models/User.js';

export async function fixUsername() {
  try {
    console.log('🔧 Correzione username: campo → campo-sportivo');
    
    // Trova l'utente 'campo'
    const campoUser = await User.findOne({ username: 'campo' });
    
    if (!campoUser) {
      console.log('❌ Utente "campo" non trovato nel database');
      return false;
    }

    console.log(`✅ Utente trovato: ${campoUser.username}`);
    
    // Cambia username
    campoUser.username = 'campo-sportivo';
    await campoUser.save();
    
    console.log('✅ Username cambiato con successo!');
    return true;
    
  } catch (error) {
    console.error('❌ Errore nella correzione username:', error.message);
    return false;
  }
}