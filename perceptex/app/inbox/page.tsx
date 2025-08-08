'use client'

import { useState } from 'react'
import { mockSuggestions, mockUsers, type Suggestion } from '../lib/mockData'
import Button from '../components/Button'
import NotificationSettings from '../components/NotificationSettings'
import { notifyNewSuggestion } from '../lib/notifications'
import Image from 'next/image'

export default function InboxPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'ignored'>('all')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0]
  }

  const handleApprove = async (id: string) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === id ? { ...s, status: 'approved' } : s
      )
    )
  }

  const handleIgnore = async (id: string) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === id ? { ...s, status: 'ignored' } : s
      )
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate new suggestion
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    const newSuggestion: Suggestion = {
      id: String(Date.now()),
      type: 'meeting',
      description: 'Schedule team sync meeting',
      status: 'pending',
      timestamp: new Date().toISOString(),
      user: randomUser
    }
    
    setSuggestions(prev => [newSuggestion, ...prev])
    notifyNewSuggestion({
      title: `New suggestion from ${newSuggestion.user.name}`,
      description: newSuggestion.description
    })
    setIsRefreshing(false)
  }

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'all') return true
    return s.status === filter
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold gradient-text">Inbox</h1>
        <div className="flex items-center space-x-4">
          <NotificationSettings />
          <Button
            variant="secondary"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'approved' ? 'primary' : 'secondary'}
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'ignored' ? 'primary' : 'secondary'}
            onClick={() => setFilter('ignored')}
          >
            Ignored
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className="card p-6 gradient-border"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={suggestion.user.avatar}
                      alt={suggestion.user.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {suggestion.description}
                      </h3>
                      <span className="text-sm text-gray-500">
                        from {suggestion.user.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(suggestion.timestamp)}
                    </p>
                  </div>
                </div>
                {suggestion.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(suggestion.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleIgnore(suggestion.id)}
                    >
                      Ignore
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No suggestions found</p>
        )}
      </div>
    </div>
  )
}   