import { customAlphabet } from 'nanoid'
import Accessory from '../models/Accessory.js';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export async function list(req,res){
  const { q, status, location } = req.query;
  const filter = {};
  
  // Superadmin può vedere tutto, altri utenti solo la loro location
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  } else if(location) {
    // Superadmin può filtrare per location specifica
    filter.location = location;
  }
  
  if(status) filter.status = status;
  if(q) filter.$or = [{ name: new RegExp(q,'i') }, { barcode: new RegExp(q,'i') }];
  
  const rows = await Accessory.find(filter).populate('location').sort({ createdAt: -1 });
  res.json(rows);
}

export async function create(req,res){
  const { name, photoUrl, priceHourly, priceDaily, barcode, location } = req.body;
  const bc = barcode?.trim() || nanoid();
  
  // Determina la location: superadmin può specificarla, altri usano la loro
  const accessoryLocation = req.user.role === 'superadmin' && location ? location : req.user.locationId;
  
  const row = await Accessory.create({ 
    name, photoUrl, priceHourly, priceDaily, barcode: bc, location: accessoryLocation 
  });
  res.json(row);
}

export async function update(req,res){
  const { id } = req.params;
  const filter = { _id: id };
  
  // Non-superadmin possono modificare solo i loro accessori
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Accessory.findOneAndUpdate(filter, req.body, { new: true });
  if(!row) return res.status(404).json({ error: 'Accessory not found' });
  res.json(row);
}

export async function remove(req,res){
  const { id } = req.params;
  const filter = { _id: id };
  
  // Non-superadmin possono eliminare solo i loro accessori
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const result = await Accessory.deleteOne(filter);
  if(result.deletedCount === 0) return res.status(404).json({ error: 'Accessory not found' });
  res.json({ ok: true });
}

export async function byBarcode(req,res){
  const { code } = req.params;
  const filter = { barcode: code };
  
  // Non-superadmin possono cercare solo nei loro accessori
  if(req.user.role !== 'superadmin') {
    filter.location = req.user.locationId;
  }
  
  const row = await Accessory.findOne(filter).populate('location');
  if(!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
}
