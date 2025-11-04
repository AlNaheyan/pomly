const { 
    createRoom,
    joinRoom,
    leaveRoom,
    updateParticipantsMute
} = require('../services/roomServices');

const setupRoomHandlers = (io, socket) => {
    socket.on('create-room', async (roomData, callback) => {
        try {
            const room = await createRoom(socket.userId, roomData);

            // join the socket room
            socket.join(room.id);
            socket.currentRoom = room.id;

            // prepare room data for client from Map to Array
            const roomResponse = {
                ...room,
                participants: Array.from (room.participants.values())
            };

            callback({success: true, room: roomResponse });

            // broadcast room creation to all clients
            socket.broadcast.emit('room-created', {
                id: room.id,
                room_code: room.room_code,
                name: room.name,
                description: room.description,
                participants: room.participants.size,
                max_participants: room.max_participants,
                is_timer_active: room.timer.is_active,
                host_name: 'Host'
            });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // Join room event
    socket.on('join-room', (roomId, callback) => {
        const result = joinRoom(roomId, socket.userId)

        if (!result) {
            return callback({ success: false, error: "roomi not foudn twin "})
        }

        if (result.error) {
            return callback({ success: false, error: result.error })
        }

        socket.join(roomId);
        socket.currentRoom = roomId

        // prepare room data for client
        const roomResponse = {
            ...result,
            participants: Array.from(result.participants.values())
        };
        callback({success: true, room: roomResponse});

        socket.to(roomId).emit('user-joined', {
            userId: socket.userId,
            participants: roomResponse.participants
        })
    });

    // leave room event
    socket.on('leave-room', () => {
        if (socket.currentRoom) {
            const room = leaveRoom(socket.currentRoom, socket.userId);

            socket.to(socket.currentRoom).emit('user-left', {
                userId: socket.userId,
                participants: room ? Array.from(room.participants.values()) : []
            });

            socket.leave(socket.currentRoom);
            socket.currentRoom = null;
        }
    });

    // audi control event
    socket.on('toggle-mute', (payload, maybeCallback) => {
        let callback = maybeCallback;
        let desiredMute = undefined;

        if (typeof payload === 'function') {
            callback = payload;
        } else if (payload && typeof payload === 'object') {
            desiredMute = payload.isMuted;
        }

        if (typeof callback !== 'function') {
            callback = () => {};
        }

        if (!socket.currentRoom) {
            return callback({ success: false, error: "not in a room"});
        }

        const participant = updateParticipantsMute(
            socket.currentRoom,
            socket.userId,
            desiredMute
        );

        if (!participant) {
            return callback({ success: false, error: 'participat not found'});
        }
        
        callback({success: true, is_muted: participant.is_muted});

        // boradcase mute status
        socket.to(socket.currentRoom).emit('user-mute-changed', {
            userId: socket.userId,
            is_muted: participant.is_muted
        });
    });

    // handle room cleanup
    const handleRoomCleanup = () => {
        if (socket.currentRoom) {
            const room = leaveRoom(socket.currentRoom, socket.userId)

            socket.to(socket.currentRoom).emit('user-left', {
                userId: socket.userId,
                participants: room ? Array.from(room.participants.values()): []
            });
        }
    };

    return { handleRoomCleanup};
};

module.exports = { setupRoomHandlers };
