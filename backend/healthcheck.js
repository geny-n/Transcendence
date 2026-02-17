import { request as _request } from "https";
import fs from 'fs';

const options = {
    timeout: 2000,
    host: "localhost",
    port: process.env.PORT || 3100,
    path: "/api/health",
    key: fs.readFileSync('/etc/ssl/private/backend-selfsigned.key'),
    cert: fs.readFileSync('/etc/ssl/certs/backend-selfsigned.crt')
};

const request = _request(options, res => {
    console.info("STATUS: " + res.statusCode);
    process.exitCode = res.statusCode === 200 ? 0 : 1;
    process.exit();
});

request.on("error", function(err) {
    console.error("ERROR", err);
    process.exit(1);
})

request.end();
