import bcrypt from 'bcrypt';
import { connectDb } from '../db/connect.js';
import { CategoryModel } from '../models/Category.js';
import { GameModel } from '../models/Game.js';
import { SlotModel } from '../models/Slot.js';
import { ClosureModel } from '../models/Closure.js';
import { UserModel } from '../models/User.js';
import { formatTimeRange } from '../utils/timeLabel.js';

async function seed() {
  await connectDb();

  // Admin user (local dev)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@local.test';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin1234';
  const existingAdmin = await UserModel.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await UserModel.create({ email: adminEmail, name: 'Admin', passwordHash, role: 'admin' });
    console.log(`[seed] created admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('[seed] admin already exists');
  }

  // Categories + Games (mirrors src/data/mockData.ts)
  const football = await CategoryModel.findOneAndUpdate(
    { name: 'Football' },
    { name: 'Football' },
    { upsert: true, new: true }
  );
  const cricket = await CategoryModel.findOneAndUpdate(
    { name: 'Cricket' },
    { name: 'Cricket' },
    { upsert: true, new: true }
  );

  const g1 = await GameModel.findOneAndUpdate(
    { categoryId: football._id, name: '5v5 Football' },
    { categoryId: football._id, name: '5v5 Football' },
    { upsert: true, new: true }
  );
  const g2 = await GameModel.findOneAndUpdate(
    { categoryId: football._id, name: '7v7 Football' },
    { categoryId: football._id, name: '7v7 Football' },
    { upsert: true, new: true }
  );
  const g3 = await GameModel.findOneAndUpdate(
    { categoryId: cricket._id, name: 'Box Cricket' },
    { categoryId: cricket._id, name: 'Box Cricket' },
    { upsert: true, new: true }
  );

  const ensureSlot = async (gameId: any, startHour: number, price: number) => {
    const endHour = startHour + 1;
    await SlotModel.findOneAndUpdate(
      { gameId, startHour },
      {
        gameId,
        startHour,
        endHour,
        timeLabel: formatTimeRange(startHour, endHour),
        price,
        active: true,
      },
      { upsert: true, new: true }
    );
  };

  await ensureSlot(g1._id, 18, 60);
  await ensureSlot(g1._id, 19, 60);
  await ensureSlot(g2._id, 18, 90);
  await ensureSlot(g2._id, 19, 90);
  await ensureSlot(g3._id, 18, 50);

  // Example closure (tomorrow partial)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  await ClosureModel.findOneAndUpdate(
    { date: tomorrow, type: 'partial', startHour: 18, endHour: 20 },
    { date: tomorrow, type: 'partial', startHour: 18, endHour: 20, reason: 'Maintenance', note: 'Pitch resurfacing' },
    { upsert: true, new: true }
  );

  console.log('[seed] done');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});


