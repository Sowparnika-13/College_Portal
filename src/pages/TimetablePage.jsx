import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaClock, FaFileUpload, FaDownload, FaEye, FaTrash, FaCalendarWeek } from 'react-icons/fa'

export default function TimetablePage() {
  const { isFaculty } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [timetables, setTimetables] = useState([])
  const [currentView, setCurrentView] = useState('list') // 'list' or 'weekly'

  // Weekly schedule data (simulated)
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
  
  const weeklySchedule = {
    'Monday': [
      { time: '9:00 AM', subject: 'CS101', room: 'Hall A', duration: 1 },
      { time: '11:00 AM', subject: 'MATH201', room: 'Room 105', duration: 2 },
      { time: '2:00 PM', subject: 'ENG102', room: 'Room 210', duration: 1 },
    ],
    'Tuesday': [
      { time: '10:00 AM', subject: 'PHYS101', room: 'Lab 3', duration: 2 },
      { time: '1:00 PM', subject: 'CHEM101', room: 'Lab 1', duration: 2 },
    ],
    'Wednesday': [
      { time: '9:00 AM', subject: 'CS101', room: 'Hall A', duration: 1 },
      { time: '1:00 PM', subject: 'MATH201', room: 'Room 105', duration: 2 },
    ],
    'Thursday': [
      { time: '11:00 AM', subject: 'PHYS101', room: 'Lab 3', duration: 2 },
      { time: '3:00 PM', subject: 'ENG102', room: 'Room 210', duration: 1 },
    ],
    'Friday': [
      { time: '10:00 AM', subject: 'CHEM101', room: 'Lab 1', duration: 2 },
      { time: '2:00 PM', subject: 'CS101', room: 'Computer Lab', duration: 2 },
    ],
  }

  useEffect(() => {
    // Simulate API call to fetch timetables
    setTimeout(() => {
      setTimetables([
        {
          id: 1,
          title: 'Computer Science - Semester 1 Timetable',
          department: 'Computer Science',
          uploadedBy: 'Prof. Johnson',
          uploadDate: 'July 5, 2025',
          fileUrl: '#',
          fileSize: '1.7 MB'
        },
        {
          id: 2,
          title: 'Engineering - Semester 1 Timetable',
          department: 'Engineering',
          uploadedBy: 'Prof. Smith',
          uploadDate: 'July 3, 2025',
          fileUrl: '#',
          fileSize: '2.1 MB'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0]
      setUploadedFile(file)
    }
  }

  const handleFileUpload = () => {
    if (!uploadedFile) return
    
    // In production, send file to server
    // For demo, we'll just add it to the list
    const newTimetable = {
      id: Date.now(),
      title: uploadedFile.name.replace('.pdf', ''),
      department: 'Your Department',
      uploadedBy: 'Current User',
      uploadDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      fileUrl: '#',
      fileSize: `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
    }
    
    setTimetables([newTimetable, ...timetables])
    setUploadedFile(null)
    
    // Reset file input
    document.getElementById('file-upload').value = ''
  }

  const handleDeleteTimetable = (id) => {
    // In production, send delete request to server
    setTimetables(timetables.filter(tt => tt.id !== id))
  }

  // Determine which time slot a class should appear in
  const getTimeSlotIndex = (classTime) => {
    return timeSlots.findIndex(time => time === classTime)
  }

  // Calculate how many time slots a class spans
  const getClassSpan = (duration) => {
    return duration
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
        <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
        <p className="text-gray-600 mt-1">
          {isFaculty 
            ? 'Upload and manage class schedules' 
            : 'View your class schedule and timetables'}
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className={`btn mr-2 ${
              currentView === 'list' 
                ? 'btn-primary' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <FaFileUpload className="inline mr-2" />
            Document View
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('weekly')}
            className={`btn ${
              currentView === 'weekly' 
                ? 'btn-primary' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <FaCalendarWeek className="inline mr-2" />
            Weekly View
          </button>
        </div>
      </div>
      
      {/* Upload Section - Faculty Only */}
      {isFaculty && currentView === 'list' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileUpload className="mr-2 text-primary-700" />
            Upload Timetable
          </h2>
          
          <div className="mb-4">
            <label className="form-label" htmlFor="file-upload">Select PDF file</label>
            <input
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200"
            />
          </div>
          
          {uploadedFile && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaClock className="text-gray-500 mr-2" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}
          
          <button
            type="button"
            className="btn btn-primary"
            disabled={!uploadedFile}
            onClick={handleFileUpload}
          >
            Upload Timetable
          </button>
        </div>
      )}
      
      {/* Timetable Documents List View */}
      {currentView === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaClock className="mr-2 text-primary-700" />
              Timetable Documents
            </h2>
          </div>
          
          {timetables.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No timetables available
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {timetables.map((timetable) => (
                <div key={timetable.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-gray-900">{timetable.title}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>{timetable.department}</span>
                        <span className="mx-2">•</span>
                        <span>By {timetable.uploadedBy}</span>
                        <span className="mx-2">•</span>
                        <span>{timetable.uploadDate}</span>
                        <span className="mx-2">•</span>
                        <span>{timetable.fileSize}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="p-2 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50"
                        title="View timetable"
                      >
                        <FaEye />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                        title="Download timetable"
                      >
                        <FaDownload />
                      </button>
                      {isFaculty && (
                        <button
                          type="button"
                          className="p-2 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete timetable"
                          onClick={() => handleDeleteTimetable(timetable.id)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Weekly Schedule View */}
      {currentView === 'weekly' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaCalendarWeek className="mr-2 text-primary-700" />
              Weekly Schedule
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-20 py-3 px-4 border-b border-r border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  {weekDays.map((day) => (
                    <th 
                      key={day} 
                      className="py-3 px-4 border-b border-r border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider last:border-r-0"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, timeIndex) => (
                  <tr key={timeSlot} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-3 px-4 border-r border-gray-200 text-sm text-gray-700">
                      {timeSlot}
                    </td>
                    
                    {weekDays.map((day) => {
                      const classesInSlot = weeklySchedule[day]?.filter(
                        cls => getTimeSlotIndex(cls.time) === timeIndex
                      );
                      
                      // If there's a class starting at this time slot
                      if (classesInSlot && classesInSlot.length > 0) {
                        const currentClass = classesInSlot[0];
                        return (
                          <td
                            key={`${day}-${timeSlot}`}
                            className="py-2 px-3 border-r border-gray-200 last:border-r-0"
                            rowSpan={getClassSpan(currentClass.duration)}
                          >
                            <div className="bg-primary-100 border-l-4 border-primary-700 p-2 rounded-md">
                              <div className="font-medium text-primary-800">{currentClass.subject}</div>
                              <div className="text-xs text-gray-500">
                                <span>{currentClass.room}</span>
                                <span className="mx-1">•</span>
                                <span>{currentClass.time} - {timeSlots[timeIndex + currentClass.duration]}</span>
                              </div>
                            </div>
                          </td>
                        );
                      } 
                      
                      // Check if this cell is part of a multi-hour class from a previous row
                      const isPreviousRowClass = weeklySchedule[day]?.some(cls => {
                        const startIndex = getTimeSlotIndex(cls.time);
                        const endIndex = startIndex + cls.duration - 1;
                        return timeIndex > startIndex && timeIndex <= endIndex;
                      });
                      
                      // If it's not part of a previous row's class span, render an empty cell
                      if (!isPreviousRowClass) {
                        return (
                          <td 
                            key={`${day}-${timeSlot}`} 
                            className="py-2 px-3 border-r border-gray-200 last:border-r-0"
                          >
                            <div className="h-full w-full text-center text-xs text-gray-400">
                              -
                            </div>
                          </td>
                        );
                      }
                      
                      // For cells that are part of a multi-hour class span, return null so they don't render
                      return null;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}