const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");

require("dotenv").config();

const { setupRoutes } = require("./routes/index");
const { setupSocketHandlers } = require("./socket/index");
const { supabase } = require("./config/db");

const app = express();
const server = http.createServer(app);

// middleware

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());

// socket io setup
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// routes
setupRoutes(app);

// socket handler
setupSocketHandlers(io);

// health check
app.get("/health", (req, res) => {
    const { getActiveTimersCount } = require('./services/timerService')
    const { getActiveRoomCounts } = require('./services/roomServices')

    res.json({
        status: "OK",
        activeRooms: getActiveRoomCounts(),
        activeTimers: getActiveTimersCount(),
    })
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
    console.log('Socket io ready for connection');
});

// graceful shutdown
process.on('SIGTERM', () => {
    console.log("SIGTERM recieved, shtting down gracefully");

    const { clearAllTimers } = require('./services/timerService');
    clearAllTimers();
    server.close(() => {
        process.exit(0)
    })
})


