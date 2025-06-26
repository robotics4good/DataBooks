const WebSocket = require('ws');

// Create a WebSocket server on port 8081
const wss = new WebSocket.Server({ port: 8081 });

// Handle client connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Handle messages from clients
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
        
        // Echo the message back to the client
        ws.send(message.toString());
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on ws://localhost:8081'); 