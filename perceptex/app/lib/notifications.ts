export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  return notification
}

export function notifyNewSuggestion(suggestion: { title: string; description: string }) {
  showNotification('New Suggestion', {
    body: suggestion.description,
    tag: 'suggestion',
    requireInteraction: true,
  })
}

export function notifyNewActivity(activity: { description: string }) {
  showNotification('New Activity', {
    body: activity.description,
    tag: 'activity',
  })
} 