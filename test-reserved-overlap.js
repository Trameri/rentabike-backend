import mongoose from 'mongoose';
import 'dotenv/config';
import Bike from './src/models/Bike.js';
import Contract from './src/models/Contract.js';
import Location from './src/models/Location.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rentabike');
    console.log('✅ MongoDB connesso');
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
    process.exit(1);
  }
};

const checkOverlap = (reqStartAt, reqEndAt, existingContract, bikeId) => {
  const existingStart = new Date(existingContract.startAt);
  const existingEnd = existingContract.endAt ? new Date(existingContract.endAt) : null;

  if (existingContract.status === 'reserved' && existingEnd === null && existingStart > reqStartAt) {
    return false;
  }

  if (existingContract.status === 'reserved' && existingEnd !== null && reqEndAt === null && existingStart > reqStartAt) {
    return false;
  }

  const newEndEffective = reqEndAt ? new Date(reqEndAt) : new Date(8640000000000000);
  const existingEndEffective = existingEnd ? existingEnd : new Date(8640000000000000);

  const overlap = Math.max(reqStartAt.getTime(), existingStart.getTime()) <=
                  Math.min(newEndEffective.getTime(), existingEndEffective.getTime());

  const hasActiveItem = existingContract.items.some(item =>
    item.refId.toString() === bikeId.toString() && !item.returnedAt
  );

  return overlap && hasActiveItem;
};

const testFutureReservationAllowsInUse = async () => {
  const location = await Location.findOne();
  const bike = await Bike.findOne({ location: location._id });
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 7);
  const futureEndDate = new Date(futureDate);
  futureEndDate.setDate(futureEndDate.getDate() + 1);

  await Contract.deleteMany({});
  await Bike.updateOne({ _id: bike._id }, { status: 'available' });

  await Contract.create({
    customer: { name: 'Cliente Prenotazione' },
    items: [{
      kind: 'bike',
      refId: bike._id,
      kindRef: 'Bike',
      name: bike.name,
      barcode: bike.barcode,
      priceHourly: bike.priceHourly,
      priceDaily: bike.priceDaily,
      originalPriceHourly: bike.priceHourly,
      originalPriceDaily: bike.priceDaily
    }],
    status: 'reserved',
    location: location._id,
    startAt: futureDate,
    endAt: futureEndDate,
    reservationDate: futureDate.toISOString(),
    isReservation: true,
    createdBy: 'test',
    totals: { subtotal: 0, insurance: 0, grandTotal: 0 }
  });

  await Bike.updateOne({ _id: bike._id }, { status: 'reserved' });

  const conflictingContracts = await Contract.find({
    status: { $in: ['in-use', 'reserved'] },
    location: location._id,
    'items.refId': bike._id,
    'items.kind': 'bike'
  }).select('items startAt endAt status');

  const reqStartAt = now;
  const reqEndAt = null;

  let blocked = false;
  for (const existingContract of conflictingContracts) {
    if (checkOverlap(reqStartAt, reqEndAt, existingContract, bike._id)) {
      blocked = true;
    }
  }

  await Contract.deleteMany({});
  await Bike.updateOne({ _id: bike._id }, { status: 'available' });

  return !blocked;
};

const testActiveInUseBlocksNew = async () => {
  const location = await Location.findOne();
  const bike = await Bike.findOne({ location: location._id });
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  await Contract.deleteMany({});
  await Bike.updateOne({ _id: bike._id }, { status: 'available' });

  await Contract.create({
    customer: { name: 'Cliente Noleggio Attivo' },
    items: [{
      kind: 'bike',
      refId: bike._id,
      kindRef: 'Bike',
      name: bike.name,
      barcode: bike.barcode,
      priceHourly: bike.priceHourly,
      priceDaily: bike.priceDaily,
      originalPriceHourly: bike.priceHourly,
      originalPriceDaily: bike.priceDaily
    }],
    status: 'in-use',
    location: location._id,
    startAt: yesterday,
    createdBy: 'test',
    totals: { subtotal: 0, insurance: 0, grandTotal: 0 }
  });

  await Bike.updateOne({ _id: bike._id }, { status: 'in-use' });

  const conflictingContracts = await Contract.find({
    status: { $in: ['in-use', 'reserved'] },
    location: location._id,
    'items.refId': bike._id,
    'items.kind': 'bike'
  }).select('items startAt endAt status');

  const reqStartAt = now;
  const reqEndAt = null;

  let blocked = false;
  for (const existingContract of conflictingContracts) {
    if (checkOverlap(reqStartAt, reqEndAt, existingContract, bike._id)) {
      blocked = true;
    }
  }

  await Contract.deleteMany({});
  await Bike.updateOne({ _id: bike._id }, { status: 'available' });

  return blocked;
};

const runTests = async () => {
  await connectDB();

  const test1 = await testFutureReservationAllowsInUse();
  const test2 = await testActiveInUseBlocksNew();

  console.log('📊 RISULTATI:');
  console.log(`   Test 1 (prenotazione futura → in-use oggi): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 2 (in-use attivo blocca nuovo): ${test2 ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n🏁 Test terminato. Chiusura connessione...');
  await mongoose.connection.close();
  process.exit(test1 && test2 ? 0 : 1);
};

runTests();
