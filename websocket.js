import { WebSocketServer } from 'ws';

let players = new Map(); // Store players { username: { score, time } }
let currentQuestion = null;
let questionIndex = 0;

function initWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        console.log("🔗 New player connected");

        ws.on("message", (message) => {
            try {
                const data = JSON.parse(message);
                console.log("📩 Data received:", data);
               
                if (data.type === "join") {
                    
                    players.set(data.username, { score: 0, time: 0 });
                    sendToAll(wss, { type: "playerList", players: Array.from(players.keys()) });

                } else if (data.type === "answer") {
                    if (data.answer === currentQuestion?.correct) {
                        let player = players.get(data.username);
                        player.score += 10;
                        player.time = data.time;
                        sendToAll(wss, { type: "ranking", ranking: Array.from(players.entries()) });
                    }
                }
                else if (data.type === "message") {
                    sendToAll(wss, { type: "message", message: data.message });
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
        ws.on("close", () => console.log("🚪 Player disconnected"));
    });

    return wss;
}

function sendToAll(wss, data) { 
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN is 1
            client.send(JSON.stringify(data));
        } else {
            console.log('❌ Client state:', 
                client.readyState === 0 ? 'CONNECTING' :
                client.readyState === 2 ? 'CLOSING' :
                client.readyState === 3 ? 'CLOSED' : 'UNKNOWN'
            );
        }
    });
}
export default initWebSocket;