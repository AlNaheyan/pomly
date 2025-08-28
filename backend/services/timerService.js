const { getRoom } = require("./roomServices");

// in memory storage for timer
const roomTimers = new Map();

const startTimer = (roomId, time = "work", io) => {
    const room = getRoom(roomId);
    if (!room) return null;

    // clear exiting timer
    const existingTimer = roomTimers.get(roomId);
    if (existingTimer) {
        clearInterval(existingTimer);
    }

    // set duration based on type

    let duration;
    switch (time) {
        case "break":
            duration = 5 * 60;
            break;
        case "long_break":
            duration = 15 * 60;
            break;
        default:
            duration = 25 * 60; // work
    }

    room.timer = {
        is_active: true,
        type: time,
        duration: duration,
        time_remaining: duration,
        session_count:
            time === "work"
                ? room.timer.session_count + 1
                : room.timer.session_count,
        started_at: new Date().toISOString(),
    };

    // start countdown
    const timer = setInterval(() => {
        room.timer.time_remaining--;

        // broad cast timer update every sec
        io.to(roomId).emit("timer-update", {
            time_remaining: room.timer.time_remaining,
            type: room.timer.type,
            session_count: room.timer.session_count,
        });

        // timer compelted
        if (room.timer.time_remaining <= 0) {
            clearInterval(timer);
            roomTimers.delete(roomId);

            room.timer.is_active = false;

            io.to(roomId).emit("timer-completed", {
                type: room.timer.type,
                session_count: room.timer.session_count,
            });
        }
    }, 1000);

    roomTimers.set(roomId, timer);
    return room.timer;
};

const pauseTimer = (roomId) => {
    const room = getRoom(roomId);
    if (!room) return null;

    const timer = roomTimers.get(roomId);
    if (timer) {
        clearInterval(timer);
        roomTimers.delete(roomId);
    }

    room.timer.is_active = false;
    return room.timer;
};

const stopTimer = (roomId) => {
    const room = getRoom(roomId);
    if (!room) return null;

    const timer = roomTimers.get(roomId);
    if (timer) {
        clearInterval(timer);
        roomTimers.delete(roomId);
    }

    room.timer = {
        is_active: false,
        type: "work",
        duration: 25 * 60,
        time_remaining: 25 * 60,
        session_count: 0,
        started_at: null,
    };

    return room.timer;
};

const clearRoomTimer = (roomId) => {
    const timer = roomTimers.get(roomId);
    if (timer) {
        clearInterval(timer);
        roomTimers.delete(roomId);
    }
};

const clearAllTimers = () => {
    roomTimers.forEach((timer) => clearInterval(timer));
    roomTimers.clear();
};

const getActiveTimersCount = () => {
    return roomTimers.size;
};

module.exports = {
    startTimer,
    pauseTimer,
    stopTimer,
    clearAllTimers,
    clearRoomTimer,
    getActiveTimersCount
}
