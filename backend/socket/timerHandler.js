const { startTimer, pauseTimer, stopTimer } = require('../services/timerService');
const { getRoom } = require('../services/roomServices');

const setupTimerHandlers = (io, socket) => {
    // start timer (only host at the moment)
    socket.on('start-timer', (data, callback) => {
        if (!socket.currentRoom) {
            return callback({success: false, error: 'not in a room'});
        }

        const room = getRoom(socket.currentRoom);
        if (!room || room.host_id != socket.userId) {
            return callback({success: false, error: "only cost can control timer"})
        } 
        
        const timer = startTimer(socket.currentRoom, data.type, io);
        callback({success: true, timer });

        // broadcase timer start
        io.to(socket.currentRoom).emit('timer-started', timer);
    });

    // pause
    socket.on('pause-timer', (callback) => {
        if (!socket.currentRoom) {
            return callback({ success: false, error: "not in room" });
        }

        const room = getRoom(socket.currentRoom);
        if (!room || room.host_id != socket.userId) {
            return callback({ success: false, error: 'Only host can control timer'})
        }

        const timer = pauseTimer(socket.currentRoom);
        callback({success: true, timer });

        // boroadcast time pause
        io.to(socket.currentRoom).emit('timer-paused', timer);
    });

    // stop timer
    socket.on('stop-timer', (callback) => {
        if (!socket.currentRoom) {
            return callback({ success: false, error: 'Not in a room' });
        }

        const room = getRoom(socket.currentRoom)
        if (!room || room.host_id != socket.userId) {
            return callback({ success: false, error: "only host can control timer"})
        }

        const timer = stopTimer(socket.currentRoom);
        callback({ success: true, timer });

        io.to(socket.currentRoom).emit("timer-stop", timer);
    });
};

module.exports = { setupTimerHandlers };