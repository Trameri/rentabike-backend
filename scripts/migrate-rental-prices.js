import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/Config/db.js';
import Contract from '../src/models/Contract.js';
import { computeItemPrice } from '../src/utils/pricing.js';

const DRY_RUN = !process.argv.includes('--apply');

async function migrate() {
  await connectDB();
  console.log(DRY_RUN ? '🔍 Dry-run attivo' : '⚠️ Modalità APPLY attiva');

  const cursor = Contract.find({
    status: { $nin: ['in-use', 'reserved', 'cancelled'] },
    'items.rentalPrice': { $exists: false }
  }).cursor();

  let totalContracts = 0;
  let totalItems = 0;
  let updatedContracts = 0;

  for await (const contract of cursor) {
    totalContracts++;
    let changed = false;

    for (const it of contract.items) {
      if (it.rentalPrice !== undefined && it.rentalPrice !== null) continue;

      let price;
      const lp = contract.lockedItemPrices?.find(l => l.itemId.toString() === it._id.toString());
      if (lp) {
        price = lp.basePrice;
      } else {
        const end = it.returnedAt || contract.endAt;
        if (!end || !it.priceHourly || !it.priceDaily) continue;
        const { total } = computeItemPrice(contract.startAt, end, it.priceHourly, it.priceDaily);
        price = total;
      }

      if (price === undefined || price === null || isNaN(price)) continue;

      it.rentalPrice = price;
      changed = true;
      totalItems++;
    }

    if (changed) {
      if (!DRY_RUN) {
        await contract.save();
      }
      updatedContracts++;
    }
  }

  console.log(`Contratti analizzati: ${totalContracts}`);
  console.log(`Contratti modificati: ${updatedContracts}`);
  console.log(`Item aggiornati: ${totalItems}`);
  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
