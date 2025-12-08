
const API_BASE = 'http://localhost:5173/api'; // Adjust port if needed, usually Vite proxies to server
// But here I'm running node script, so I should target server port directly? 
// The server.js runs on port ... let's check server.js
// Wait, server.js port is not specified in previous view_file. Usually 3000 or 3001.
// Let's check server.js content again or assume 3001 or 3000.
// Actually, package.json says "server": "node server.js".
// Let's view server.js to find port.

import http from 'http';

function testPut() {
    const data = JSON.stringify({
        name: "Test Workshop",
        code: "test_ws",
        departments: ["Dept A", "Dept B"]
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/workshops/test_id_123',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(data);
    req.end();
}

testPut();
