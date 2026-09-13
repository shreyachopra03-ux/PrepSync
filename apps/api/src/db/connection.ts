import mongoose from "mongoose";
import { env } from "../config/env";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI);
  }
  return connectionPromise;
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
  connectionPromise = null;
}
