import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import YouTubePlayer from './YouTubePlayer.tsx';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message {
  username: string;
  message: string;
  timestamp: string;
}

interface WatchRoomProps {
  user: User | null;
  token: string;
}

const WatchRoom: React.FC<WatchRoomProps> = ({ user, token }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join room
    newSocket.emit('join-room', roomId);

    // Fetch room data
    fetchRoom();
    fetchMessages();

    // Socket event listeners for precise synchronization
    newSocket.on('video-sync', (data) => {
      if (player && isPlayerReady) {
        const networkDelay = Date.now() - data.serverTimestamp;
        let adjustedTime = data.currentTime;
        
        // Compensate for network delay and time since server event
        if (data.eventType === 'play') {
          adjustedTime += (networkDelay / 1000);
        }
        
        player.seekTo(adjustedTime);
        
        if (data.eventType === 'play') {
          player.playVideo();
          setIsPlaying(true);
        } else if (data.eventType === 'pause') {
          player.pauseVideo();
          setIsPlaying(false);
        }
      }
    });

    newSocket.on('chat-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, socket, player, isPlayerReady]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room:', error);
      navigate('/dashboard');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlayerReady = (ytPlayer: any) => {
    setPlayer(ytPlayer);
    setIsPlayerReady(true);
    
    // Request current video state when player is ready
    if (socket) {
      socket.emit('request-video-state', roomId);
    }
  };

  const handlePlayerStateChange = (event: any) => {
    if (!socket) return;
    
    const currentTime = player?.getCurrentTime() || 0;
    
    if (event.data === 1) { // Playing
      socket.emit('video-play', { roomId, currentTime });
      setIsPlaying(true);
    } else if (event.data === 2) { // Paused
      socket.emit('video-pause', { roomId, currentTime });
      setIsPlaying(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket && user) {
      socket.emit('chat-message', {
        roomId,
        userId: user.id,
        username: user.username,
        message: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-300 hover:text-white"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold">{room.name}</h1>
            </div>
            <div className="text-gray-300">
              👥 {room.participants.length} watching
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-screen pt-16">
        {/* Video Section */}
        <div className="flex-1 p-6">
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <YouTubePlayer
              videoId={room.videoId}
              onReady={handlePlayerReady}
              onStateChange={handlePlayerStateChange}
            />
          </div>
          
          {/* Video Controls Info */}
          <div className="mt-4 text-center text-gray-400">
            <p>Video controls are synchronized across all participants</p>
            <p className="text-sm">Status: {isPlaying ? '▶️ Playing' : '⏸️ Paused'}</p>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-80 bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Live Chat</h3>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className="break-words">
                <div className="flex items-baseline space-x-2">
                  <span className="font-medium text-purple-400">{msg.username}:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-200 ml-2">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WatchRoom;
