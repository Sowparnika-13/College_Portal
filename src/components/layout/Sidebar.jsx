import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  FaTimes, 
  FaHome, 
  FaCalendarAlt, 
  FaClock, 
  FaChartBar, 
  FaListAlt, 
  FaBullhorn 
} from 'react-icons/fa'

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth()
  
  const navigation = [
    { name: 'Dashboard', icon: FaHome, href: '/' },
    { name: 'Attendance', icon: FaChartBar, href: '/attendance' },
    { name: 'Calendar', icon: FaCalendarAlt, href: '/calendar' },
    { name: 'Timetable', icon: FaClock, href: '/timetable' },
    { name: 'Results', icon: FaListAlt, href: '/results' },
    { name: 'Announcements', icon: FaBullhorn, href: '/announcements' },
  ]

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary-800 transform transition duration-300 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-primary-900">
          <div className="flex-shrink-0 flex items-center">
            <span className="text-xl font-bold text-white">CCP</span>
          </div>
          <button
            type="button"
            className="md:hidden text-white focus:outline-none"
            onClick={() => setOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-4 py-5 border-b border-primary-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-700 flex items-center justify-center text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-primary-300 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 h-0 overflow-y-auto">
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => 
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-900 text-white'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}