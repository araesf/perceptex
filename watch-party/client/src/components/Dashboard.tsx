import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Room {
  _id: string;
  name: string;
  videoUrl: string;
  host: {
    username: string;
  };
  participants: string[];
  createdAt: string;
}

interface DashboardProps {
  user: User | null;
  token: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, token, onLogout }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', youtubeUrl: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/rooms', newRoom, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewRoom({ name: '', youtubeUrl: '' });
      setShowCreateRoom(false);
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/rooms/${roomId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">🎬 Watch Party</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.username}!</span>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Active Rooms</h2>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
          >
            + Create Room
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Create New Room</h3>
              <form onSubmit={createRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    required
                    value={newRoom.youtubeUrl}
                    onChange={(e) => setNewRoom({...newRoom, youtubeUrl: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste any YouTube video URL</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-md"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room._id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-2">{room.name}</h3>
              <p className="text-gray-400 mb-3">Host: {room.host.username}</p>
              <p className="text-gray-400 mb-4">
                👥 {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => joinRoom(room._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition duration-200"
                >
                  Join Room
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No active rooms</div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create the first room
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
