import express from 'express';
import routes from './routes/index.js';
import prisma from './lib/prisma.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(routes);

try {
	prisma.$connect();
	console.log('Database connected');

	// httpServer.listen(PORT, () => {
	// 	console.log(`Server is running on http://localhost:${PORT}`);
	app.listen(PORT, () => {
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
