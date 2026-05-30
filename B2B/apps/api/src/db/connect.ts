import mongoose from "mongoose";
import type { AppEnv } from "../config/env.js";

export async function connectDb(env: AppEnv): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  return mongoose;
}
