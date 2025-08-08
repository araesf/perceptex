'use client'

import { useState, useEffect } from 'react'
import Button from './Button'
import { requestNotificationPermission } from '../lib/notifications'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      const granted = await requestNotificationPermission()
      if (granted) {
        setPermission('granted')
      }
    } finally {
      setIsRequesting(false)
    }
  }

  if (!('Notification' in window)) {
    return null
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-2">Notifications</h3>
      <p className="text-sm text-gray-600 mb-4">
        Get notified about new suggestions and activities
      </p>
      {permission === 'granted' ? (
        <p className="text-sm text-green-600">✓ Notifications enabled</p>
      ) : (
        <Button
          variant="primary"
          onClick={handleRequestPermission}
          isLoading={isRequesting}
        >
          Enable Notifications
        </Button>
      )}
    </div>
  )
} 