import mongoose from "mongoose";
import { ENV } from "../config/env.js";
async function connectDB() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(ENV.mongoUri);
        console.log("MongoDB connected successfully");
    }
    catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}
async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    }
    catch (error) {
        console.error("MongoDB disconnection failed:", error);
        throw error;
    }
}
export { connectDB, disconnectDB };
