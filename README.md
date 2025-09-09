# YouTube Watch Party

A real-time synchronized YouTube watch party application that allows multiple users to watch videos together with perfect synchronization across all devices.

## 🎬 Features

- **Real-time Video Synchronization** - Millisecond-accurate playback across all connected devices
- **Live Chat** - Real-time messaging during video sessions
- **Room Management** - Create and join private watch party rooms
- **User Authentication** - Secure JWT-based login system
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Network Compensation** - Automatic adjustment for network latency

## 🚀 Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication
- **YouTube IFrame API** for video playback
- **Axios** for HTTP requests

### Backend
- **Node.js** with Express.js
- **Socket.io** for WebSocket communication
- **JWT** for authentication
- **bcrypt** for password hashing
- **File-based storage** (JSON persistence)

## 🏗️ Architecture

The application uses a client-server architecture with WebSocket communication:

1. **Server-side State Management** - Tracks video state with timestamps
2. **Network Delay Compensation** - Adjusts playback for latency
3. **Event-driven Synchronization** - Real-time video control events
4. **Automatic Sync for New Joiners** - Late joiners sync to current position

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/youtube-watch-party.git
cd youtube-watch-party
```

2. **Install dependencies:**
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. **Start the application:**
```bash
# Start the server (runs on port 5000)
node server/simple-server.js

# In a new terminal, start the client (runs on port 3000)
cd client
npm start
```

4. **Access the application:**
- Open http://localhost:3000 in your browser
- Register a new account or login
- Create a room and paste a YouTube URL
- Share the room with friends!

## 🎮 How to Use

1. **Register/Login** - Create an account or sign in
2. **Create Room** - Click "Create Room" and add a YouTube video URL
3. **Invite Friends** - Share the room URL with others
4. **Watch Together** - All participants will see synchronized playback
5. **Chat** - Use the live chat to communicate during the video

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room (change video)

### Messages
- `GET /api/rooms/:id/messages` - Get chat messages
- `POST /api/rooms/:id/messages` - Send chat message

## 🔄 Real-time Events

### Video Synchronization
- `video-play` - Play video at specific timestamp
- `video-pause` - Pause video at specific timestamp  
- `video-seek` - Seek to specific time position
- `video-sync` - Unified sync event with server timestamp

### Chat & Rooms
- `join-room` - Join a watch party room
- `chat-message` - Send/receive chat messages
- `request-video-state` - Get current video state for new joiners

## 🛠️ Development

### Project Structure
```
youtube-watch-party/
├── server/
│   ├── simple-server.js      # Main server file
│   └── data.json            # File-based storage
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component
│   └── public/             # Static files
├── package.json            # Server dependencies
└── README.md              # This file
```

### Key Components
- **YouTubePlayer.tsx** - YouTube IFrame API wrapper
- **WatchRoom.tsx** - Main room interface with video and chat
- **simple-server.js** - Express server with Socket.io

## 🚀 Deployment

The application can be deployed using Docker or traditional hosting:

### Docker Deployment
```bash
# Build and run with Docker
docker build -t youtube-watch-party .
docker run -p 3000:3000 -p 5000:5000 youtube-watch-party
```

### Traditional Hosting
- Deploy server to platforms like Heroku, Railway, or DigitalOcean
- Deploy client to Netlify, Vercel, or similar static hosting
- Update API endpoints in client configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- YouTube IFrame API for video playback
- Socket.io for real-time communication
- React and Node.js communities for excellent documentation
