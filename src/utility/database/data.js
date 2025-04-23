import { QuickDB } from "quick.db";
import fs from 'fs';
import path from 'path';

// Database configuration
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'mongodb'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evadeguard';

let db = null;
let mongoClient = null;
let mongoDb = null;

// Initialize database based on type
async function initializeDatabase() {
  if (DB_TYPE === 'sqlite') {
    db = new QuickDB({ filePath: 'database.sqlite' });
    return true;
  } 
  else if (DB_TYPE === 'mongodb') {
    try {
      const { MongoClient } = await import('mongodb');
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      mongoDb = mongoClient.db();
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  } else {
    throw new Error(`Unsupported database type: ${DB_TYPE}`);
  }
}

// Initialize database on module load
initializeDatabase().catch(console.error);

// Backup function for SQLite
export async function backupDatabase() {
  if (DB_TYPE !== 'sqlite') return;
  
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `database-${timestamp}.sqlite`);
  
  try {
    fs.copyFileSync('database.sqlite', backupPath);
    console.log(`✅ Database backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

export function getDB() {
  if (DB_TYPE === 'sqlite') return db;
  return mongoDb;
}

function createModel(baseKey, defaultValue = null) {
  return (subKeys = []) => {
    if (!Array.isArray(subKeys) || subKeys.length === 0 || subKeys.some(k => k === undefined)) {
      console.trace(`[❌ FATAL] Invalid or missing subkeys for model '${baseKey}':`, subKeys);
      throw new Error(`[DB] Invalid subkeys for model '${baseKey}'. Use: ${baseKey}([guildId, userId])`);
    }

    // Create a consistent key format for both DB types
    const key = [baseKey, ...subKeys].join("_");
    const collection = baseKey;
    const docId = subKeys.join("_");

    return {
      key,
      docId,
      collection,

      async get() {
        if (DB_TYPE === 'sqlite') {
          const value = await db.get(key);
          return value ?? defaultValue;
        } else {
          const doc = await mongoDb.collection(collection).findOne({ _id: docId });
          return doc ? doc.data : defaultValue;
        }
      },

      async set(value) {
        if (DB_TYPE === 'sqlite') {
          return await db.set(key, value);
        } else {
          return await mongoDb.collection(collection).updateOne(
            { _id: docId },
            { $set: { data: value } },
            { upsert: true }
          );
        }
      },

      async update(updates) {
        if (DB_TYPE === 'sqlite') {
          const current = await this.get() ?? {};
          const merged = { ...current, ...updates };
          return await db.set(key, merged);
        } else {
          const current = await this.get() ?? {};
          const merged = { ...current, ...updates };
          return await mongoDb.collection(collection).updateOne(
            { _id: docId },
            { $set: { data: merged } },
            { upsert: true }
          );
        }
      },

      async delete() {
        if (DB_TYPE === 'sqlite') {
          return await db.delete(key);
        } else {
          return await mongoDb.collection(collection).deleteOne({ _id: docId });
        }
      },

      async has() {
        if (DB_TYPE === 'sqlite') {
          return (await db.get(key)) != null;
        } else {
          const doc = await mongoDb.collection(collection).findOne({ _id: docId });
          return doc != null;
        }
      }
    };
  };
}

export const users = createModel("users", {
  punishment: {
    evading: false,
    time: 0
  }
});

// Migration utilities
export async function migrateData(migrations = []) {
  let totalMigrated = 0;
  
  if (DB_TYPE === 'sqlite') {
    const allEntries = await db.all();
    
    for (const { id: key, value } of allEntries) {
      if (!key.startsWith("users_")) continue;
      
      let updated = false;
      let currentValue = { ...value };
      
      for (const migrate of migrations) {
        const result = migrate(currentValue);
        if (result.modified) {
          currentValue = result.data;
          updated = true;
        }
      }
      
      if (updated) {
        await db.set(key, currentValue);
        totalMigrated++;
      }
    }
  } else {
    const collection = mongoDb.collection('users');
    const cursor = collection.find({});
    
    await cursor.forEach(async (doc) => {
      let updated = false;
      let currentValue = { ...doc.data };
      
      for (const migrate of migrations) {
        const result = migrate(currentValue);
        if (result.modified) {
          currentValue = result.data;
          updated = true;
        }
      }
      
      if (updated) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { data: currentValue } }
        );
        totalMigrated++;
      }
    });
  }
  
  console.log(`✅ Migration complete: ${totalMigrated} records updated`);
  return totalMigrated;
}

// Example usage of migration:
// migrateData([
//   (data) => {
//     if (!data.warnings) {
//       data.warnings = [];
//       return { modified: true, data };
//     }
//     return { modified: false, data };
//   }
// ]);