import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: {
		sucess: false,
		error: 'Too many attempts',
		retryAfter: '15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,
	statusCode: 429,
	skipSuccessfulRequests: true,
})

export const apiLimiter = rateLimit({
	max: 60,
	message: {
		sucess: false,
		error: 'Too many requests from this IP address',
		retryAfter: '15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,
	statusCode: 429
})
