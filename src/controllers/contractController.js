import Bike from '../models/Bike.js';
import Accessory from '../models/Accessory.js';
import Contract from '../models/Contract.js';
import { computeItemPrice } from '../utils/pricing.js';
import { updateDailyStats } from '../utils/statsHelper.js';

// Helper function per ottenere username con fallback
function getUsername(user) {
  return user.username || `user_${user.uid}` || 'unknown';
}

// Funzione per calcolare il prezzo finale basato sul tempo effettivo
function calculateFinalPrice(contract) {
  if (!contract.startAt || !contract.endAt) {
    return 0;
  }

  let totalPrice = 0;

  for (const item of contract.items) {
    const start = contract.startAt;
    const end = item.returnedAt || contract.endAt;
    const { total } = computeItemPrice(start, end, item.priceHourly, item.priceDaily);
    totalPrice += total;
  }
return Math.round(totalPrice * 100) / 100;
}

export async function create(req,res){
   const { customer, items, notes, status, paymentMethod, reservationPrepaid, location, startAt, endAt, reservationDate } = req.body;

   console.log('=== CREATE CONTRACT DEBUG ===');
   console.log('Body received:', JSON.stringify(req.body, null, 2));
   console.log('startAt value:', startAt);
   console.log('status:', status);
   console.log('isReservation will be:', status === 'reserved');
   
   // Determina la location: superadmin può specificarla, altri usano la loro
   const contractLocation = req.user.role === 'superadmin' && location ? location : req.user.locationId;

   // Parse delle date per validazione sovrapposizioni
   const reqStartAt = startAt ? new Date(startAt) : (reservationDate ? new Date(reservationDate) : new Date());
   const reqEndAt = endAt ? new Date(endAt) : null;

   // Validazione sovrapposizioni per bici
   for (const it of items) {
     if (it.kind === 'bike') {
       const bikeFilter = { _id: it.id };
       if (req.user.role !== 'superadmin') {
         bikeFilter.location = req.user.locationId;
       } else {
         bikeFilter.location = contractLocation;
       }
       
       const bike = await Bike.findOne(bikeFilter);
       if (!bike) return res.status(400).json({ error: 'Bike not found in this location' });

        // Verifica sovrapposizioni con contratti esistenti (in-use o reserved)
        const conflictingContracts = await Contract.find({
          status: { $in: ['in-use', 'reserved'] },
          location: contractLocation,
          'items.refId': it.id,
          'items.kind': 'bike'
        }).select('items startAt endAt status');

        for (const existingContract of conflictingContracts) {
          const existingStart = new Date(existingContract.startAt);
          const existingEnd = existingContract.endAt ? new Date(existingContract.endAt) : null;

          if (existingContract.status === 'reserved' && existingEnd === null && existingStart > reqStartAt) {
            continue;
          }

          if (existingContract.status === 'reserved' && existingEnd !== null && reqEndAt === null && existingStart > reqStartAt) {
            continue;
          }

          const newEndEffective = reqEndAt ? new Date(reqEndAt) : new Date(8640000000000000);
          const existingEndEffective = existingEnd ? existingEnd : new Date(8640000000000000);

          const overlap = Math.max(reqStartAt.getTime(), existingStart.getTime()) <=
                          Math.min(newEndEffective.getTime(), existingEndEffective.getTime());

          const hasActiveItem = existingContract.items.some(item =>
            item.refId.toString() === it.id && !item.returnedAt
          );

          if (overlap && hasActiveItem) {
            return res.status(400).json({
              error: `La bici "${bike.name}" (barcode: ${bike.barcode}) è già noleggiata o prenotata per il periodo richiesto`
            });
          }
        }
     }
   }

   const populated = [];
   for(const it of items){
     if(it.kind === 'bike'){
       const bikeFilter = { _id: it.id };
       // Verifica che la bici appartenga alla location corretta
       if(req.user.role !== 'superadmin') {
         bikeFilter.location = req.user.locationId;
       } else {
         bikeFilter.location = contractLocation;
       }
       
       const b = await Bike.findOne(bikeFilter);
       if(!b) return res.status(400).json({ error: 'Bike not found in this location' });
populated.push({ 
          kind:'bike', 
          refId:b._id, 
          kindRef:'Bike', 
          name:b.name, 
          barcode:b.barcode, 
          photoUrl:b.photoUrl, 
          priceHourly: it.priceHourly || b.priceHourly, // Usa prezzo modificato se presente
          priceDaily: it.priceDaily || b.priceDaily,   // Usa prezzo modificato se presente
          originalPriceHourly: b.priceHourly,          // Salva sempre prezzo originale
          originalPriceDaily: b.priceDaily,            // Salva sempre prezzo originale
          insurance: !!it.insurance, 
          insuranceFlat: it.insuranceFlat||0,
          insurancePaidInAdvance: !!it.insurancePaidInAdvance
        });
       await Bike.updateOne({ _id: b._id }, { status: status==='reserved' ? 'reserved' : 'in-use' });
     } else {
       const accessoryFilter = { _id: it.id };
       // Verifica che l'accessorio appartenga alla location corretta
       if(req.user.role !== 'superadmin') {
         accessoryFilter.location = req.user.locationId;
       } else {
         accessoryFilter.location = contractLocation;
       }
       
       const a = await Accessory.findOne(accessoryFilter);
       if(!a) return res.status(400).json({ error: 'Accessory not found in this location' });
populated.push({ 
          kind:'accessory', 
          refId:a._id, 
          kindRef:'Accessory', 
          name:a.name, 
          barcode:a.barcode, 
          photoUrl:a.photoUrl, 
          priceHourly: it.priceHourly || a.priceHourly, // Usa prezzo modificato se presente
          priceDaily: it.priceDaily || a.priceDaily,   // Usa prezzo modificato se presente
          originalPriceHourly: a.priceHourly,          // Salva sempre prezzo originale
          originalPriceDaily: a.priceDaily,            // Salva sempre prezzo originale
          insurance: !!it.insurance, 
          insuranceFlat: it.insuranceFlat||0,
          insurancePaidInAdvance: !!it.insurancePaidInAdvance
        });
       await Accessory.updateOne({ _id: a._id }, { status: status==='reserved' ? 'reserved' : 'in-use' });
     }
   }
  
  // Calcola i totali iniziali
  let subtotal = 0;
  let insurance = 0;
  
  for(const item of populated) {
    // Per ora usa il prezzo orario come base (verrà ricalcolato alla chiusura)
    subtotal += item.priceHourly || 0;
    if(item.insurance) {
      insurance += item.insuranceFlat || 0;
    }
  }
  
  const totals = {
    subtotal,
    insurance,
    grandTotal: subtotal // Assicurazione esclusa dal grandTotal su richiesta
  };
  
  // Ottieni username con fallback
  const username = getUsername(req.user);

  // Debug: verifica la data di prenotazione
  console.log('=== DATE DEBUG ===');
  console.log('startAt raw:', startAt);
  console.log('startAt typeof:', typeof startAt);
  const parsedStartAt = startAt ? new Date(startAt) : null;
  console.log('startAt parsed:', parsedStartAt);
  console.log('startAt parsed valid:', parsedStartAt ? !isNaN(parsedStartAt.getTime()) : false);
  console.log('startAt parsed ISO:', parsedStartAt ? parsedStartAt.toISOString() : null);
  console.log('reservationDate:', reservationDate);

  const createData = {
    customer, items: populated, notes, status: status || 'in-use',
    location: contractLocation, paymentMethod: paymentMethod||null, paid: reservationPrepaid||false,
    reservationPrepaid: !!reservationPrepaid,
    isReservation: status === 'reserved',
    totals,
    createdBy: username,
    modificationHistory: [{
      action: 'created',
      performedBy: username,
      details: { itemsCount: populated.length, status: status || 'in-use', totals }
    }]
  };

  if (status === 'reserved') {
    createData.startAt = parsedStartAt && !isNaN(parsedStartAt.getTime()) ? parsedStartAt : (reservationDate ? new Date(reservationDate) : new Date());
    createData.endAt = endAt ? new Date(endAt) : undefined;
    createData.reservationDate = reservationDate;
  }

  const row = await Contract.create(createData);
  console.log('Saved contract startAt:', row.startAt);
  console.log('Saved contract startAt ISO:', row.startAt ? row.startAt.toISOString() : null);
  res.json(row);
}

export async function list(req,res){
  const { status, q, location } = req.query;
  const filter = {};
  
  // Superadmin può vedere tutto, altri utenti solo la loro location
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  } else if(location) {
    // Superadmin può filtrare per location specifica
    filter.location = location;
  }
  
  if(status) filter.status = status;
  if(q) filter.$or = [
    { 'customer.name': new RegExp(q,'i') },
    { 'items.name': new RegExp(q,'i') },
    { 'items.barcode': new RegExp(q,'i') }
  ];
  
  const rows = await Contract.find(filter)
    .populate('location')
    .populate({
      path: 'items.refId',
      select: 'name barcode photoUrl'
    })
    .sort({ createdAt: -1 })
    .limit(200);
  
  // Popola i dati mancanti degli item (come photoUrl) per contratti vecchi
  for (const contract of rows) {
    for (const item of contract.items) {
      if (!item.photoUrl && item.refId) {
        try {
          if (item.kind === 'bike') {
            const bike = await Bike.findById(item.refId);
            if (bike && bike.photoUrl) {
              item.photoUrl = bike.photoUrl;
            }
          } else if (item.kind === 'accessory') {
            const accessory = await Accessory.findById(item.refId);
            if (accessory && accessory.photoUrl) {
              item.photoUrl = accessory.photoUrl;
            }
          }
        } catch (error) {
          console.log(`Errore popolamento dati item ${item.refId}:`, error.message);
        }
      }
    }
  }
  
  res.json(rows);
}

export async function byId(req,res){
  const filter = { _id: req.params.id };
  
  // Non-superadmin possono vedere solo i loro contratti
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Contract.findOne(filter).populate('location');
  if(!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
}

export async function close(req,res){
  const { id } = req.params;
  const { endAt = new Date(), paymentMethod, isPaid, finalPrice, closureNotes, contractInsurancePaidAdvance } = req.body;
  
  const filter = { _id: id };
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Contract.findOne(filter);
  if(!row) return res.status(404).json({ error: 'Not found' });

let subtotal = 0, insurance = 0;
      
  for(const it of row.items){
    const lockedPrice = row.lockedItemPrices?.find(lp => 
      lp.itemId.toString() === it._id.toString()
    );

    if (lockedPrice) {
      subtotal += lockedPrice.basePrice + (lockedPrice.insurance || 0);
      insurance += lockedPrice.insurance || 0;
    } else {
      const end = it.returnedAt || endAt;
      const { total } = computeItemPrice(row.startAt, end, it.priceHourly, it.priceDaily);
      subtotal += total;
    }

    if(it.insurance && !it.insurancePaidInAdvance) insurance += it.insuranceFlat;

    if(it.kind === 'bike'){
      await Bike.updateOne({ _id: it.refId }, { status: 'available' });
    } else {
      await Accessory.updateOne({ _id: it.refId }, { status: 'available' });
    }

    if (!it.returnedAt) {
      it.returnedAt = endAt;
    }
  }
  
  row.endAt = endAt;
  row.status = 'completed';
  row.paymentMethod = paymentMethod || row.paymentMethod;
  row.paid = !!isPaid;
  row.paymentCompleted = !!isPaid;
  row.finalPrice = finalPrice !== undefined ? finalPrice : Math.round(subtotal * 100) / 100;
  row.finalAmount = finalPrice !== undefined ? finalPrice : Math.round(subtotal * 100) / 100;
  if (contractInsurancePaidAdvance !== undefined) {
    row.contractInsurancePaidAdvance = !!contractInsurancePaidAdvance;
  }
  
  let insurancePaidAmount = 0;
  for (const it of row.items) {
    if (it.insurancePaidInAdvance) {
      insurancePaidAmount += it.insuranceFlat || 0;
    }
  }
  if (row.contractInsurancePaidAdvance && row.totals && row.totals.insurance) {
    insurancePaidAmount += row.totals.insurance;
  }
  
  for (const lp of (row.lockedItemPrices || [])) {
    insurancePaidAmount += lp.insurance || 0;
  }
  
  row.totalWithInsurance = (finalPrice !== undefined ? finalPrice : Math.round(subtotal * 100) / 100) + insurancePaidAmount;
  row.closureNotes = closureNotes || '';
  row.totals = { subtotal, insurance, grandTotal: subtotal };
  
  await row.save();
  res.json(row);
}

export async function activeByBarcode(req,res){
  const { code } = req.params;
  const filter = {
    status: { $in: ['in-use','reserved'] },
    'items.barcode': code
  };
  
  // Non-superadmin possono cercare solo nei loro contratti
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Contract.findOne(filter).populate('location').sort({ createdAt: -1 });
  if(!row) return res.status(404).json({ error: 'No active contract for this item' });
  res.json(row);
}

export async function history(req, res) {
  const { customer, barcode, dateFrom, dateTo, status, location } = req.query;
  
  const filter = {};
  
  // Non-superadmin possono vedere solo i loro contratti
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  } else if (location) {
    filter.location = location;
  }
  
  // Filtro per nome cliente (case insensitive)
  if (customer) {
    filter['customer.name'] = { $regex: customer, $options: 'i' };
  }
  
  // Filtro per barcode negli items
  if (barcode) {
    filter['items.barcode'] = { $regex: barcode, $options: 'i' };
  }
  
  // Filtro per range di date
  if (dateFrom || dateTo) {
    filter.startAt = {};
    if (dateFrom) filter.startAt.$gte = new Date(dateFrom);
    if (dateTo) filter.startAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
  }
  
  // Filtro per stato
  if (status) {
    filter.status = status;
  }
  
  const contracts = await Contract.find(filter)
    .populate('location')
    .sort({ createdAt: -1 })
    .limit(100); // Limitiamo a 100 risultati per performance
  
  res.json(contracts);
}

export async function byDay(req, res) {
  const { date } = req.params;
  const filter = {};

  if (req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }

  if (!date) {
    return res.status(400).json({ error: 'Data richiesta (YYYY-MM-DD)' });
  }

  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  filter.startAt = {
    $gte: startOfDay,
    $lte: endOfDay
  };

  const contracts = await Contract.find(filter)
    .populate('location')
    .populate({
      path: 'items.refId',
      select: 'name barcode photoUrl'
    })
    .sort({ startAt: 1 });

  res.json(contracts);
}

export const swapBike = async (req, res) => {
  try {
    const { contractId, oldBikeId, newBikeId, reason } = req.body;

    // Trova il contratto
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    if (contract.status !== 'in-use' && contract.status !== 'reserved') {
      return res.status(400).json({ error: 'Il contratto deve essere attivo o prenotato per permettere sostituzioni' });
    }

    // Verifica che la vecchia bici sia nel contratto
    const oldBikeIndex = contract.items.findIndex(item => 
      item.kind === 'bike' && item.refId.toString() === oldBikeId
    );
    
    if (oldBikeIndex === -1) {
      return res.status(400).json({ error: 'Bici da sostituire non trovata nel contratto' });
    }

    // Verifica che la nuova bici sia disponibile
    const newBike = await Bike.findById(newBikeId);
    if (!newBike) {
      return res.status(404).json({ error: 'Nuova bici non trovata' });
    }

    if (newBike.status !== 'available') {
      return res.status(400).json({ error: 'La nuova bici non è disponibile' });
    }

    // Trova la vecchia bici
    const oldBike = await Bike.findById(oldBikeId);
    if (!oldBike) {
      return res.status(404).json({ error: 'Vecchia bici non trovata' });
    }

    // Esegui lo scambio
    // 1. Aggiorna lo stato delle bici
    oldBike.status = 'available';
    newBike.status = contract.status === 'reserved' ? 'reserved' : 'in-use';
    
    await oldBike.save();
    await newBike.save();

    // 2. Aggiorna il contratto
    contract.items[oldBikeIndex].refId = newBikeId;
    contract.items[oldBikeIndex].name = newBike.name;
    contract.items[oldBikeIndex].barcode = newBike.barcode;
    contract.items[oldBikeIndex].photoUrl = newBike.photoUrl;
    contract.items[oldBikeIndex].priceHourly = newBike.priceHourly;
    contract.items[oldBikeIndex].priceDaily = newBike.priceDaily;
    
    // 3. Aggiungi log dello scambio
    if (!contract.swapHistory) {
      contract.swapHistory = [];
    }
    
    contract.swapHistory.push({
      date: new Date(),
      oldBike: {
        id: oldBikeId,
        name: oldBike.name,
        barcode: oldBike.barcode
      },
      newBike: {
        id: newBikeId,
        name: newBike.name,
        barcode: newBike.barcode
      },
      reason,
      performedBy: getUsername(req.user)
    });

    // Aggiungi al log delle modifiche
    contract.modificationHistory.push({
      action: 'item_swapped',
      performedBy: getUsername(req.user),
      details: {
        oldBike: { id: oldBikeId, name: oldBike.name, barcode: oldBike.barcode },
        newBike: { id: newBikeId, name: newBike.name, barcode: newBike.barcode },
        reason
      }
    });

    contract.lastModifiedBy = getUsername(req.user);

    await contract.save();

    res.json({
      message: 'Sostituzione completata con successo',
      contract: contract
    });

  } catch (error) {
    console.error('Errore swap bici:', error);
    res.status(500).json({ error: error.message });
  }
};

// Funzione per modificare i prezzi degli item in un contratto attivo
export const updateItemPrices = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { itemId, priceHourly, priceDaily, reason } = req.body;

    console.log('=== UPDATE ITEM PRICES REQUEST ===');
    console.log('Contract ID:', contractId);
    console.log('Item ID:', itemId);
    console.log('New prices:', { priceHourly, priceDaily });
    console.log('Reason:', reason);
    console.log('User:', req.user);

    // Validazione input
    if (!itemId) {
      return res.status(400).json({ error: 'ID item richiesto' });
    }

    if (priceHourly === undefined && priceDaily === undefined) {
      return res.status(400).json({ error: 'Almeno un prezzo deve essere specificato' });
    }

    if (priceHourly !== undefined && (isNaN(priceHourly) || priceHourly < 0)) {
      return res.status(400).json({ error: 'Prezzo orario non valido' });
    }

    if (priceDaily !== undefined && (isNaN(priceDaily) || priceDaily < 0)) {
      return res.status(400).json({ error: 'Prezzo giornaliero non valido' });
    }

    // Trova il contratto
    const filter = { _id: contractId };
    
    // Non-superadmin possono modificare solo i loro contratti
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }

    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    // Verifica che il contratto sia attivo
    if (!['in-use', 'reserved'].includes(contract.status)) {
      return res.status(400).json({ 
        error: 'I prezzi possono essere modificati solo per contratti attivi o prenotati' 
      });
    }

    // Trova l'item nel contratto (cerca sia per _id che per refId per compatibilità)
    const itemIndex = contract.items.findIndex(item => 
      item._id.toString() === itemId || item.refId.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item non trovato nel contratto' });
    }

    const item = contract.items[itemIndex];
    
    // Salva i valori precedenti per il log
    const oldValues = {
      priceHourly: item.priceHourly,
      priceDaily: item.priceDaily
    };

    // Aggiorna i prezzi
    const newValues = {};
    if (priceHourly !== undefined) {
      item.priceHourly = priceHourly;
      newValues.priceHourly = priceHourly;
    }
    if (priceDaily !== undefined) {
      item.priceDaily = priceDaily;
      newValues.priceDaily = priceDaily;
    }

    // Aggiungi al log delle modifiche
    contract.modificationHistory.push({
      action: 'price_updated',
      performedBy: getUsername(req.user),
      details: {
        itemId: itemId,
        itemName: item.name,
        itemBarcode: item.barcode,
        itemKind: item.kind,
        reason: reason || 'Modifica prezzo durante contratto'
      },
      oldValues,
      newValues
    });

    contract.lastModifiedBy = getUsername(req.user);

    await contract.save();

    console.log('Prezzi aggiornati con successo:', {
      contractId,
      itemId,
      oldValues,
      newValues
    });

    res.json({
      message: 'Prezzi aggiornati con successo',
      contract: contract,
      updatedItem: {
        id: itemId,
        name: item.name,
        barcode: item.barcode,
        kind: item.kind,
        oldPrices: oldValues,
        newPrices: newValues
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento prezzi:', error);
    res.status(500).json({ error: error.message });
  }
};

// Funzione per ottenere la cronologia delle modifiche di un contratto
export const getModificationHistory = async (req, res) => {
  try {
    const { contractId } = req.params;

    const filter = { _id: contractId };
    
    // Non-superadmin possono vedere solo i loro contratti
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }

    const contract = await Contract.findOne(filter).populate('location');
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    res.json({
      contractId: contractId,
      customer: contract.customer,
      status: contract.status,
      location: contract.location,
      modificationHistory: contract.modificationHistory.sort((a, b) => new Date(b.date) - new Date(a.date)),
      swapHistory: contract.swapHistory || []
    });

  } catch (error) {
    console.error('Errore recupero cronologia:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Motivo dell'eliminazione dal frontend
    
    const filter = { _id: id };
    // Tutti gli admin possono eliminare contratti
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }
    
    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Se il contratto è attivo, libera le bici/accessori
    if (contract.status === 'in-use' || contract.status === 'reserved') {
      for (const item of contract.items) {
        if (item.kind === 'bike') {
          await Bike.updateOne({ _id: item.refId }, { status: 'available' });
        } else {
          await Accessory.updateOne({ _id: item.refId }, { status: 'available' });
        }
      }
    }
    
    // Aggiungi al log delle modifiche prima di eliminare
    contract.modificationHistory.push({
      action: 'deleted',
      performedBy: getUsername(req.user),
      details: { 
        contractId: id,
        customerName: contract.customer.name,
        itemsCount: contract.items.length,
        status: contract.status,
        reason: reason || 'Nessun motivo specificato', // Includi il motivo
        deletedAt: new Date().toISOString()
      }
    });
    
    await contract.save();
    
    // Log per tracciabilità
    console.log(`🗑️ Contratto ${id} eliminato da ${getUsername(req.user)} - Motivo: ${reason || 'Non specificato'}`);
    
    // Elimina il contratto
    await Contract.deleteOne({ _id: id });
    
    res.json({ 
      message: 'Contratto eliminato con successo',
      deletedContract: {
        id: contract._id,
        customer: contract.customer.name,
        reason: reason || 'Non specificato'
      }
    });
    
  } catch (error) {
    console.error('Errore eliminazione contratto:', error);
    res.status(500).json({ error: error.message });
  }
};

export const returnItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, returnedAt, notes } = req.body;
    
    const filter = { _id: id };
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }
    
    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    const itemIndex = contract.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item non trovato nel contratto' });
    }
    
    const item = contract.items[itemIndex];
    
    if (item.returnedAt) {
      return res.status(400).json({ error: 'Item già restituito' });
    }
    
    const returnTime = returnedAt || new Date();
    contract.items[itemIndex].returnedAt = returnTime;
    contract.items[itemIndex].returnNotes = notes || '';
    
    if (item.kind === 'bike') {
      await Bike.updateOne({ _id: item.refId }, { status: 'available' });
    } else {
      await Accessory.updateOne({ _id: item.refId }, { status: 'available' });
    }
    
    const allReturned = contract.items.every(it => it.returnedAt);
    
    if (allReturned && contract.status === 'in-use') {
      contract.status = 'returned';
      contract.endAt = returnTime;
    }
    
    await contract.save();
    
    res.json({
      message: 'Item restituito con successo',
      contract: contract,
      allItemsReturned: allReturned
    });
    
  } catch (error) {
    console.error('Errore rientro item:', error);
    res.status(500).json({ error: error.message });
  }
};

// Funzione per completare il pagamento di un contratto restituito
export async function completePayment(req, res) {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentNotes, finalAmount, itemInsurancePaidAdvance, contractInsurancePaidAdvance } = req.body;
    
    // Trova il contratto
    const filter = { _id: id };
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }
    
    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Verifica che il contratto sia in stato "returned"
    if (contract.status !== 'returned') {
      return res.status(400).json({ error: 'Il contratto deve essere in stato "restituito" per completare il pagamento' });
    }
    
    // Aggiorna i dati di pagamento
    contract.paymentMethod = paymentMethod;
    contract.paymentCompleted = true;
    contract.paymentDate = new Date();
    contract.paymentNotes = paymentNotes || '';
    contract.status = 'completed';
    
    // Se specificato un importo finale, aggiornalo
    if (finalAmount !== undefined) {
      contract.finalAmount = finalAmount;
    } else if (contract.lockedItemPrices && contract.lockedItemPrices.length > 0) {
      let subtotal = 0;
      for (const lp of contract.lockedItemPrices) {
        subtotal += lp.basePrice + (lp.insurance || 0);
      }
      contract.finalAmount = Math.round(subtotal * 100) / 100;
    } else {
      let subtotal = 0;
      for (const item of contract.items) {
        const end = item.returnedAt || contract.endAt;
        const { total } = computeItemPrice(contract.startAt, end, item.priceHourly, item.priceDaily);
        subtotal += total;
      }
      contract.finalAmount = Math.round(subtotal * 100) / 100;
    }
    
    // Aggiorna insurancePaidInAdvance sugli item se specificato
    if (itemInsurancePaidAdvance) {
      for (const item of contract.items) {
        const itemId = item._id ? item._id.toString() : item.refId.toString();
        if (itemInsurancePaidAdvance[itemId] !== undefined) {
          item.insurancePaidInAdvance = !!itemInsurancePaidAdvance[itemId];
        }
      }
    }
    
    // Aggiorna contractInsurancePaidAdvance se specificato
    if (contractInsurancePaidAdvance !== undefined) {
      contract.contractInsurancePaidAdvance = !!contractInsurancePaidAdvance;
    }
    
    let insurancePaidAmount = 0;
    for (const lp of (contract.lockedItemPrices || [])) {
      insurancePaidAmount += lp.insurance || 0;
    }
    for (const item of contract.items) {
      if (item.insurancePaidInAdvance && !contract.lockedItemPrices?.some(
        lp => lp.itemId.toString() === (item._id ? item._id.toString() : item.refId.toString())
      )) {
        insurancePaidAmount += item.insuranceFlat || 0;
      }
    }
    if (contract.contractInsurancePaidAdvance && contract.totals && contract.totals.insurance) {
      insurancePaidAmount += contract.totals.insurance;
    }
    contract.totalWithInsurance = contract.finalAmount + insurancePaidAmount;
    
    // Aggiungi alla cronologia delle modifiche
    contract.modificationHistory.push({
      action: 'payment_completed',
      performedBy: req.user.username,
      details: {
        paymentMethod,
        amount: finalAmount || contract.totals.grandTotal,
        totalWithInsurance: contract.totalWithInsurance,
        notes: paymentNotes
      },
      oldValues: { 
        status: 'returned', 
        paymentCompleted: false 
      },
      newValues: { 
        status: 'completed', 
        paymentCompleted: true,
        paymentMethod,
        paymentDate: new Date(),
        totalWithInsurance: contract.totalWithInsurance
      }
    });
    
    await contract.save();
    
    // Aggiorna statistiche giornaliere
    try {
      const bikeCount = contract.items.filter(item => item.kind === 'bike').length;
      const accessoryCount = contract.items.filter(item => item.kind === 'accessory').length;
      
      // Calcola ore di noleggio
      const startTime = new Date(contract.startAt);
      const endTime = new Date(contract.endAt);
      const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
      
      // Usa totalWithInsurance per le statistiche (include assicurazione)
      await updateDailyStats(contract.location, {
        contractCompleted: true,
        payment: {
          amount: contract.totalWithInsurance,
          method: paymentMethod,
          contractId: contract._id,
          notes: paymentNotes
        },
        rental: {
          bikes: bikeCount,
          accessories: accessoryCount,
          hours: hours
        }
      });
    } catch (statsError) {
      console.error('Errore aggiornamento statistiche:', statsError);
      // Non bloccare la risposta se le statistiche falliscono
    }
    
    res.json({
      message: 'Pagamento completato con successo',
      contract: contract
    });
    
  } catch (error) {
    console.error('Errore completamento pagamento:', error);
    res.status(500).json({ error: error.message });
  }
}

// Nuove funzioni per admin

export const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Tutti gli admin possono modificare contratti
    const filter = { _id: id };
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }
    
    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Salva i valori precedenti per lo storico
    const oldValues = {
      customer: contract.customer,
      notes: contract.notes,
      status: contract.status,
      paymentMethod: contract.paymentMethod
    };
    
    // Controlla se il contratto sta passando da 'reserved' a 'in-use'
    if (contract.status === 'reserved' && updates.status === 'in-use') {
      updates.wasReserved = true;
      updates.actualStartAt = new Date();
      
      // Aggiorna lo stato degli item da 'reserved' a 'in-use'
      for (const item of contract.items) {
        if (!item.returnedAt) {
          if (item.kind === 'bike') {
            await Bike.updateOne({ _id: item.refId }, { status: 'in-use' });
          } else {
            await Accessory.updateOne({ _id: item.refId }, { status: 'in-use' });
          }
        }
      }
    }
    
    // Applica le modifiche
    Object.keys(updates).forEach(key => {
      if (key !== 'modificationHistory' && key !== 'createdBy') {
        contract[key] = updates[key];
      }
    });
    
    // Aggiungi al log delle modifiche
    contract.modificationHistory.push({
      action: 'modified',
      performedBy: getUsername(req.user),
      details: { fieldsModified: Object.keys(updates) },
      oldValues,
      newValues: updates
    });
    
    contract.lastModifiedBy = getUsername(req.user);
    
    await contract.save();
    
    res.json({
      message: 'Contratto modificato con successo',
      contract
    });
    
  } catch (error) {
    console.error('Errore modifica contratto:', error);
    res.status(500).json({ error: error.message });
  }
};

export const cancelContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Tutti gli admin possono annullare contratti
    const filter = { _id: id };
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }
    
    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    if (contract.status === 'cancelled') {
      return res.status(400).json({ error: 'Contratto già annullato' });
    }
    
    // Libera tutti gli item
    for (const item of contract.items) {
      if (!item.returnedAt) {
        if (item.kind === 'bike') {
          await Bike.updateOne({ _id: item.refId }, { status: 'available' });
        } else {
          await Accessory.updateOne({ _id: item.refId }, { status: 'available' });
        }
        item.returnedAt = new Date();
        item.returnNotes = 'Restituito per annullamento contratto';
      }
    }
    
    // Aggiorna stato contratto
    contract.status = 'cancelled';
    contract.endAt = new Date();
    contract.closureNotes = reason || 'Contratto annullato';
    
    // Aggiungi al log delle modifiche
    contract.modificationHistory.push({
      action: 'cancelled',
      performedBy: getUsername(req.user),
      details: { reason: reason || 'Nessun motivo specificato' }
    });
    
    contract.lastModifiedBy = getUsername(req.user);
    
    await contract.save();
    
    res.json({
      message: 'Contratto annullato con successo',
      contract
    });
    
  } catch (error) {
    console.error('Errore annullamento contratto:', error);
    res.status(500).json({ error: error.message });
  }
};



export const getSwapHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const filter = {};
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }
    
    // Trova tutti i contratti con sostituzioni
    const contracts = await Contract.find({
      ...filter,
      'swapHistory.0': { $exists: true }
    })
    .populate('swapHistory.oldBike', 'name barcode')
    .populate('swapHistory.newBike', 'name barcode')
    .select('swapHistory customer _id')
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit));
    
    // Estrai tutte le sostituzioni e ordinale per data
    const allSwaps = [];
    contracts.forEach(contract => {
      contract.swapHistory.forEach(swap => {
        allSwaps.push({
          ...swap.toObject(),
          contract: {
            _id: contract._id,
            customer: contract.customer
          }
        });
      });
    });
    
    // Ordina per data più recente
    allSwaps.sort((a, b) => new Date(b.swapDate) - new Date(a.swapDate));
    
    res.json(allSwaps.slice(0, parseInt(limit)));
    
  } catch (error) {
    console.error('Errore recupero storico sostituzioni:', error);
    res.status(500).json({ error: error.message });
  }
};

export const lockPrices = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { lockedItemPrices } = req.body;

    const filter = { _id: contractId };
    if (req.user.role !== 'superadmin') {
      filter.location = req.user.locationId;
    }

    const contract = await Contract.findOne(filter);
    if (!contract) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    contract.lockedItemPrices = lockedItemPrices || [];
    contract.lastModifiedBy = getUsername(req.user);

    let subtotal = 0;
    let insurancePaidAmount = 0;
    for (const lp of (contract.lockedItemPrices || [])) {
      subtotal += lp.basePrice + (lp.insurance || 0);
      insurancePaidAmount += lp.insurance || 0;
    }
    contract.finalAmount = Math.round(subtotal * 100) / 100;
    contract.totalWithInsurance = contract.finalAmount + insurancePaidAmount;

    await contract.save();

    res.json({
      message: 'Prezzi bloccati salvati con successo',
      contract
    });
  } catch (error) {
    console.error('Errore salvataggio prezzi bloccati:', error);
    res.status(500).json({ error: error.message });
  }
};
