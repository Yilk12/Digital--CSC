"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { decodeJwt } from "@/app/lib/auth"
import { 
  Car, 
  X, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Clock,
  ChevronRight,
  CheckCheck
} from "lucide-react"

function getUserIdFromToken(): string | null {
  try {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
      : null
    if (!token) return null
    const p: any = decodeJwt(token)
    return p?.userId || p?.sub || null
  } catch { return null }
}

export function FleetInboxToggle() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [updating, setUpdating] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  
  const userId = React.useMemo(() => getUserIdFromToken(), [])
  const router = useRouter()

  const loadNotifications = async () => {
    if (!userId) return
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
      : null
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicle-notifications/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
      console.log("Fetched notifications:", data)
    } catch (err) {
      console.error(err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Load notifications on page load
  React.useEffect(() => {
    loadNotifications()
  }, [userId])

  // Refresh notifications when dropdown opens
  React.useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = async (notificationId: string) => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
      : null
    if (!token) return

    setUpdating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicle-notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (res.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleCardClick = async (notification: any) => {
    setExpandedId(prev => (prev === notification.id ? null : notification.id))

    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    // If this notification refers to a field/overtime request, navigate to HR supervisor approvals page
    const fieldId = notification?.fieldRequestId || notification?.field_request_id || notification?.requestId || notification?.request_id
    const overtimeId = notification?.overtimeId || notification?.overtime_id || notification?.otId || notification?.ot_id
    if (notification?.source === 'field' || notification?.source === 'overtime' || fieldId || overtimeId) {
      setOpen(false)
      const params = new URLSearchParams()
      params.set('from', 'notification')
      if (fieldId) params.set('fieldId', String(fieldId))
      if (overtimeId) params.set('overtimeId', String(overtimeId))
      // Dedicated HR supervisor field-overtime page removed; skip special redirect.
    }
  }

  const markAllAsRead = async () => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
      : null
    if (!token) return

    setUpdating(true)
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notification =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicle-notifications/${notification.id}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        )
      )

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
      
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setUpdating(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'alert':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Build tabular data for export (Word/Excel/PDF)
  const buildNotificationsReport = () => {
    const headers = [
      '№',
      'Title',
      'Message',
      'Type',
      'Is Read',
      'Created At',
      'Vehicle Plate',
      'Driver Name',
      'Driver Phone',
    ]

    const rows = notifications.map((n, index) => {
      const vehicle = n.vehicle || {}
      const driver = vehicle.user || {}
      const createdAtLabel = n.createdAt ? new Date(n.createdAt).toLocaleString() : ''

      const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim()

      return [
        String(index + 1),
        n.title || '',
        n.message || '',
        n.type || '',
        n.isRead ? 'Yes' : 'No',
        createdAtLabel,
        vehicle.plate || '',
        driverName,
        driver.phone || '',
      ]
    })

    return { headers, rows }
  }

  const handleExportNotificationsExcel = () => {
    if (typeof window === 'undefined') return
    if (!notifications.length) return

    const { headers, rows } = buildNotificationsReport()
    const lines: string[] = []
    lines.push('Fleet Notifications')
    lines.push('')
    lines.push(headers.join(','))
    rows.forEach(row => {
      lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    })

    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'fleet_notifications.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportNotificationsWord = () => {
    if (typeof window === 'undefined') return
    if (!notifications.length) return

    const { headers, rows } = buildNotificationsReport()
    const reportDate = new Date().toLocaleString()

    const headerRow = headers.map(h => `<th>${h}</th>`).join('')
    const bodyRows = rows
      .map(row => `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`)
      .join('')

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Fleet Notifications</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1, h2 { margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Fleet Notifications</h1>
        <p>Generated at: ${reportDate}</p>

        <table>
          <tr>${headerRow}</tr>
          ${bodyRows}
        </table>
      </body>
      </html>`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'fleet_notifications.doc')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportNotificationsPdf = () => {
    if (typeof window === 'undefined') return
    if (!notifications.length) return

    const { headers, rows } = buildNotificationsReport()
    const reportDate = new Date().toLocaleString()

    const headerRow = headers.map(h => `<th>${h}</th>`).join('')
    const bodyRows = rows
      .map(row => `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`)
      .join('')

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Fleet Notifications</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1, h2 { margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Fleet Notifications</h1>
        <p>Generated at: ${reportDate}</p>

        <table>
          <tr>${headerRow}</tr>
          ${bodyRows}
        </table>
      </body>
      </html>`)

    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="relative">
      {/* Car Icon Notification Button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Fleet Notifications"
        className="relative p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md group"
      >
        <Car className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        
        {/* Unread Badge - Always visible if there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-top-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Fleet Notifications</h3>
                <p className="text-xs text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={updating}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={loadNotifications}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all duration-200 disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-all duration-200"
                title="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
              {notifications.length > 0 && (
                <select
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === 'word') handleExportNotificationsWord()
                    if (value === 'pdf') handleExportNotificationsPdf()
                    if (value === 'excel') handleExportNotificationsExcel()
                    e.target.value = ''
                  }}
                  defaultValue=""
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-xs bg-white"
                >
                  <option value="" disabled>
                    Report
                  </option>
                  <option value="word">Word</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">No notifications</h4>
                <p className="text-sm text-gray-600">You're all caught up! Check back later for updates.</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleCardClick(notification)}
                    className={`p-3 rounded-xl transition-all duration-200 group ${
                      notification.isRead
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500'
                    } ${index < notifications.length - 1 ? 'mb-1' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-semibold text-sm leading-tight ${
                            notification.isRead ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                disabled={updating}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-white rounded transition-all duration-200 disabled:opacity-50"
                                title="Mark as read"
                              >
                                <CheckCheck className="w-3 h-3" />
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
                          {notification.message}
                        </p>

                        {/* Assigned driver & vehicle details
                            Show only when a vehicle exists AND the current user is NOT the assigned driver.
                            Requester sees the card; driver only sees the top message. */}
                        {notification.vehicle && notification.vehicle.user &&
                         notification.vehicle.user.id !== userId && (
                          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800">
                            <div className="font-semibold mb-1">የተመደበዉ ሹፌርና መኪና</div>
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">ሹፌር:</span>{' '}
                                {notification.vehicle.user
                                  ? `${notification.vehicle.user.firstName || ''} ${notification.vehicle.user.lastName || ''}`.trim() || 'N/A'
                                  : 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">ስልክ ቁጥር:</span>{' '}
                                {notification.vehicle.user?.phone || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">መኪና:</span>{' '}
                                {[notification.vehicle.plate, notification.vehicle.make, notification.vehicle.model]
                                  .filter(Boolean)
                                  .join(' • ') || 'N/A'}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          
                          {!notification.isRead && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {unreadCount} unread of {notifications.length} total
                </span>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium py-1 px-3 rounded-lg hover:bg-white transition-all duration-200">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}