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

                if (data.type === "join") {
                    players.set(data.username, { score: 0, time: 0 });
                    broadcast(wss, { type: "playerList", players: Array.from(players.keys()) });

                } else if (data.type === "answer") {
                    if (data.answer === currentQuestion?.correct) {
                        let player = players.get(data.username);
                        player.score += 10;
                        player.time = data.time;
                        broadcast(wss, { type: "ranking", ranking: Array.from(players.entries()) });
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        ws.on("close", () => console.log("🚪 Player disconnected"));
    });

    return wss;
}

function broadcast(wss, data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocketServer.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

export default initWebSocket;