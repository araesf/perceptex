const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Validate required environment variables on startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  console.error('Generate one with: openssl rand -hex 32');
  process.exit(1);
}

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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000"
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Simple file-based storage
const dataFile = path.join(__dirname, 'data.json');
let data = { users: [], rooms: [], messages: [] };

// Load data from file
try {
  if (fs.existsSync(dataFile)) {
    data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  }
} catch (error) {
  console.log('Starting with empty data');
}

// Save data to file
const saveData = () => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

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

// YouTube URL parsing
const extractYouTubeVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
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

    const existingUser = data.users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: crypto.randomUUID(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    data.users.push(user);
    saveData();

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: user.id, username, email } });
  } catch (error) {
    console.error('Error in /api/register:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = data.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Room routes
app.post('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, youtubeUrl } = req.body;
    
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    const room = {
      _id: crypto.randomUUID(),
      name,
      youtubeUrl,
      videoId,
      host: { username: req.user.username },
      participants: [req.user.userId],
      currentTime: 0,
      isPlaying: false,
      createdAt: new Date()
    };
    
    data.rooms.push(room);
    saveData();


    res.status(201).json(room);
  } catch (error) {
    console.error('Error in POST /api/rooms:', error);
    res.status(500).json({ error: 'An error occurred while creating the room' });
  }
});

app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    res.json(data.rooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    console.error('Error in GET /api/rooms:', error);
    res.status(500).json({ error: 'An error occurred while fetching rooms' });
  }
});

app.get('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const room = data.rooms.find(r => r._id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Check if user is a participant
    if (!room.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied: Not a participant' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error in GET /api/rooms/:id:', error);
    res.status(500).json({ error: 'An error occurred while fetching the room' });
  }
});

app.post('/api/rooms/:id/join', authenticateToken, async (req, res) => {
  try {
    const room = data.rooms.find(r => r._id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.participants.includes(req.user.userId)) {
      room.participants.push(req.user.userId);
      saveData();
    }


    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Error in POST /api/rooms/:id/join:', error);
    res.status(500).json({ error: 'An error occurred while joining the room' });
  }
});

app.get('/api/rooms/:id/messages', authenticateToken, async (req, res) => {
  try {
    const room = data.rooms.find(r => r._id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Check if user is a participant
    if (!room.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied: Not a participant' });
    }
    const messages = data.messages
      .filter(m => m.room === req.params.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-100);
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

  socket.on('video-play', (data) => {
    // Check if user is a participant in the room
    const room = data.rooms.find(r => r._id === data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (!room.participants.includes(socket.userId)) {
      socket.emit('error', { message: 'Access denied: Not a participant' });
      return;
    }
    const syncData = {
      ...data,
      serverTimestamp: Date.now(),
      eventType: 'play'
    };
    // Update room state
    room.videoState = {
      isPlaying: true,
      currentTime: data.currentTime,
      lastUpdate: syncData.serverTimestamp
    };
    saveData();
    socket.to(data.roomId).emit('video-sync', syncData);
  });

  socket.on('video-pause', (data) => {
    // Check if user is a participant in the room
    const room = data.rooms.find(r => r._id === data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (!room.participants.includes(socket.userId)) {
      socket.emit('error', { message: 'Access denied: Not a participant' });
      return;
    }
    const syncData = {
      ...data,
      serverTimestamp: Date.now(),
      eventType: 'pause'
    };
    // Update room state
    room.videoState = {
      isPlaying: false,
      currentTime: data.currentTime,
      lastUpdate: syncData.serverTimestamp
    };
    saveData();
    socket.to(data.roomId).emit('video-sync', syncData);
  });

  socket.on('video-seek', (data) => {
    // Check if user is a participant in the room
    const room = data.rooms.find(r => r._id === data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (!room.participants.includes(socket.userId)) {
      socket.emit('error', { message: 'Access denied: Not a participant' });
      return;
    }
    const syncData = {
      ...data,
      serverTimestamp: Date.now(),
      eventType: 'seek'
    };
    // Update room state
    room.videoState = {
      ...room.videoState,
      currentTime: data.currentTime,
      lastUpdate: syncData.serverTimestamp
    };
    saveData();
    socket.to(data.roomId).emit('video-sync', syncData);
  });

  // Send current video state to new joiners
  socket.on('request-video-state', (roomId) => {
    const room = data.rooms.find(r => r._id === roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (!room.participants.includes(socket.userId)) {
      socket.emit('error', { message: 'Access denied: Not a participant' });
      return;
    }
    if (room && room.videoState) {
      const timeSinceUpdate = Date.now() - room.videoState.lastUpdate;
      const adjustedTime = room.videoState.isPlaying
        ? room.videoState.currentTime + (timeSinceUpdate / 1000)
        : room.videoState.currentTime;

      socket.emit('video-sync', {
        roomId,
        currentTime: adjustedTime,
        serverTimestamp: Date.now(),
        eventType: room.videoState.isPlaying ? 'play' : 'pause'
      });
    }
  });

  socket.on('chat-message', async (msgData) => {
    try {
      // Check if user is a participant in the room
      const room = data.rooms.find(r => r._id === msgData.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      if (!room.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied: Not a participant' });
        return;
      }
      // Input validation
      if (!msgData.message || msgData.message.length === 0 || msgData.message.length > 1000) {
        socket.emit('error', { message: 'Message must be between 1 and 1000 characters' });
        return;
      }
      // Use verified socket identity, not client-supplied data
      const message = {
        id: crypto.randomUUID(),
        room: msgData.roomId,
        user: socket.userId,
        username: socket.username,
        message: msgData.message.trim(),
        timestamp: new Date()
      };

      data.messages.push(message);
      saveData();

      io.to(msgData.roomId).emit('chat-message', {
        username: socket.username,
        message: msgData.message,
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

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Simple Watch Party server running on port ${PORT}`);
  console.log('Using file-based storage (no MongoDB required)');
});
