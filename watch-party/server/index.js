/*
 * DEPRECATED: This MongoDB-based server is deprecated.
 * For simple deployments without MongoDB, use server/simple-server.js instead.
 * This file is kept for users who want MongoDB persistence.
 * To use: npm run start:mongo
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables on startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  console.error('Generate one with: openssl rand -hex 32');
  process.exit(1);
}

console.warn('⚠️  Using MongoDB server (index.js). For simpler file-based storage, use simple-server.js instead.');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    // Attach verified user data to socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000"
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/watchparty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Room Schema
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  youtubeUrl: { type: String, required: true },
  videoId: { type: String, required: true },
  currentTime: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || username.length < 2 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 2 and 30 characters' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    console.error('Error in /api/register:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// YouTube URL parsing function
const extractYouTubeVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Room routes
app.post('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, youtubeUrl } = req.body;
    
    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    const room = new Room({
      name,
      youtubeUrl,
      videoId,
      host: req.user.userId,
      participants: [req.user.userId]
    });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Error in POST /api/rooms:', error);
    res.status(500).json({ error: 'An error occurred while creating the room' });
  }
});

app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find().populate('host', 'username').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error in GET /api/rooms:', error);
    res.status(500).json({ error: 'An error occurred while fetching rooms' });
  }
});

app.get('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('host', 'username')
      .populate('participants', 'username');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error in GET /api/rooms/:id:', error);
    res.status(500).json({ error: 'An error occurred while fetching the room' });
  }
});

app.post('/api/rooms/:id/join', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.participants.includes(req.user.userId)) {
      room.participants.push(req.user.userId);
      await room.save();
    }


    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Error in POST /api/rooms/:id/join:', error);
    res.status(500).json({ error: 'An error occurred while joining the room' });
  }
});

// Messages route
app.get('/api/rooms/:id/messages', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Check if user is a participant
    if (!room.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied: Not a participant' });
    }
    const messages = await Message.find({ room: req.params.id })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    console.error('Error in GET /api/rooms/:id/messages:', error);
    res.status(500).json({ error: 'An error occurred while fetching messages' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('video-play', async (data) => {
    try {
      const room = await Room.findById(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      if (!room.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied: Not a participant' });
        return;
      }
      socket.to(data.roomId).emit('video-play', data);
    } catch (error) {
      console.error('Error in video-play:', error);
    }
  });

  socket.on('video-pause', async (data) => {
    try {
      const room = await Room.findById(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      if (!room.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied: Not a participant' });
        return;
      }
      socket.to(data.roomId).emit('video-pause', data);
    } catch (error) {
      console.error('Error in video-pause:', error);
    }
  });

  socket.on('video-seek', async (data) => {
    try {
      const room = await Room.findById(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      if (!room.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied: Not a participant' });
        return;
      }
      socket.to(data.roomId).emit('video-seek', data);
    } catch (error) {
      console.error('Error in video-seek:', error);
    }
  });

  socket.on('chat-message', async (data) => {
    try {
      const room = await Room.findById(data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      if (!room.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied: Not a participant' });
        return;
      }
      // Input validation
      if (!data.message || data.message.length === 0 || data.message.length > 1000) {
        socket.emit('error', { message: 'Message must be between 1 and 1000 characters' });
        return;
      }
      // Use verified socket identity, not client-supplied data
      const message = new Message({
        room: data.roomId,
        user: socket.userId,
        username: socket.username,
        message: data.message.trim()
      });
      await message.save();

      io.to(data.roomId).emit('chat-message', {
        username: socket.username,
        message: data.message,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
