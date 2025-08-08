'use client'

import { useState, useEffect } from 'react'
import { mockActivities, mockSuggestions } from '../lib/mockData'
import Button from '../components/Button'
import NotificationSettings from '../components/NotificationSettings'
import { useRouter } from 'next/navigation'
import { notifyNewActivity } from '../lib/notifications'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activities, setActivities] = useState(mockActivities)
  const pendingSuggestions = mockSuggestions.filter(s => s.status === 'pending')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0]
  }

  const handleViewSuggestions = () => {
    router.push('/inbox')
  }

  const handleAddContext = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate new activity
    const newActivity = {
      id: String(Date.now()),
      type: 'context' as const,
      description: 'New context captured from Gmail',
      timestamp: new Date().toISOString(),
    }
    
    setActivities(prev => [newActivity, ...prev])
    notifyNewActivity(newActivity)
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="card p-6 gradient-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Stats</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Pending Suggestions</p>
              <p className="text-3xl font-bold text-indigo-600">{pendingSuggestions.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Upcoming Events</p>
              <p className="text-3xl font-bold text-pink-600">0</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6 gradient-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          <div className="card p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={handleViewSuggestions}
                className="w-full"
              >
                View Suggestions
              </Button>
              <Button
                variant="secondary"
                onClick={handleAddContext}
                isLoading={isLoading}
                className="w-full"
              >
                Add Context
              </Button>
            </div>
          </div>
          
          <NotificationSettings />
        </div>
      </div>
    </div>
  )
} 