import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');

// MongoDB Setup
const MONGODB_URI = process.env.MONGODB_URI;
let mongoClient = null;
let mongoDb = null;

if (MONGODB_URI) {
  try {
    // Parse DB name from URI or default to 'supa'
    const dbName = MONGODB_URI.split('/').pop()?.split('?')[0] || 'supa';
    mongoClient = new MongoClient(MONGODB_URI);
    mongoDb = mongoClient.db(dbName);
    console.log('Connected to MongoDB database:', dbName);
  } catch (err) {
    console.error('Failed to initialize MongoDB client:', err);
  }
}

class JSONDatabase {
  async read() {
    try {
      const data = await fs.readFile(dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to read db.json, returning empty object', err);
      return {};
    }
  }

  async write(data) {
    try {
      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to db.json', err);
    }
  }

  async find(collection, query = {}) {
    if (mongoDb) {
      try {
        const results = await mongoDb.collection(collection).find(query).toArray();
        return results;
      } catch (err) {
        console.error(`MongoDB find failed for ${collection}:`, err);
      }
    }
    
    // Fallback to JSON file
    const data = await this.read();
    const items = data[collection] || [];
    return items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(collection, query = {}) {
    if (mongoDb) {
      try {
        const result = await mongoDb.collection(collection).findOne(query);
        return result;
      } catch (err) {
        console.error(`MongoDB findOne failed for ${collection}:`, err);
      }
    }

    // Fallback to JSON file
    const data = await this.read();
    const items = data[collection] || [];
    return items.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  }

  async insert(collection, doc) {
    // Generate a unique ID if not provided
    const prefix = collection.substring(0, 4);
    const id = doc.id || `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc = { id, ...doc };

    if (mongoDb) {
      try {
        await mongoDb.collection(collection).insertOne(newDoc);
        return newDoc;
      } catch (err) {
        console.error(`MongoDB insert failed for ${collection}:`, err);
      }
    }

    // Fallback to JSON file
    const data = await this.read();
    if (!data[collection]) data[collection] = [];
    data[collection].push(newDoc);
    await this.write(data);
    return newDoc;
  }

  async update(collection, query, updates) {
    if (mongoDb) {
      try {
        // Strip _id if present in updates to avoid schema immutability error
        const { _id, ...cleanUpdates } = updates;
        const result = await mongoDb.collection(collection).findOneAndUpdate(
          query,
          { $set: cleanUpdates },
          { returnDocument: 'after' }
        );
        return result?.value || result;
      } catch (err) {
        console.error(`MongoDB update failed for ${collection}:`, err);
      }
    }

    // Fallback to JSON file
    const data = await this.read();
    const items = data[collection] || [];
    let updatedCount = 0;
    let updatedItem = null;
    
    data[collection] = items.map(item => {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedCount++;
        const merged = { ...item, ...updates };
        updatedItem = merged;
        return merged;
      }
      return item;
    });

    if (updatedCount > 0) {
      await this.write(data);
    }
    return updatedItem;
  }

  async delete(collection, query) {
    if (mongoDb) {
      try {
        const result = await mongoDb.collection(collection).deleteMany(query);
        return result.deletedCount;
      } catch (err) {
        console.error(`MongoDB delete failed for ${collection}:`, err);
      }
    }

    // Fallback to JSON file
    const data = await this.read();
    const items = data[collection] || [];
    const initialLen = items.length;
    
    data[collection] = items.filter(item => {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      return !matches;
    });

    const deletedCount = initialLen - data[collection].length;
    if (deletedCount > 0) {
      await this.write(data);
    }
    return deletedCount;
  }
}

export const db = new JSONDatabase();
export default db;
