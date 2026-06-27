import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbJsonPath = path.join(__dirname, 'data', 'db.json');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in your environment/variables.');
  process.exit(1);
}

async function seed() {
  let client = null;
  try {
    console.log('Reading local db.json file...');
    const rawData = await fs.readFile(dbJsonPath, 'utf-8');
    const localDb = JSON.parse(rawData);

    const dbName = MONGODB_URI.split('/').pop()?.split('?')[0] || 'supa';
    console.log(`Connecting to MongoDB Atlas database "${dbName}"...`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    console.log('Successfully connected to MongoDB!');

    const collections = ['users', 'products', 'orders', 'shops', 'notifications', 'feedback'];

    for (const collName of collections) {
      const items = localDb[collName] || [];
      console.log(`Seeding collection "${collName}" with ${items.length} items...`);
      
      const coll = db.collection(collName);
      
      // Delete existing records to perform a clean seed
      await coll.deleteMany({});
      
      if (items.length > 0) {
        // Strip out existing _id fields if they exist to let Mongo generate clean ObjectIds
        const cleanItems = items.map(({ _id, ...rest }) => rest);
        await coll.insertMany(cleanItems);
      }
      console.log(`Collection "${collName}" seeded successfully!`);
    }

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Database seeding failed with error:', err);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed.');
    }
  }
}

seed();
