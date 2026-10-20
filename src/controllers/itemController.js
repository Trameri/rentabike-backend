import Bike from '../models/Bike.js';
import Accessory from '../models/Accessory.js';
import Contract from '../models/Contract.js';

const itemFields = 'name barcode photoUrl priceHourly priceDaily status';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function locationFilter(user) {
  return user.role === 'superadmin' ? {} : { location: user.locationId };
}

function formatMatches(rows, kind) {
  return rows.map(row => ({ ...row, kind }));
}

async function applyDynamicBikeStatus(bikes) {
  if (bikes.length === 0) return;

  const bikeIds = bikes.map(bike => bike._id);
  const now = new Date();
  const contracts = await Contract.find({
    status: { $in: ['in-use', 'reserved'] },
    startAt: { $lte: now },
    $or: [{ endAt: { $exists: false } }, { endAt: { $gte: now } }],
    'items.refId': { $in: bikeIds },
    'items.kind': 'bike'
  }).select('items').lean();

  const activeBikeIds = new Set();
  for (const contract of contracts) {
    for (const item of contract.items) {
      if (item.kind === 'bike' && !item.returnedAt) {
        activeBikeIds.add(item.refId.toString());
      }
    }
  }

  for (const bike of bikes) {
    if (bike.status === 'available' && activeBikeIds.has(bike._id.toString())) {
      bike.status = 'in-use';
    }
  }
}

export async function lookup(req, res) {
  const rawValue = req.query.value;
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!value || value.length > 100) {
    return res.status(400).json({ error: 'Inserisci un codice o un nome valido (massimo 100 caratteri)' });
  }

  const scope = locationFilter(req.user);
  const [bikesByBarcode, accessoriesByBarcode] = await Promise.all([
    Bike.find({ ...scope, barcode: value }).select(itemFields).limit(1).lean(),
    Accessory.find({ ...scope, barcode: value }).select(itemFields).limit(1).lean()
  ]);
  if (bikesByBarcode.length) {
    await applyDynamicBikeStatus(bikesByBarcode);
    return res.json({ matches: formatMatches(bikesByBarcode, 'bike'), matchType: 'barcode' });
  }
  if (accessoriesByBarcode.length) {
    return res.json({ matches: formatMatches(accessoriesByBarcode, 'accessory'), matchType: 'barcode' });
  }

  const namePattern = new RegExp(escapeRegex(value), 'i');
  const [bikesByName, accessoriesByName] = await Promise.all([
    Bike.find({ ...scope, name: namePattern }).select(itemFields).limit(2).lean(),
    Accessory.find({ ...scope, name: namePattern }).select(itemFields).limit(2).lean()
  ]);
  await applyDynamicBikeStatus(bikesByName);

  res.json({
    matches: [
      ...formatMatches(bikesByName, 'bike'),
      ...formatMatches(accessoriesByName, 'accessory')
    ],
    matchType: 'name'
  });
}
