export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Suggestion {
  id: string;
  type: 'meeting' | 'task' | 'reminder';
  description: string;
  status: 'pending' | 'approved' | 'ignored';
  timestamp: string;
  user: User;
}

export interface Activity {
  id: string;
  type: 'context' | 'suggestion' | 'action';
  description: string;
  timestamp: string;
  user: User;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: '2',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: '3',
    name: 'Priya Patel',
    email: 'priya@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
  }
];

export const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    type: 'meeting',
    description: 'Schedule team sync meeting',
    status: 'pending',
    timestamp: new Date().toISOString(),
    user: mockUsers[0]
  },
  {
    id: '2',
    type: 'task',
    description: 'Review project proposal',
    status: 'approved',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: mockUsers[1]
  },
  {
    id: '3',
    type: 'reminder',
    description: 'Follow up with client',
    status: 'ignored',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: mockUsers[2]
  },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'context',
    description: 'New context captured from Gmail',
    timestamp: new Date().toISOString(),
    user: mockUsers[0]
  },
  {
    id: '2',
    type: 'suggestion',
    description: 'Generated meeting suggestion',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: mockUsers[1]
  },
  {
    id: '3',
    type: 'action',
    description: 'Approved task suggestion',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: mockUsers[2]
  },
]; 