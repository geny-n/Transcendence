import dotenv from "dotenv";
import http from "http";
import https from "https";
import fs from "fs";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const requestModule = isProduction ? https : http;

const options = {
	timeout: 2000,
	host: "localhost",
	port: process.env.PORT,
	path: "/health",
	...(isProduction
		? {
				key: fs.readFileSync("/etc/ssl/private/backend-selfsigned.key"),
				cert: fs.readFileSync("/etc/ssl/certs/backend-selfsigned.crt"),
			}
		: {}),
};

const request = requestModule.request(options, (res) => {
	console.info("STATUS:", res.statusCode);
	process.exit(res.statusCode === 200 ? 0 : 1);
});

request.on("error", (err) => {
	console.error("ERROR", err);
	process.exit(1);
});

request.end();