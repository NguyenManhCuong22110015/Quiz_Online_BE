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
            messages: [],
            gameState: {
                questions: [],
                currentQuestionIndex: -1,
                playerAnswers: new Map(),
                scores: new Map(),
                timeLimit: 30
            }
        });
        
        // Update room status in database
        await Room.findByIdAndUpdate(roomId, { isActive: true });
        return true;
    } catch (error) {
        console.error("❌ Error creating room:", error);
        return false;
    }
}
async function startGame(roomId) {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom) return false;

    try {
        // Get room from database to get quiz IDs
        const roomDoc = await Room.findById(roomId);
        const quizzes = await Quizze.find({ _id: { $in: roomDoc.QuizzIds } });
        
        activeRoom.gameState.questions = quizzes;
        activeRoom.gameState.currentQuestionIndex = 0;
        activeRoom.gameState.playerAnswers.clear();
        activeRoom.gameState.scores.clear();

        sendNextQuestion(roomId);
        return true;
    } catch (error) {
        console.error("Error starting game:", error);
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
function sendNextQuestion(roomId) {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom) return;

    const { gameState } = activeRoom;
    
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        endGame(roomId);
        return;
    }

    const question = gameState.questions[gameState.currentQuestionIndex];
    gameState.playerAnswers.clear();

    broadcastToRoom(roomId, {
        type: 'question',
        question: {
            text: question.text,
            options: question.options,
            timeLimit: gameState.timeLimit
        }
    });

    // Set timeout for question
    setTimeout(() => checkAnswersAndProgress(roomId), gameState.timeLimit * 1000);
}
function checkAnswersAndProgress(roomId) {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom) return;

    const { gameState } = activeRoom;
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

    // Calculate scores and prepare results
    const results = Array.from(activeRoom.players.keys()).map(username => {
        const answer = gameState.playerAnswers.get(username);
        const isCorrect = answer?.answer === currentQuestion.correctAnswer;
        
        if (isCorrect) {
            const currentScore = gameState.scores.get(username) || 0;
            const timeBonus = Math.floor((answer.timeRemaining || 0) / 2);
            gameState.scores.set(username, currentScore + 10 + timeBonus);
        }

        return {
            username,
            correct: isCorrect
        };
    });

    // Send results to all players
    broadcastToRoom(roomId, {
        type: 'all_answers',
        answers: results
    });

    // Wait 5 seconds before next question
    setTimeout(() => {
        gameState.currentQuestionIndex++;
        sendNextQuestion(roomId);
    }, 5000);
}
function endGame(roomId) {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom) return;

    const finalResults = Array.from(activeRoom.gameState.scores.entries())
        .map(([username, score]) => ({
            username,
            score
        }))
        .sort((a, b) => b.score - a.score);

    broadcastToRoom(roomId, {
        type: 'end_game',
        results: finalResults
    });
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
                    case "start_game":
                        const {roomId} = data;
                        console.log("📩 Start game:", roomId);
                        const room = activeRooms.get(roomId);
                        if (room) {
                            room.players.forEach(player => {
                                player.ws.send(JSON.stringify({
                                    type: "start_game",
                                    message: "Game is starting"
                                }));
                            })
                        }
                        break;
                    case "submit_answer": {
                            if (!userRoom) return;
                            const activeRoom = activeRooms.get(userRoom);
                            if (!activeRoom) return;
                        
                            activeRoom.gameState.playerAnswers.set(data.username, {
                                answer: data.answer,
                                timeRemaining: data.timeRemaining
                            });
                        
                            // If all players answered, progress immediately
                            if (activeRoom.gameState.playerAnswers.size === activeRoom.players.size) {
                                checkAnswersAndProgress(userRoom);
                            }
                            break;
                        }
                    case "end_game":
                        const {roomId_start} = data;
                        console.log("📩 End game:", roomId_start);
                        const playroom = activeRooms.get(roomId_start);
                        if (playroom) {
                            playroom.players.forEach(player => {
                                player.ws.send(JSON.stringify({
                                    type: "end_game",
                                    message: "Game has ended"
                                }));
                            })
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