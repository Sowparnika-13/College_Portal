import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaChartBar,
  FaCalendarAlt,
  FaClock,
  FaListAlt,
  FaBullhorn,
  FaUserGraduate,
  FaChalkboardTeacher,
} from 'react-icons/fa';

import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const { user, isStudent, isFaculty } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Log user to debug
  console.log('Dashboard user:', user);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <div>Loading user data...</div>;
  }

  // Dashboard cards
  const dashboardItems = [
    {
      id: 'attendance',
      name: 'Attendance',
      icon: FaChartBar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      link: '/attendance',
      description: isStudent
        ? 'View your attendance records'
        : 'Take attendance and view records',
    },
    {
      id: 'calendar',
      name: 'Academic Calendar',
      icon: FaCalendarAlt,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      link: '/calendar',
      description: isStudent ? 'View academic calendar' : 'Manage academic calendar',
    },
    {
      id: 'timetable',
      name: 'Timetable',
      icon: FaClock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      link: '/timetable',
      description: isStudent ? 'Check your class schedule' : 'Manage class schedules',
    },
    {
      id: 'results',
      name: 'Results',
      icon: FaListAlt,
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      link: '/results',
      description: isStudent ? 'View your exam results' : 'Manage student results',
    },
    {
      id: 'announcements',
      name: 'Announcements',
      icon: FaBullhorn,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100',
      link: '/announcements',
      description: 'Community announcements and updates',
    },
  ];

  // Sample recent announcements (could come from API)
  const recentAnnouncements = [
    {
      id: 1,
      title: 'Campus Tour Schedule',
      preview: 'New students campus tour scheduled for next Friday at 10 AM.',
      date: 'July 15, 2025',
      author: 'Dean Williams',
    },
    {
      id: 2,
      title: 'Upcoming Exams',
      preview: 'Final exams schedule has been published. Check your timetable.',
      date: 'July 10, 2025',
      author: 'Academic Office',
    },
  ];

  return (
    <div className="animate-fade">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.first_name}!</h1>
        <p className="text-gray-600 mt-1">Here's an overview of your campus activities</p>
      </div>

      {/* Role Badge */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isStudent ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}
        >
          {isStudent ? (
            <>
              <FaUserGraduate className="mr-1 h-4 w-4" />
              Student
            </>
          ) : (
            <>
              <FaChalkboardTeacher className="mr-1 h-4 w-4" />
              Faculty
            </>
          )}
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardItems.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            className="dashboard-card hover:translate-y-[-4px]"
          >
            <div
              className={`rounded-full w-12 h-12 ${item.bgColor} flex items-center justify-center mb-4`}
            >
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Announcements */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Announcements</h2>
          <Link to="/announcements" className="text-sm text-primary-700 hover:text-primary-800">
            View all
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          {recentAnnouncements.length > 0 ? (
            recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <h3 className="text-md font-medium text-gray-900 mb-1">{announcement.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{announcement.preview}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{announcement.date}</span>
                  <span>By {announcement.author}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-600">No announcements at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
}
