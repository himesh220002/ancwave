import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

export const DB_NAME = "ancwaveDB";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB() {
  if (!MONGODB_URI) {
    // Return null to allow fallback to in-memory store smoothly
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      dbName: DB_NAME, // Connects directly to ancwaveDB on the cluster
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log(`Connected to MongoDB Atlas [Database: ${m.connection.name || DB_NAME}]`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.warn("MongoDB connection warning (falling back to in-memory store):", e);
    return null;
  }

  return cached.conn;
}
