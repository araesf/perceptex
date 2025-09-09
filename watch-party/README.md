# Watch Party App

A dynamic full-stack watch party application that enables synchronized video streaming and live chat interaction.

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: WebSocket
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Docker, AWS EC2

## Features
- Synchronized video streaming across multiple users
- Real-time chat during video playback
- User authentication and personalized experience
- Room creation and management
- Video playback controls (play, pause, seek) synced across all users

## Architecture
```
React Frontend ↔ Express API ↔ MongoDB
     ↕                ↕
WebSocket Server ← → Real-time Chat
```
