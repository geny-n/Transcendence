import express, { type NextFunction, type Request, type Response } from 'express';
import routes from './routes/index.js';
import prisma from './lib/prisma.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './strategies/42-strategy.js';
import './strategies/discord-strategy.js'
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import { initSocket } from './lib/socket.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandlers.js';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import { hashPassword } from './utils/helpers.js';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
app.set('trust proxy', 1);
let server;

if (process.env.NODE_ENV === 'production') {
	const options = {
	key: fs.readFileSync('/etc/ssl/private/backend-selfsigned.key'),
	cert: fs.readFileSync('/etc/ssl/certs/backend-selfsigned.crt'),
	};

	server = https.createServer(options, app);
} else {
	server = http.createServer(app);
}

// Initialise Socket.io
initSocket(server);

const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// Middlewares
app.use(helmet());
app.use(cors({
	origin: process.env.FRONTEND_URL,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));
// app.use(apiLimiter);
app.use(express.json());
app.use(cookieParser());
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));
app.use(passport.initialize());
app.use(routes);
app.use(errorHandler);

try {
	prisma.$connect();
	console.log('Database connected');

	// Optional admin bootstrap for dev/staging: configure via env vars.
	const bootstrapAdminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
	const bootstrapAdminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
	const bootstrapAdminUsername = process.env.ADMIN_BOOTSTRAP_USERNAME ?? 'admin';

	if (bootstrapAdminEmail && bootstrapAdminPassword) {
		const adminPassword = hashPassword(bootstrapAdminPassword);
		await prisma.user.upsert({
			where: { email: bootstrapAdminEmail },
			update: {
				password: adminPassword,
				role: 'ADMIN',
				username: bootstrapAdminUsername,
			},
			create: {
				email: bootstrapAdminEmail,
				password: adminPassword,
				username: bootstrapAdminUsername,
				role: 'ADMIN',
			},
		});
		console.log('Bootstrap admin account ensured from environment variables.');
	}

	server.listen(PORT, () => {
		console.log(`Server is running on https://localhost:${PORT}`);
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