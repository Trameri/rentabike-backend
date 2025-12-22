import DailyStats from '../models/DailyStats.js';

// Funzione per aggiornare le statistiche giornaliere
export async function updateDailyStats(locationId, updates) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inizio giornata
    
    // Trova o crea le statistiche per oggi
    let stats = await DailyStats.findOne({
      date: today,
      location: locationId
    });
    
    if (!stats) {
      stats = new DailyStats({
        date: today,
        location: locationId
      });
    }
    
    // Applica gli aggiornamenti
    if (updates.contractCreated) {
      stats.contracts.created += 1;
    }
    
    if (updates.contractCompleted) {
      stats.contracts.completed += 1;
    }
    
    if (updates.contractCancelled) {
      stats.contracts.cancelled += 1;
    }
    
    if (updates.contractReturned) {
      stats.contracts.returned += 1;
    }
    
    if (updates.payment) {
      const { amount, method, contractId, notes } = updates.payment;
      
      // Aggiorna totale revenue
      stats.revenue.total += amount;
      
      // Aggiorna revenue per metodo di pagamento
      switch (method) {
        case 'cash':
          stats.revenue.cash += amount;
          break;
        case 'card':
          stats.revenue.card += amount;
          break;
        case 'bank':
          stats.revenue.bank += amount;
          break;
        case 'paypal':
          stats.revenue.paypal += amount;
          break;
        default:
          stats.revenue.other += amount;
      }
      
      // Aggiungi dettaglio pagamento
      stats.payments.push({
        contractId,
        amount,
        method,
        notes,
        timestamp: new Date()
      });
    }
    
    if (updates.rental) {
      const { bikes, accessories, hours } = updates.rental;
      stats.rentals.bikes += bikes || 0;
      stats.rentals.accessories += accessories || 0;
      stats.rentals.totalHours += hours || 0;
      
      // Calcola media ore
      if (stats.contracts.created > 0) {
        stats.rentals.averageHours = stats.rentals.totalHours / stats.contracts.created;
      }
    }
    
    // Assicurazione esclusa dalle statistiche su richiesta
    // (non aggiorniamo più le statistiche assicurazione)
    
    await stats.save();
    return stats;
    
  } catch (error) {
    console.error('Errore aggiornamento statistiche:', error);
    throw error;
  }
}

// Funzione per ottenere statistiche per un periodo
export async function getStatsForPeriod(locationId, startDate, endDate) {
  try {
    const stats = await DailyStats.find({
      location: locationId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });
    
    return stats;
  } catch (error) {
    console.error('Errore recupero statistiche:', error);
    throw error;
  }
}

// Funzione per ottenere report giornaliero
export async function getDailyReport(locationId, date = new Date()) {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const stats = await DailyStats.findOne({
      location: locationId,
      date: targetDate
    }).populate('payments.contractId', 'customer');
    
    return stats;
  } catch (error) {
    console.error('Errore recupero report giornaliero:', error);
    throw error;
  }
}