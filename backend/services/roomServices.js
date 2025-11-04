const { supabase } = require('../config/db')

// In memory storage for rooms
const activeRooms = new Map();

const createRoom = async (hostId, roomData) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const room = {
        id: roomId,
        room_code: roomCode,
        name:roomData.name,
        description: roomData.description || '',
        host_id:hostId,
        max_participants: parseInt(roomData.maxParticipant) || 10,
        participants: new Map([[hostId, { id: hostId, is_host: true, is_muted: false }]]),
        created_at: new Date().toISOString(),
        is_active: true,
        timer: {
            is_active: false,
            type: 'work',
            duration: 25 * 60,
            session_count: 0,
            started_at: null
        }
    }

    activeRooms.set(roomId, room)

    // save to db
    try {
        await supabase.from('rooms').insert({
            id: roomId,
            room_code: roomCode,
            name: roomData.name,
            description: roomData.description || '',
            host_id: hostId,
            max_participants: parseInt(roomData.maxParticipant) || 10,
            is_active: true
        });
    } catch (error) {
        console.log("error saving room to db", error)
    }

    return room;
};

const joinRoom = (roomId, userId) => {
    const room = activeRooms.get(roomId);
    if (!room) {
        return null
    }

    // User already in room - return current state
    if (room.participants.has(userId)) {
        return room;
    }

    if (room.participants.size >= room.max_participants) {
        return {error: 'Room is full'};
    }

    room.participants.set(userId, {
        id: userId,
        is_host: false,
        is_muted: false
    });

    return room;
};

const leaveRoom = (roomId, userId) => {
    const room = activeRooms.get(roomId)
    // Room doesnt exit anymore
    if (!room) return null

    room.participants.delete(userId);

    // if room is empty or host left, deactivate room
    if (room.participants.size === 0 || userId === room.host_id) {
        room.is_active = false;
        activeRooms.delete(roomId)

        // clean timer if exists

        const { clearRoomTimer } = require('./timerService')
        clearRoomTimer(roomId)
    }

    return room;
};

const getRoom = (roomId) => {
    return activeRooms.get(roomId)
}

const getAllActiveRooms = () => {
    return Array.from(activeRooms.values())
        .filter(room => room.is_active)
        .map(room => ({
            id: room.id,
            room_code: room.room_code,
            name: room.name,
            description: room.description,
            participants: room.participants.size,
            max_participants: room.max_participants,
            is_timer_active:room.timer.is_active,
            // Change this later to actual name from db
            host_name: "Host"
        }));
};

const updateParticipantsMute = (roomId, userId, isMuted) => {
    const room = activeRooms.get(roomId)
    if (!room) return null

    const participant = room.participants.get(userId)
    if (!participant) return null

    const nextMuted =
        typeof isMuted === 'boolean' ? isMuted : !participant.is_muted

    participant.is_muted = nextMuted
    return participant
};

const getActiveRoomCounts = () => {
    return activeRooms.size;
}

module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    getRoom,
    getAllActiveRooms,
    updateParticipantsMute,
    getActiveRoomCounts
}
