const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

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

  jwt.verify(token, 'simple-secret', (err, user) => {
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
    
    const existingUser = data.users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    data.users.push(user);
    saveData();

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'simple-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: user.id, username, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      'simple-secret',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      _id: Date.now().toString(),
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    res.json(data.rooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const room = data.rooms.find(r => r._id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:id/messages', authenticateToken, async (req, res) => {
  try {
    const messages = data.messages
      .filter(m => m.room === req.params.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const syncData = {
      ...data,
      serverTimestamp: Date.now(),
      eventType: 'play'
    };
    // Update room state
    const fileData = readData();
    const room = fileData.rooms.find(r => r.id === data.roomId);
    if (room) {
      room.videoState = {
        isPlaying: true,
        currentTime: data.currentTime,
        lastUpdate: syncData.serverTimestamp
      };
      writeData(fileData);
    }
    socket.to(data.roomId).emit('video-sync', syncData);
  });

  socket.on('video-pause', (data) => {
    const syncData = {
      ...data,
      serverTimestamp: Date.now(),
      eventType: 'pause'
    };
    // Update room state
    const fileData = readData();
    const room = fileData.rooms.find(r => r.id === data.roomId);
    if (room) {
      room.videoState = {
        isPlaying: false,
        currentTime: data.currentTime,
        lastUpdate: syncData.serverTimestamp
      };
      writeData(fileData);
    }
    socket.to(data.roomId).emit('video-sync', syncData);
  });

  socket.on('video-seek', (data) => {
    const syncData = {
      ...data,
      serverTimestamp: Date.now(),
      eventType: 'seek'
    };
    // Update room state
    const fileData = readData();
    const room = fileData.rooms.find(r => r.id === data.roomId);
    if (room) {
      room.videoState = {
        ...room.videoState,
        currentTime: data.currentTime,
        lastUpdate: syncData.serverTimestamp
      };
      writeData(fileData);
    }
    socket.to(data.roomId).emit('video-sync', syncData);
  });

  // Send current video state to new joiners
  socket.on('request-video-state', (roomId) => {
    const fileData = readData();
    const room = fileData.rooms.find(r => r.id === roomId);
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
      const message = {
        id: Date.now().toString(),
        room: msgData.roomId,
        user: msgData.userId,
        username: msgData.username,
        message: msgData.message,
        timestamp: new Date()
      };
      
      data.messages.push(message);
      saveData();
      
      io.to(msgData.roomId).emit('chat-message', {
        username: msgData.username,
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
