import { getDailyReport, getStatsForPeriod } from '../utils/statsHelper.js';
import DailyStats from '../models/DailyStats.js';

// Report giornaliero
export const getDailyReportController = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Determina location
    const locationId = req.user.role === 'superadmin' ? 
      req.query.locationId : req.user.locationId;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID richiesto' });
    }
    
    const report = await getDailyReport(locationId, targetDate);
    
    res.json({
      date: targetDate,
      locationId,
      stats: report || {
        date: targetDate,
        location: locationId,
        contracts: { created: 0, completed: 0, cancelled: 0, returned: 0 },
        revenue: { total: 0, cash: 0, card: 0, bank: 0, paypal: 0, other: 0 },
        rentals: { bikes: 0, accessories: 0, totalHours: 0, averageHours: 0 },
        // Assicurazione esclusa dalle statistiche su richiesta
        payments: []
      }
    });
  } catch (error) {
    console.error('Errore report giornaliero:', error);
    res.status(500).json({ error: error.message });
  }
};

// Report per periodo
export const getPeriodReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Date di inizio e fine richieste' });
    }
    
    // Determina location
    const locationId = req.user.role === 'superadmin' ? 
      req.query.locationId : req.user.locationId;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID richiesto' });
    }
    
    const stats = await getStatsForPeriod(locationId, startDate, endDate);
    
    // Calcola totali per il periodo
    const totals = stats.reduce((acc, day) => {
      acc.contracts.created += day.contracts.created;
      acc.contracts.completed += day.contracts.completed;
      acc.contracts.cancelled += day.contracts.cancelled;
      acc.contracts.returned += day.contracts.returned;
      
      acc.revenue.total += day.revenue.total;
      acc.revenue.cash += day.revenue.cash;
      acc.revenue.card += day.revenue.card;
      acc.revenue.bank += day.revenue.bank;
      acc.revenue.paypal += day.revenue.paypal;
      acc.revenue.other += day.revenue.other;
      
      acc.rentals.bikes += day.rentals.bikes;
      acc.rentals.accessories += day.rentals.accessories;
      acc.rentals.totalHours += day.rentals.totalHours;
      
      // Assicurazione esclusa dai totali su richiesta
      // (non accumuliamo più statistiche assicurazione)
      
      return acc;
    }, {
      contracts: { created: 0, completed: 0, cancelled: 0, returned: 0 },
      revenue: { total: 0, cash: 0, card: 0, bank: 0, paypal: 0, other: 0 },
      rentals: { bikes: 0, accessories: 0, totalHours: 0, averageHours: 0 },
      // Assicurazione esclusa dalle statistiche su richiesta
    });
    
    // Calcola media ore
    if (totals.contracts.created > 0) {
      totals.rentals.averageHours = totals.rentals.totalHours / totals.contracts.created;
    }
    
    res.json({
      startDate,
      endDate,
      locationId,
      dailyStats: stats,
      totals
    });
  } catch (error) {
    console.error('Errore report periodo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Statistiche dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const locationId = req.user.role === 'superadmin' ? 
      req.query.locationId : req.user.locationId;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID richiesto' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Statistiche di oggi
    const todayStats = await getDailyReport(locationId, today);
    
    // Statistiche della settimana
    const weekStats = await getStatsForPeriod(locationId, weekAgo, today);
    const weekTotals = weekStats.reduce((acc, day) => {
      acc.revenue += day.revenue.total;
      acc.contracts += day.contracts.completed;
      acc.bikes += day.rentals.bikes;
      return acc;
    }, { revenue: 0, contracts: 0, bikes: 0 });
    
    // Statistiche del mese
    const monthStats = await getStatsForPeriod(locationId, monthAgo, today);
    const monthTotals = monthStats.reduce((acc, day) => {
      acc.revenue += day.revenue.total;
      acc.contracts += day.contracts.completed;
      acc.bikes += day.rentals.bikes;
      return acc;
    }, { revenue: 0, contracts: 0, bikes: 0 });
    
    res.json({
      today: todayStats || {
        revenue: { total: 0 },
        contracts: { completed: 0 },
        rentals: { bikes: 0 }
      },
      week: weekTotals,
      month: monthTotals,
      trends: {
        dailyRevenue: weekStats.map(day => ({
          date: day.date,
          revenue: day.revenue.total
        })),
        paymentMethods: todayStats ? {
          cash: todayStats.revenue.cash,
          card: todayStats.revenue.card,
          bank: todayStats.revenue.bank,
          paypal: todayStats.revenue.paypal,
          other: todayStats.revenue.other
        } : { cash: 0, card: 0, bank: 0, paypal: 0, other: 0 }
      }
    });
  } catch (error) {
    console.error('Errore statistiche dashboard:', error);
    res.status(500).json({ error: error.message });
  }
};