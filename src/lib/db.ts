import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

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
    // Explicitly target ancwaveDB if not present in URI
    let connectionUri = MONGODB_URI;
    if (connectionUri.includes(".mongodb.net/") && !connectionUri.split(".mongodb.net/")[1]?.split("?")[0]) {
      const [base, query] = connectionUri.split(".mongodb.net/");
      connectionUri = `${base}.mongodb.net/ancwaveDB${query ? `?${query.replace(/^\??/, "")}` : ""}`;
    }

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      dbName: "ancwaveDB",
    };

    cached.promise = mongoose.connect(connectionUri, opts).then((m) => {
      console.log(`Connected to MongoDB Atlas [Database: ${m.connection.name || "ancwaveDB"}]`);
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
