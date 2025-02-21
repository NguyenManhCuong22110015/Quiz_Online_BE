import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv'; 
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import http from 'http';
import initWebSocket from './websocket.js';
import roomRoutes from './routes/roomQuizRoute.js';
import session  from "express-session";
import connectMongoDBSession  from "connect-mongodb-session";
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;
const MongoDBStore = connectMongoDBSession(session); 
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "sessions",
});

app.use(
    session({
      secret: "123131213",
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 }, // 1 giờ
    })
  );
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], 
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());


const server = http.createServer(app);


const wss = initWebSocket(server);


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rooms', roomRoutes);
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server is ready`);
});