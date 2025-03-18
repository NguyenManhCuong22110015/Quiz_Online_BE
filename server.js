import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv'; 
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import http from 'http';
import initWebSocket from './websocket.js';
import roomRoutes from './routes/roomQuizRoute.js';
import categoryRoutes from './routes/categoryRoute.js';
import session  from "express-session";
import connectMongoDBSession  from "connect-mongodb-session";
import jwt from "jsonwebtoken";
import quizRoutes from './routes/quizzRoutes.js';
import passport from 'passport';
import google from './authentication/google.js';
import authRoutes from './routes/authRoute.js';
import facebook from './authentication/facebook.js';
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MongoDBStore = connectMongoDBSession(session); 
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "sessions",
});



app.use(cors({
    origin: [ 'http://localhost:5173','https://webmern-nmcuong08s-projects.vercel.app', "https://webmern.vercel.app"], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 200
}));


const server = http.createServer(app);


const wss = initWebSocket(server);


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_session_secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
      }));
      
      // Initialize Passport
      app.use(passport.initialize());
      app.use(passport.session());
      
app.use(google.initialize());
app.use(google.session());
app.use(facebook.initialize());
app.use(facebook.session());
app.use('/auth', authRoutes);

app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/categories', categoryRoutes);
server.listen(PORT, '0.0.0.0' ,() => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server is ready`);
});
