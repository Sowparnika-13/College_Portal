import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaBell, FaSignOutAlt, FaUserCircle, FaTimes, FaBookmark } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { formatDistanceToNow } from 'date-fns'

export default function Navbar({ toggleSidebar }) {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user?.id) return

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        setNotifications(data || [])
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setNotifications(current => [payload.new, ...current])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen)

  const unreadCount = notifications.filter(n => !n.read).length

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(current =>
        current.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(current =>
        current.map(notification => ({ ...notification, read: true }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  return (
    <>
      {/* Profile Drawer */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setProfileDrawerOpen(false)} />
          {/* Drawer */}
          <div className="relative w-72 bg-white h-full shadow-xl z-50 p-6 flex flex-col">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={() => setProfileDrawerOpen(false)}>
              <FaTimes className="h-6 w-6" />
            </button>
            <div className="flex flex-col items-center mt-8">
              <FaUserCircle className="h-16 w-16 text-primary-700 mb-2" />
              <div className="font-bold text-lg mb-1">{user?.first_name} {user?.last_name}</div>
              <div className="text-gray-500 text-sm mb-4">{user?.email}</div>
              <Link to="/profile" className="mb-2 text-primary-700 hover:underline">Profile</Link>
              <Link to="/saved" className="flex items-center text-gray-700 hover:text-primary-700 mb-2"><FaBookmark className="mr-2" />Saved Posts</Link>
              <button className="mt-4 btn btn-primary w-full" onClick={logout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Open sidebar</span>
                <FaBars className="h-5 w-5" />
              </button>
              <div className="md:hidden ml-3">
                <Link to="/" className="text-primary-700 font-bold text-lg">
                  CCP
                </Link>
              </div>
            </div>
            
            <div className="hidden md:block">
              <h1 className="text-2xl font-semibold text-gray-800">College Community Portal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications dropdown */}
              <div className="relative" ref={notificationsRef}>
                <button
                  className="p-1 rounded-full text-gray-600 hover:text-primary-600 focus:outline-none"
                  onClick={toggleNotifications}
                >
                  <span className="sr-only">View notifications</span>
                  <div className="relative">
                    <FaBell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
                
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 animate-fade">
                    <div className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 cursor-pointer hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {loading ? (
                        <div className="py-4 px-4 text-center text-gray-500">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-4 px-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`py-3 px-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex space-x-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="py-2 px-4">
                      <Link
                        to="/announcements"
                        className="block text-sm text-center text-primary-600 hover:text-primary-700"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile dropdown replaced with drawer toggle */}
              <div className="relative ml-3">
                <button
                  type="button"
                  className="flex items-center space-x-2 max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setProfileDrawerOpen(true)}
                >
                  <span className="sr-only">Open user menu</span>
                  <FaUserCircle className="h-8 w-8 text-gray-500" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
