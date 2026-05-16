import express from 'express';
import cors from 'cors';
import { connectDB } from './libs/db.js';
import { ENV } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import chatRoutes from './routes/chat.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
const app = express();
app.use(cors());
app.use(express.json());
// Routes
app.use('/health', healthRoutes);
app.use('/chat', chatRoutes);
app.use('/conversations', conversationRoutes);
// Connect to DB and start server
async function startServer() {
    try {
        await connectDB();
        app.listen(ENV.port, () => {
            console.log(`Server is running on port ${ENV.port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
