import { customAlphabet } from 'nanoid'
import Bike from '../models/Bike.js';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export async function list(req,res){
  const { q, type, status, location } = req.query;
  const filter = {};
  
  // Superadmin può vedere tutto, altri utenti solo la loro location
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  } else if(location) {
    // Superadmin può filtrare per location specifica
    filter.location = location;
  }
  
  if(type) filter.type = type;
  if(status) filter.status = status;
  if(q) filter.$or = [{ name: new RegExp(q,'i') }, { barcode: new RegExp(q,'i') }];
  
  const rows = await Bike.find(filter).populate('location').sort({ createdAt: -1 });
  res.json(rows);
}
export async function create(req,res){
  try {
    console.log('=== CREATE BIKE REQUEST ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const { name, photoUrl, type, priceHourly, priceDaily, barcode, location, model, brand, frameNumber, purchaseDate, purchasePrice } = req.body;
    
    console.log('🔍 Extracted purchase data:', {
      model,
      brand,
      frameNumber,
      purchaseDate,
      purchasePrice,
      purchasePriceType: typeof purchasePrice
    });
    let bc = barcode?.trim() || nanoid();
    
    console.log('Initial barcode:', bc);
    
    // Determina la location: superadmin deve specificarla, altri usano la loro
    let bikeLocation;
    if (req.user.role === 'superadmin') {
      if (!location) {
        console.log('ERROR: Superadmin senza location');
        return res.status(400).json({ error: 'Superadmin deve specificare una location' });
      }
      bikeLocation = location;
    } else {
      bikeLocation = req.user.locationId;
    }
    
    console.log('Bike location:', bikeLocation);
    
    if (!bikeLocation) {
      console.log('ERROR: Location mancante');
      return res.status(400).json({ error: 'Location richiesta' });
    }
    
    // Controlla se il barcode esiste già
    let existingBike = await Bike.findOne({ barcode: bc });
    
    if (existingBike) {
      console.log('Barcode già esistente:', bc);
      
      // Se il barcode era specificato dall'utente, restituisci errore
      if (barcode?.trim()) {
        return res.status(400).json({ 
          error: `Barcode "${bc}" già esistente. Usa un barcode diverso o lascia vuoto per generazione automatica.` 
        });
      }
      
      // Se il barcode era auto-generato, genera un nuovo barcode unico
      let attempts = 0;
      const maxAttempts = 10;
      
      while (existingBike && attempts < maxAttempts) {
        bc = nanoid();
        existingBike = await Bike.findOne({ barcode: bc });
        attempts++;
        console.log(`Tentativo ${attempts}: nuovo barcode generato: ${bc}`);
      }
      
      if (existingBike) {
        console.log('ERROR: Impossibile generare barcode unico dopo', maxAttempts, 'tentativi');
        return res.status(500).json({ error: 'Impossibile generare un barcode unico. Riprova.' });
      }
    }
    
    // Processa i dati di acquisto
    const processedModel = model?.trim() || '';
    const processedBrand = brand?.trim() || '';
    const processedFrameNumber = frameNumber?.trim() || '';
    const processedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    const processedPurchasePrice = purchasePrice && purchasePrice !== '' && !isNaN(purchasePrice) ? Number(purchasePrice) : null;
    
    console.log('🔧 Processing purchase data:', {
      originalModel: model,
      processedModel,
      originalBrand: brand,
      processedBrand,
      originalFrameNumber: frameNumber,
      processedFrameNumber,
      originalPurchaseDate: purchaseDate,
      processedPurchaseDate,
      originalPurchasePrice: purchasePrice,
      processedPurchasePrice
    });

    const bikeData = { 
      name, 
      photoUrl, 
      type, 
      priceHourly, 
      priceDaily, 
      barcode: bc, 
      location: bikeLocation,
      model: processedModel,
      brand: processedBrand,
      frameNumber: processedFrameNumber,
      purchaseDate: processedPurchaseDate,
      purchasePrice: processedPurchasePrice
    };
    
    console.log('🚴 Creating bike with final data:', bikeData);
    
    const row = await Bike.create(bikeData);
    
    console.log('Bike created successfully:', row);
    res.json(row);
    
  } catch (error) {
    console.error('=== CREATE BIKE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    
    // Gestione specifica per errori di duplicato
    if (error.code === 11000 && error.keyPattern?.barcode) {
      return res.status(400).json({ 
        error: `Barcode duplicato rilevato. Il sistema ha tentato di prevenire questo errore ma è fallito. Riprova.` 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
}
export async function update(req,res){
  const { id } = req.params;
  const filter = { _id: id };
  
  // Non-superadmin possono modificare solo le loro bici
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Bike.findOneAndUpdate(filter, req.body, { new: true });
  if(!row) return res.status(404).json({ error: 'Bike not found' });
  res.json(row);
}

export async function remove(req,res){
  const { id } = req.params;
  const filter = { _id: id };
  
  // Non-superadmin possono eliminare solo le loro bici
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const result = await Bike.deleteOne(filter);
  if(result.deletedCount === 0) return res.status(404).json({ error: 'Bike not found' });
  res.json({ ok: true });
}

// Funzione per caricamento inventario in batch
export async function bulkCreate(req, res) {
  try {
    console.log('=== BULK CREATE BIKES REQUEST ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const { bikes } = req.body;
    
    if (!Array.isArray(bikes) || bikes.length === 0) {
      return res.status(400).json({ error: 'Array di bici richiesto' });
    }
    
    // Determina la location per tutte le bici
    let bikeLocation;
    if (req.user.role === 'superadmin') {
      // Per il superadmin, ogni bici può avere la sua location
      // Se non specificata, usa la prima location disponibile
      if (!bikes[0].location) {
        return res.status(400).json({ error: 'Superadmin deve specificare una location per ogni bici' });
      }
    } else {
      bikeLocation = req.user.locationId;
    }
    
    const results = {
      created: [],
      updated: [],
      errors: []
    };
    
    for (let i = 0; i < bikes.length; i++) {
      const bikeData = bikes[i];
      
      try {
        const { name, photoUrl, type, priceHourly, priceDaily, barcode } = bikeData;
        let bc = barcode?.trim();
        
        // Usa la location specifica della bici o quella dell'utente
        const finalLocation = req.user.role === 'superadmin' ? bikeData.location : bikeLocation;
        
        if (!finalLocation) {
          results.errors.push({
            index: i,
            bike: bikeData,
            error: 'Location richiesta'
          });
          continue;
        }
        
        // Se il barcode è specificato, controlla se esiste già
        if (bc) {
          const existingBike = await Bike.findOne({ barcode: bc });
          
          if (existingBike) {
            // Aggiorna la bici esistente invece di creare una nuova
            const updatedBike = await Bike.findOneAndUpdate(
              { barcode: bc },
              { 
                name: name || existingBike.name,
                photoUrl: photoUrl || existingBike.photoUrl,
                type: type || existingBike.type,
                priceHourly: priceHourly !== undefined ? priceHourly : existingBike.priceHourly,
                priceDaily: priceDaily !== undefined ? priceDaily : existingBike.priceDaily,
                location: finalLocation
              },
              { new: true }
            );
            
            results.updated.push(updatedBike);
            console.log(`Bici aggiornata: ${bc}`);
            continue;
          }
        } else {
          // Genera un barcode unico
          let attempts = 0;
          const maxAttempts = 10;
          
          do {
            bc = nanoid();
            const exists = await Bike.findOne({ barcode: bc });
            if (!exists) break;
            attempts++;
          } while (attempts < maxAttempts);
          
          if (attempts >= maxAttempts) {
            results.errors.push({
              index: i,
              bike: bikeData,
              error: 'Impossibile generare barcode unico'
            });
            continue;
          }
        }
        
        // Crea la nuova bici
        const newBikeData = {
          name,
          photoUrl,
          type,
          priceHourly,
          priceDaily,
          barcode: bc,
          location: finalLocation
        };
        
        const newBike = await Bike.create(newBikeData);
        results.created.push(newBike);
        console.log(`Bici creata: ${bc}`);
        
      } catch (error) {
        console.error(`Errore nella bici ${i}:`, error);
        results.errors.push({
          index: i,
          bike: bikeData,
          error: error.message
        });
      }
    }
    
    console.log('=== BULK CREATE RESULTS ===');
    console.log(`Create: ${results.created.length}`);
    console.log(`Aggiornate: ${results.updated.length}`);
    console.log(`Errori: ${results.errors.length}`);
    
    res.json({
      success: true,
      summary: {
        total: bikes.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length
      },
      results
    });
    
  } catch (error) {
    console.error('=== BULK CREATE ERROR ===');
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function byBarcode(req,res){
  const { code } = req.params;
  const filter = { barcode: code };
  
  // Non-superadmin possono cercare solo nelle loro bici
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Bike.findOne(filter).populate('location');
  if(!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
}
