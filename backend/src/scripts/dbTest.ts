import { connectDb } from '../db/connect.js';
import { CategoryModel } from '../models/Category.js';
import mongoose from 'mongoose';

async function main() {
  await connectDb();

  // simple schema sanity check
  const doc = await CategoryModel.findOneAndUpdate(
    { name: '__db_test__' },
    { name: '__db_test__' },
    { upsert: true, new: true }
  );

  const categories = await CategoryModel.find().limit(5).lean();
  const dbName = mongoose.connection.db?.databaseName;

  console.log('[db:test] ok');
  console.log('db:', dbName);
  console.log('testCategoryId:', doc._id.toString());
  console.log('sampleCategories:', categories.map((c: any) => ({ id: c._id.toString(), name: c.name })));

  process.exit(0);
}

main().catch((e) => {
  console.error('[db:test] failed');
  console.error(e);
  process.exit(1);
});


