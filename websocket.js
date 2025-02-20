import { WebSocketServer } from 'ws';
import Room from './models/RoomQuiz.js';

// Store active connections and game states
const activeRooms = new Map();

async function createRoom(roomId) {
    try {
        // Check if room exists in database
        const roomDoc = await Room.findById(roomId);
        if (!roomDoc) {
            console.error("❌ Room not found in database:", roomId);
            return false;
        }

        // Create active room state
        activeRooms.set(roomId, {
            players: new Map(),
            currentQuestion: null,
            messages: []
        });
        
        // Update room status in database
        await Room.findByIdAndUpdate(roomId, { isActive: true });
        return true;
    } catch (error) {
        console.error("❌ Error creating room:", error);
        return false;
    }
}

async function joinRoom(roomId, username, ws) {
    try {
        // Get room from database
        const roomDoc = await Room.findById(roomId);
        if (!roomDoc) {
            return { success: false, message: "Room not found" };
        }

        // Check max players
        const activeRoom = activeRooms.get(roomId);
        if (activeRoom && activeRoom.players.size >= roomDoc.maxPlayers) {
            return { success: false, message: "Room is full" };
        }


        // Create room state if doesn't exist
        if (!activeRoom) {
            const created = await createRoom(roomId);
            if (!created) {
                return { success: false, message: "Failed to initialize room" };
            }
        }

        // Add player
        activeRooms.get(roomId).players.set(username, { 
            score: 0, 
            time: 0,
            ws: ws 
        });

        // Update player count in database
        await Room.findByIdAndUpdate(roomId, {
            currentPlayers: activeRooms.get(roomId).players.size
        });

        return { success: true };
    } catch (error) {
        console.error("❌ Error joining room:", error);
        return { success: false, message: "Server error" };
    }
}

function initWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        console.log("🔗 New connection");
        let userRoom = null;

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message);
                console.log("📩 Data received:", data);

                switch (data.type) {
                    case "join_room":
                        const joinResult = await joinRoom(data.roomId, data.username, ws);
                        if (joinResult.success) {
                            userRoom = data.roomId;
                            broadcastToRoom(data.roomId, {
                                type: "playerList",
                                players: Array.from(activeRooms.get(data.roomId).players.keys())
                            });
                        } else {
                            ws.send(JSON.stringify({ 
                                type: "error", 
                                message: joinResult.message 
                            }));
                        }
                        break;

                    case "message":
                        console.log("📩 userRoom:", userRoom);
                        console.log("📩 activeRooms:", activeRooms);
                        if (!userRoom || !activeRooms.has(userRoom)) {
                            ws.send(JSON.stringify({
                                type: "error",
                                message: "You are not in an active room"
                            }));
                            return;
                        }
                        broadcastToRoom(userRoom, {
                            type: "message",
                            username: data.username,
                            message: data.message,
                            userAvatar: data.userAvatar
                        });
                        break;

                    case "answer":
                        if (!userRoom || !activeRooms.has(userRoom)) return;
                        const activeRoom = activeRooms.get(userRoom);
                        if (data.answer === activeRoom.currentQuestion?.correct) {
                            const player = activeRoom.players.get(data.username);
                            player.score += 10;
                            player.time = data.time;
                            broadcastToRoom(userRoom, {
                                type: "ranking",
                                ranking: Array.from(activeRoom.players.entries())
                                    .map(([name, data]) => [name, { 
                                        score: data.score, 
                                        time: data.time 
                                    }])
                            });
                        }
                        break;
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        ws.on("close", async () => {
            if (userRoom) {
                const activeRoom = activeRooms.get(userRoom);
                if (activeRoom) {
                    // Remove player
                    for (const [username, data] of activeRoom.players) {
                        if (data.ws === ws) {
                            activeRoom.players.delete(username);
                            break;
                        }
                    }

                    try {
                        // Update database
                        await Room.findByIdAndUpdate(userRoom, {
                            currentPlayers: activeRoom.players.size
                        });

                        // Clean up if room empty
                        if (activeRoom.players.size === 0) {
                            activeRooms.delete(userRoom);
                            await Room.findByIdAndUpdate(userRoom, {
                                isActive: true,
                                currentPlayers: 0
                            });
                        } else {
                            // Notify remaining players
                            broadcastToRoom(userRoom, {
                                type: "playerList",
                                players: Array.from(activeRoom.players.keys())
                            });
                        }
                    } catch (error) {
                        console.error("Error updating room status:", error);
                    }
                }
            }
            console.log("🚪 Client disconnected");
        });
    });

    return wss;
}

function broadcastToRoom(roomId, data) {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom) {
        console.error("❌ Active room not found:", roomId);
        return;
    }

    console.log(`📢 Broadcasting to ${activeRoom.players.size} players in room ${roomId}`);
    
    // Filter out disconnected players first
    for (const [username, player] of activeRoom.players) {
        if (player.ws.readyState !== 1) {  // If not OPEN
            console.log(`⚠️ Removing disconnected player: ${username}`);
            activeRoom.players.delete(username);
        }
    }

    // Then broadcast to remaining players
    activeRoom.players.forEach(({ ws }, username) => {
        try {
            ws.send(JSON.stringify(data));
            console.log(`✅ Message sent to: ${username}`);
        } catch (error) {
            console.error(`❌ Failed to send to ${username}:`, error);
            activeRoom.players.delete(username);
        }
    });
}
export default initWebSocket;