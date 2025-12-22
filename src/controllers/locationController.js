import Location from '../models/Location.js';
export async function list(req,res){
  const rows = await Location.find().sort({ name: 1 });
  res.json(rows);
}
