const { getAllActiveRooms, getRoom } = require('../services/roomServices');

const setupRoutes = (app) => {
    app.get('/api/rooms', async (req, res) => {
        try {
            const rooms = getAllActiveRooms();
            res.json(rooms);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    });

    app.get('/api/rooms/:id', async (req, res) => {
        try {
            const room = getRoom(req.params.id);

            if (!room) {
                return res.status(404).json({error: 'room not found'});
            }
            const roomResponse = {
                ...room,
                participants: Array.from(room.participants.values())
            };

            res.json(roomResponse);
        } catch (error) {
            res.status(500).json({error: error.message });
        }
    })
};

module.exports = { setupRoutes };