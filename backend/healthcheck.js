import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import fs from "fs";

const PORT = process.env.PORT || 3100;
const sslKeyPath = '/etc/ssl/private/backend-selfsigned.key';
const sslCertPath = '/etc/ssl/certs/backend-selfsigned.crt';

const isHttps = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);
const requestLib = isHttps ? httpsRequest : httpRequest;

const options = {
    timeout: 2000,
    host: "localhost",
    port: PORT,
    path: "/health",
    rejectUnauthorized: false // Accept self-signed certs
};

const request = requestLib(options, res => {
    console.info("STATUS: " + res.statusCode);
    process.exitCode = res.statusCode === 200 ? 0 : 1;
    process.exit();
});

request.on("error", function(err) {
    console.error("ERROR", err);
    process.exit(1);
})

request.end();