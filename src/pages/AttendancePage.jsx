import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaUserCheck, FaChartBar, FaClipboard } from 'react-icons/fa'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AttendancePage() {
  const { user, isStudent, isFaculty } = useAuth()
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState(null)
  const [activeTab, setActiveTab] = useState(isFaculty ? 'take' : 'view')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [students, setStudents] = useState([])

  // Simulated classes data - in production, fetch from API
  const classes = [
    { id: 'cs101', name: 'Introduction to Computer Science' },
    { id: 'math201', name: 'Advanced Mathematics' },
    { id: 'phys101', name: 'Physics I' },
  ]

  // Simulated student data - in production, fetch from API
  const mockStudents = [
    { id: 1, name: 'John Smith', present: false },
    { id: 2, name: 'Maria Rodriguez', present: false },
    { id: 3, name: 'David Johnson', present: false },
    { id: 4, name: 'Sarah Williams', present: false },
    { id: 5, name: 'Michael Brown', present: false },
  ]

  // Simulated attendance data - in production, fetch from API
  const mockAttendanceData = {
    labels: ['CS101', 'MATH201', 'PHYS101', 'ENG102', 'CHEM101'],
    datasets: [
      {
        label: 'Attendance Percentage',
        data: [92, 86, 95, 88, 90],
        backgroundColor: '#4F46E5',
        borderRadius: 6,
      },
    ],
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: isStudent ? 'Your Attendance by Subject' : 'Class Attendance Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        }
      }
    }
  }

  useEffect(() => {
    // Simulate API data loading
    setTimeout(() => {
      setAttendanceData(mockAttendanceData)
      setStudents(mockStudents)
      setLoading(false)
    }, 1000)
  }, [])

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  const toggleStudentPresence = (studentId) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? {...student, present: !student.present} 
        : student
    ))
  }

  const handleSubmitAttendance = () => {
    // In production, send API request to save attendance
    alert('Attendance submitted successfully!')
    // Reset form
    setStudents(students.map(student => ({...student, present: false})))
    setSelectedClass('')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600 mt-1">
          {isStudent 
            ? 'Track your attendance records across subjects' 
            : 'Manage student attendance and view statistics'}
        </p>
      </div>

      {/* Tabs for faculty only */}
      {isFaculty && (
        <div className="mb-6">
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setActiveTab('take')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'take'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-500 hover:text-primary-600'
              }`}
            >
              <div className="flex items-center">
                <FaUserCheck className="mr-2" />
                Take Attendance
              </div>
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'view'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-500 hover:text-primary-600'
              }`}
            >
              <div className="flex items-center">
                <FaChartBar className="mr-2" />
                View Analysis
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Take Attendance Form - faculty only */}
      {isFaculty && activeTab === 'take' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Take Attendance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="class" className="form-label">Select Class</label>
              <select
                id="class"
                name="class"
                className="input-field"
                value={selectedClass}
                onChange={handleClassChange}
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="date" className="form-label">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                className="input-field"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
          </div>
          
          {selectedClass && (
            <>
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-900 mb-2">Student List</h3>
                <div className="bg-gray-50 rounded-md border border-gray-200">
                  {students.map((student) => (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0"
                    >
                      <div>{student.name}</div>
                      <div>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-primary-700 rounded"
                            checked={student.present}
                            onChange={() => toggleStudentPresence(student.id)}
                          />
                          <span className="ml-2 text-sm text-gray-700">Present</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitAttendance}
                >
                  Submit Attendance
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Attendance Analysis */}
      {(isStudent || activeTab === 'view') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6 animate-fade">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h2>
            <div className="h-80">
              <Bar data={attendanceData} options={chartOptions} />
            </div>
          </div>
          
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6 animate-fade">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-md p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <FaChartBar className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-800 font-medium">Overall Attendance</div>
                    <div className="text-lg font-bold text-blue-900">92.5%</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-md p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <FaClipboard className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <div className="text-sm text-green-800 font-medium">Classes Attended</div>
                    <div className="text-lg font-bold text-green-900">147 / 155</div>
                  </div>
                </div>
              </div>
              
              {isStudent && (
                <div className="p-4 border border-yellow-300 rounded-md bg-yellow-50">
                  <p className="text-yellow-800 text-sm font-medium">Attendance Alert</p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Your attendance in Physics I is 75%. Minimum required is 80%.
                  </p>
                </div>
              )}
              
              {isFaculty && (
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Class Insights</h3>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">• Introduction to Computer Science has the highest attendance rate (92%).</p>
                    <p className="mb-2">• 3 students have attendance below 80% in Advanced Mathematics.</p>
                    <p>• Overall attendance has improved by 5% compared to last semester.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}