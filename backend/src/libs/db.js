import mongoose from "mongoose";
import ora from "ora";
import { ENV } from "../config/env.js";

const spinner = ora({ text: "Connecting to MongoDB..." });

async function connectDB() {
    try {
        spinner.start();
        await mongoose.connect(ENV.mongoUri);
        spinner.succeed("MongoDB connected");
    } catch (error) {
        spinner.fail("MongoDB connection failed");
        throw error;
    }
}

async function disconnectDB() {
    try {
        spinner.start();
        await mongoose.disconnect();
        spinner.succeed("MongoDB disconnected");
    } catch (error) {
        spinner.fail("MongoDB disconnection failed");
        throw error;
    }
}

export { connectDB, disconnectDB };