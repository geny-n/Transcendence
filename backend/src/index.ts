import express from 'express';
import routes from './routes/index.js';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Server } from 'socket.io';//moi
import { createServer } from 'https';//moi
import './strategies/42-strategy.js';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
const PORT = process.env.PORT || 3100;
const server = createServer(app);//moi
const io = new Server(server, {//moi
	path: '/socket.io',
	transports: ['websocket', 'polling']
});


// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(routes);

try {
	prisma.$connect();
	console.log('Inside ../src/index.ts: Database connected');

	server.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
} catch (error) {
	console.log('Failed to start server:', error);
	process.exit(1);
}

process.on('SIGINT', async ()=> {
	await prisma.$disconnect();
	console.info('Prisma disconnected', new Date().toISOString());
	process.exit(0);
});

process.on('SIGTERM', async ()=> {
	await prisma.$disconnect();
	console.info('Prisma disconnected', new Date().toISOString());
	process.exit(0);
});