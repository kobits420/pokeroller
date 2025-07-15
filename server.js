const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const userRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://pokeroller.com:8080',
            'http://pokeroller.com',
            'https://pokeroller.com',
            'https://pokeroller.com:8080',
            'http://25.59.175.155:3000',
            'http://25.59.175.155:3001'
        ],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://pokeroller.com:8080',
        'http://pokeroller.com',
        'https://pokeroller.com',
        'https://pokeroller.com:8080',
        'http://25.59.175.155:3000',
        'http://25.59.175.155:3001'
    ],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Socket.io chat logic
const connectedUsers = {};

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.id;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});
io.on('connection', (socket) => {
    connectedUsers[socket.userId] = socket;
    socket.on('private_message', ({ to, message }) => {
        if (connectedUsers[to]) {
            connectedUsers[to].emit('private_message', {
                from: socket.userId,
                message
            });
        }
    });
    socket.on('disconnect', () => {
        delete connectedUsers[socket.userId];
    });
});

// Connect to database and start server
connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Server accessible from external devices`);
    });
});

module.exports = app; 