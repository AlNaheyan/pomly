const { supabase } = require('../config/db')

// socket io auth middleware

const authenticate_socket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('no token found or provided'))
        }
        const { data: {user}, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return next(new Error('invalid token'))
        }

        socket.userId = user.id;
        socket.userEmail = user.email;
        next();
    } catch (error) {
        next(new Error("auth failed"))
    }
};

// rest apu auth middlware

const authenticate_api = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({error: 'no token  provided'});
        }

        const token = authHeader.split(' ')[1];
        const {data: {user}, error} = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({error: 'Invaldid token'})
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({error: "auth failed"})
    }
};

module.exports = {
    authenticate_api,
    authenticate_socket
};