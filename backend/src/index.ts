import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

import authRoutes from './routes/auth_routes';
import posRoutes from './routes/pos_routes';
import publicRoutes from './routes/public_routes';

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Inject io and prisma into request
app.use((req: any, res, next) => {
  req.io = io;
  req.prisma = prisma;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/public', publicRoutes);

app.get('/', (req, res) => {
  res.send('Cafe POS Pro API (High Fidelity) is running...');
});

// Socket logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-branch', (branchId) => {
    socket.join(branchId);
    console.log(`Socket ${socket.id} joined branch: ${branchId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io, prisma };
