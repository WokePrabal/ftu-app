// lib/db.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// default export
export default dbConnect;
// named exports for compatibility with different import styles
export { dbConnect, dbConnect as connectToDB, dbConnect as connectDB };
