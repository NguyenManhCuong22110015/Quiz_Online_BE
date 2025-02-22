import express from 'express';
import Room from '../models/RoomQuiz.js';

const router = express.Router();

// Create new room
router.post('/create', async (req, res) => {
    try {
        const { name, password, maxPlayers, createdBy } = req.body;
        
        const room = new Room({
            name,
            password,
            maxPlayers,
            createdBy
        });

        await room.save();
        
        res.status(201).json({
            success: true,
            roomId: room._id,
            message: 'Room created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get all active rooms
// Get all active rooms
router.get('/active', async (req, res) => {
    try {
        const rooms = await Room.find({ 
            isActive: true,
            $expr: { $lt: ["$currentPlayers", "$maxPlayers"] }  // Using $expr to compare fields
        }).select('');
        
        res.json(rooms);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/verify-password', async (req, res) => {
    try {
        const { roomId, password } = req.body;
        if (!roomId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and password are required'
            });
        }
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        if (!room.password) {
            return res.status(400).json({
                success: false,
                message: 'This room is not password protected'
            });
        }
        if (room.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }
        res.json({
            success: true,
            message: 'Password verified successfully',
            roomId: room._id
        });
    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password verification'
        });
    }
});
router.get('/:roomId/check-access', async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId);
        
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            requiresPassword: Boolean(room.password),
            message: room.password ? 'Password required' : 'Access granted'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify room access'
        });
    }
});

router.put("/addQuizzes", async (req, res) => {
    try {
        const { roomId, quizIds } = req.body;
        
        const room = await Room.findByIdAndUpdate(
            roomId,
            { 
                $addToSet: { 
                    QuizzIds: { 
                        $each: quizIds 
                    } 
                } 
            },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        res.json({
            success: true,
            message: 'Quizzes added to room',
            updatedQuizzes: room.quizzes
        });
    }
    catch (error) {
        console.error('Add quizzes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add quizzes to room'
        });
    }
});

// Update quizzes in room by replacing all existing quizzes
router.put("/update", async (req, res) => {
    try {
        const { roomId, quizIds } = req.body;
        
        const room = await Room.findByIdAndUpdate(
            roomId,
            { 
                $set: { QuizzIds: [] }, 
            },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if(!quizIds){
            return res.json({
                success: true,
                message: 'Quizzes updated in room',
                updatedQuizzes: updatedRoom.QuizzIds
            });
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            roomId,
            { 
                $set: { 
                    QuizzIds: quizIds  
                } 
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Quizzes updated in room',
            updatedQuizzes: updatedRoom.QuizzIds
        });
    }
    catch (error) {
        console.error('Update quizzes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update quizzes in room'
        });
    }
});

router.get("/getRoom/:roomId", async function (req, res) {
    try {
        const roomId = req.params.roomId;
        const room = await Room.findById(roomId);
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get("/getQuizzes", async (req, res) => {
  try {
    const roomId = req.query.roomId;
    const quizzes = await Room.findById(roomId).select('QuizzIds');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put("/updateRoomName" , async (req, res) => {
    try {
        const { roomId, name } = req.body;
        console.log(req.body);
        const updatedRoom = await Room.findByIdAndUpdate
        (roomId, { name }, { new: true });
        res.json(updatedRoom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
);

export default router;