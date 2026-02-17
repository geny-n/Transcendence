import express from 'express';
import routes from './routes/index.js';
import prisma from './lib/prisma.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './strategies/42-strategy.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'node:https';
import fs from 'fs';
import { initSocket } from './lib/socket.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandlers.js';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
const options = {
  key: fs.readFileSync('/etc/ssl/private/backend-selfsigned.key'),
  cert: fs.readFileSync('/etc/ssl/certs/backend-selfsigned.crt'),
};
const httpsServer = createServer(options, app);

// Initialise Socket.io
initSocket(httpsServer);

const PORT = process.env.PORT || 3100;
const __filename = fileURLToPath(import.meta.url);
console.log("Inside ../src/index.ts __filename:", __filename);

const __dirname = path.dirname(__filename);
console.log("__dirname:", __filename);

// Middlewares
app.use(apiLimiter);
app.use(express.json());
app.use(cookieParser());
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));
app.use(passport.initialize());
app.use(routes);
app.use(errorHandler);

try {
	prisma.$connect();
	console.log('Database connected');

	httpsServer.listen(PORT, () => {
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
