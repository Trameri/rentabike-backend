import Contract from '../models/Contract.js';
import Location from '../models/Location.js';
import Bike from '../models/Bike.js';
import Accessory from '../models/Accessory.js';

// Funzione per calcolare il totale di un contratto dinamicamente
function calculateContractTotal(contract) {
  if (!contract || !contract.items) return 0;
  
  const startDate = new Date(contract.startAt || contract.createdAt);
  const endDate = new Date(contract.endAt || new Date());
  const durationMs = endDate - startDate;
  const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
  const durationDays = Math.max(1, Math.ceil(durationHours / 24));
  
  let totalAmount = 0;
  
  contract.items.forEach(item => {
    if (item.kind === 'bike' || item.kind === 'accessory') {
      let itemTotal = 0;
      
      // Calcola il prezzo migliore tra orario e giornaliero
      const hourlyTotal = (item.priceHourly || 0) * durationHours;
      const dailyTotal = (item.priceDaily || 0) * durationDays;
      
      if (item.priceDaily && dailyTotal < hourlyTotal) {
        itemTotal = dailyTotal;
      } else {
        itemTotal = hourlyTotal;
      }
      
      // Assicurazione esclusa dai calcoli finanziari su richiesta
      // (non aggiungiamo più l'assicurazione al totale item)
      
      totalAmount += itemTotal;
    }
  });
  
  // Assicurazione flat del contratto esclusa dai calcoli finanziari
  // (non aggiungiamo più l'assicurazione flat al totale contratto)
  
  return totalAmount;
}

export async function summary(req,res){
  try {
    const { from, to, location, type } = req.query;
    const filter = { 
      $or: [
        { status: 'completed' },
        { status: 'returned', paymentCompleted: true }
      ]
    };
    
    // Superadmin può vedere tutto, altri utenti solo la loro location
    if(req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    } else if(location) {
      // Superadmin può filtrare per location specifica
      filter.location = location;
    }
    
    if(from || to){
      filter.createdAt = {};
      if(from) filter.createdAt.$gte = new Date(from);
      if(to) filter.createdAt.$lte = new Date(to);
    }
    
    const rows = await Contract.find(filter).select('totals finalAmount createdAt location items status').populate('location').lean();
  
  let total = 0;
  let filteredRows = rows;
  
  // Filtra per tipo se specificato
  if(type && type !== 'all') {
    filteredRows = rows.filter(contract => {
      if(type === 'bikes') {
        return contract.items?.some(item => item.kind === 'bike');
      } else if(type === 'accessories') {
        return contract.items?.some(item => item.kind === 'accessory');
      }
      return true;
    });
  }
  
  // Calcola il totale usando finalAmount (prezzo bloccato) o calcolo dinamico
  total = filteredRows.reduce((s, r) => {
    // Priorità: finalAmount (prezzo bloccato) > totals.subtotal > calcolo dinamico
    let contractTotal = 0;
    
    if (r.finalAmount !== undefined && r.finalAmount !== null) {
      contractTotal = r.finalAmount;
    } else if (r.totals?.subtotal !== undefined) {
      // Usa sempre subtotal (senza assicurazione) invece di grandTotal
      contractTotal = r.totals.subtotal;
    } else {
      // Calcolo dinamico se non c'è finalAmount
      contractTotal = calculateContractTotal(r);
    }
    
    return s + contractTotal;
  }, 0);
  
  // Aggiungi statistiche aggiuntive
  const activeContracts = await Contract.countDocuments({
    ...filter,
    status: { $in: ['in-use', 'reserved'] }
  });
  
  // Statistiche bici se nella stessa location
  let bikeStats = null;
  if(req.user.role !== 'superadmin' || location) {
    const bikeFilter = req.user.role !== 'superadmin' ? 
      { location: req.user.locationId } : 
      { location: location };
      
    const totalBikes = await Bike.countDocuments(bikeFilter);
    const availableBikes = await Bike.countDocuments({ ...bikeFilter, status: 'available' });
    const bikesInUse = await Bike.countDocuments({ ...bikeFilter, status: 'in-use' });
    
    bikeStats = {
      totalBikes,
      availableBikes,
      bikesInUse
    };
  }
  
    res.json({ 
      total, 
      count: filteredRows.length, 
      contracts: filteredRows,
      activeContracts,
      ...bikeStats
    });
  } catch (error) {
    console.error('Errore nel summary:', error);
    res.status(500).json({ 
      error: 'Errore nel caricamento del riepilogo',
      total: 0,
      count: 0,
      contracts: [],
      activeContracts: 0,
      totalBikes: 0,
      availableBikes: 0
    });
  }
}

// Nuova funzione per statistiche superadmin
export async function superadminStats(req,res){
  if(req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { from, to } = req.query;
  const dateFilter = {};
  if(from || to){
    dateFilter.createdAt = {};
    if(from) dateFilter.createdAt.$gte = new Date(from);
    if(to) dateFilter.createdAt.$lte = new Date(to);
  }
  
  // Ottieni tutte le location
  const locations = await Location.find({}).lean();
  
  // Statistiche per ogni location
  const locationStats = [];
  for(const location of locations) {
    const filter = { 
      location: location._id, 
      $or: [
        { status: 'completed' },
        { status: 'returned', paymentCompleted: true }
      ],
      ...dateFilter 
    };
    const contracts = await Contract.find(filter).select('totals finalAmount createdAt items startAt endAt insuranceFlat').lean();
    const total = contracts.reduce((s, r) => {
      // Priorità: finalAmount (prezzo bloccato) > totals.grandTotal > calcolo dinamico
      let contractTotal = 0;
      
      if (r.finalAmount !== undefined && r.finalAmount !== null) {
        contractTotal = r.finalAmount;
      } else if (r.totals?.subtotal) {
        // Usa sempre subtotal (senza assicurazione) invece di grandTotal
        contractTotal = r.totals.subtotal;
      } else {
        // Calcolo dinamico se non c'è finalAmount
        contractTotal = calculateContractTotal(r);
      }
      
      return s + contractTotal;
    }, 0);
    
    // Contratti attivi
    const activeContracts = await Contract.countDocuments({ 
      location: location._id, 
      status: { $in: ['in-use', 'reserved'] } 
    });
    
    locationStats.push({
      location: location,
      revenue: total,
      closedContracts: contracts.length,
      activeContracts: activeContracts,
      totalContracts: contracts.length + activeContracts
    });
  }
  
  // Totali generali
  const totalRevenue = locationStats.reduce((s, l) => s + l.revenue, 0);
  const totalClosedContracts = locationStats.reduce((s, l) => s + l.closedContracts, 0);
  const totalActiveContracts = locationStats.reduce((s, l) => s + l.activeContracts, 0);
  
  res.json({
    locations: locationStats,
    totals: {
      revenue: totalRevenue,
      closedContracts: totalClosedContracts,
      activeContracts: totalActiveContracts,
      totalContracts: totalClosedContracts + totalActiveContracts
    }
  });
}

// Statistiche dettagliate
export async function detailedStats(req, res) {
  const { from, to } = req.query;
  const filter = { 
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ]
  };
  
  // Superadmin può vedere tutto, altri utenti solo la loro location
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  if(from || to){
    filter.createdAt = {};
    if(from) filter.createdAt.$gte = new Date(from);
    if(to) filter.createdAt.$lte = new Date(to);
  }
  
  const contracts = await Contract.find(filter).select('totals finalAmount items createdAt customer startAt endAt insuranceFlat').lean();
  
  // Calcola statistiche dettagliate
  const stats = {
    totalRevenue: 0,
    bikeRevenue: 0,
    accessoryRevenue: 0,
    insuranceRevenue: 0,
    averageContractValue: 0,
    totalContracts: contracts.length,
    totalItems: 0,
    bikeRentals: 0,
    accessoryRentals: 0,
    averageDuration: 0,
    peakHours: {},
    paymentMethods: {}
  };
  
  let totalDuration = 0;
  
  contracts.forEach(contract => {
    // Priorità: finalAmount (prezzo bloccato) > totals.grandTotal > calcolo dinamico
    let total = 0;
    
    if (contract.finalAmount !== undefined && contract.finalAmount !== null) {
      total = contract.finalAmount;
    } else if (contract.totals?.subtotal) {
      // Usa sempre subtotal (senza assicurazione) invece di grandTotal
      total = contract.totals.subtotal;
    } else {
      // Calcolo dinamico se non c'è finalAmount
      total = calculateContractTotal(contract);
    }
    
    stats.totalRevenue += total;
    
    // Analizza items
    contract.items?.forEach(item => {
      stats.totalItems++;
      if(item.kind === 'bike') {
        stats.bikeRentals++;
        stats.bikeRevenue += item.priceHourly || 0;
      } else if(item.kind === 'accessory') {
        stats.accessoryRentals++;
        stats.accessoryRevenue += item.priceHourly || 0;
      }
      
      // Assicurazione esclusa dalle statistiche dettagliate
      // (non accumuliamo più ricavi da assicurazione)
    });
    
    // Analizza orari (ore di picco)
    const hour = new Date(contract.createdAt).getHours();
    stats.peakHours[hour] = (stats.peakHours[hour] || 0) + 1;
    
    // Durata media (se disponibile)
    if(contract.endAt) {
      const duration = (new Date(contract.endAt) - new Date(contract.createdAt)) / (1000 * 60 * 60);
      totalDuration += duration;
    }
  });
  
  stats.averageContractValue = stats.totalContracts > 0 ? stats.totalRevenue / stats.totalContracts : 0;
  stats.averageDuration = stats.totalContracts > 0 ? totalDuration / stats.totalContracts : 0;
  
  res.json(stats);
}

// Top bici più noleggiate
export async function topBikes(req, res) {
  const { from, to, limit = 10 } = req.query;
  const filter = { 
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ]
  };
  
  // Superadmin può vedere tutto, altri utenti solo la loro location
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  if(from || to){
    filter.createdAt = {};
    if(from) filter.createdAt.$gte = new Date(from);
    if(to) filter.createdAt.$lte = new Date(to);
  }
  
  const contracts = await Contract.find(filter).select('items totals').lean();
  
  // Conta utilizzi per bici
  const bikeStats = {};
  
  contracts.forEach(contract => {
    contract.items?.forEach(item => {
      if(item.kind === 'bike') {
        const key = `${item.name}_${item.barcode}`;
        if(!bikeStats[key]) {
          bikeStats[key] = {
            name: item.name,
            barcode: item.barcode,
            rentals: 0,
            revenue: 0
          };
        }
        bikeStats[key].rentals++;
        bikeStats[key].revenue += item.priceHourly || 0;
      }
    });
  });
  
  // Ordina per numero di noleggi
  const topBikes = Object.values(bikeStats)
    .sort((a, b) => b.rentals - a.rentals)
    .slice(0, parseInt(limit));
  
  res.json(topBikes);
}

// Ricavi per giorno
export async function revenueByDay(req, res) {
  const { from, to } = req.query;
  const filter = { 
    $or: [
      { status: 'completed' },
      { status: 'returned', paymentCompleted: true }
    ]
  };
  
  // Superadmin può vedere tutto, altri utenti solo la loro location
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  if(from || to){
    filter.createdAt = {};
    if(from) filter.createdAt.$gte = new Date(from);
    if(to) filter.createdAt.$lte = new Date(to);
  }
  
  const contracts = await Contract.find(filter).select('totals finalAmount createdAt items startAt endAt insuranceFlat').lean();
  
  // Raggruppa per giorno
  const dailyRevenue = {};
  
  contracts.forEach(contract => {
    const date = new Date(contract.createdAt).toISOString().split('T')[0];
    if(!dailyRevenue[date]) {
      dailyRevenue[date] = {
        date,
        revenue: 0,
        contracts: 0
      };
    }
    
    // Priorità: finalAmount (prezzo bloccato) > totals.grandTotal > calcolo dinamico
    let contractTotal = 0;
    
    if (contract.finalAmount !== undefined && contract.finalAmount !== null) {
      contractTotal = contract.finalAmount;
    } else if (contract.totals?.grandTotal) {
      contractTotal = contract.totals.grandTotal;
    } else {
      // Calcolo dinamico se non c'è finalAmount
      contractTotal = calculateContractTotal(contract);
    }
    
    dailyRevenue[date].revenue += contractTotal;
    dailyRevenue[date].contracts++;
  });
  
  // Converti in array e ordina per data
  const result = Object.values(dailyRevenue)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json(result);
}
