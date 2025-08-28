const {authenticate_socket } = require('../middleware/auth')
const { setupRoomHandlers } = require('./roomHandlers')
const { setupTimerHandlers } = require('./timerHandler')
const { setupWebRTCHandlers } = require('./webrtcHandler')

const setupSocketHandlers = (io) => {
    // socket middlware
    io.use(authenticate_socket);

    // handle socket connection
    io.on('connection', (socket) => {
        console.log(`user ${socket.userId} connected`);

        // setup differne handler grops
        const { handleRoomCleanup } = setupRoomHandlers(io, socket);
        setupTimerHandlers(io, socket);
        setupWebRTCHandlers(io, socket);

        // handle disconnection
        socket.on('disconnect', () => {
            console.log(`user ${socket.userId} disconnected`);

            // cleanup
            handleRoomCleanup();
        })
    })
};

module.exports = { setupSocketHandlers };