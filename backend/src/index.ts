import express from 'express';
import routes from './routes/index';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './strategies/42-strategy';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
const PORT = process.env.PORT || 3100;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(routes);

try {
	prisma.$connect();
	console.log('Inside ../src/index.ts: Database connected');

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