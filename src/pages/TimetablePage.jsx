import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaClock, FaFileUpload, FaDownload, FaEye, FaTrash, FaCalendarWeek, FaMapMarkerAlt, FaClock as FaClockAlt, FaUser } from 'react-icons/fa'

export default function TimetablePage() {
  const { user, isFaculty } = useAuth()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [timetables, setTimetables] = useState([])
  const [currentView, setCurrentView] = useState('weekly')
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [weeklySchedule, setWeeklySchedule] = useState({})
  const [subjects, setSubjects] = useState([])

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

  // Debug user role
  useEffect(() => {
    console.log('Current user:', user)
    console.log('Is faculty:', isFaculty)
  }, [user, isFaculty])

  // Get color scheme for subject cards
  const getSubjectColor = (subjectCode) => {
    const colors = {
      'ST': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
      'MAD': { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
      'MADL': { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
      'ML': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
      'ECD': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' }
    }
    
    const prefix = subjectCode?.substring(0, subjectCode.length - 3)
    return colors[prefix] || { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' }
  }

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, code')
        .order('code')

      if (error) {
        console.error('Error fetching subjects:', error)
        throw error
      }

      console.log('Fetched subjects:', data)
      setSubjects(data || [])
    } catch (err) {
      console.error('Error in fetchSubjects:', err)
      setError('Failed to fetch subjects: ' + err.message)
    }
  }

  // Fetch weekly schedule
  const fetchWeeklySchedule = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch subjects first
      await fetchSubjects()

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          subject_id,
          day_of_week,
          start_time,
          duration_hours,
          room,
          subject:subjects (
            id,
            name,
            code
          )
        `)
        .order('start_time')

      if (schedulesError) throw schedulesError

      // Organize schedules by day
      const schedulesByDay = weekDays.reduce((acc, day) => {
        const daySchedules = (schedulesData || [])
          .filter(schedule => schedule.day_of_week === day && schedule.subject)
          .map(schedule => ({
            id: schedule.id,
            subject: schedule.subject.code,
            subjectName: schedule.subject.name,
            time: new Date(`2000-01-01T${schedule.start_time}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            }),
            duration: schedule.duration_hours,
            room: schedule.room
          }))
        acc[day] = daySchedules
        return acc
      }, {})

      setWeeklySchedule(schedulesByDay)
    } catch (err) {
      console.error('Error in fetchWeeklySchedule:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts or view changes
  useEffect(() => {
    if (currentView === 'weekly') {
      fetchWeeklySchedule()
    } else {
      fetchTimetables()
    }
  }, [currentView])

  // Add class to schedule
  const handleAddClass = async (formData) => {
    if (!isFaculty || !user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Validate time slot availability
      const { data: existingClasses, error: checkError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('day_of_week', formData.day)
        .eq('start_time', formData.startTime)

      if (checkError) throw checkError

      if (existingClasses && existingClasses.length > 0) {
        setError('This time slot is already occupied')
        return
      }

      const { error: insertError } = await supabase
        .from('class_schedules')
        .insert({
          subject_id: formData.subjectId,
          day_of_week: formData.day,
          start_time: formData.startTime,
          duration_hours: formData.duration,
          room: formData.room
        })

      if (insertError) throw insertError

      // Refresh schedule
      await fetchWeeklySchedule()
    } catch (err) {
      console.error('Error adding class:', err)
      setError('Failed to add class: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete class from schedule (faculty only)
  const handleDeleteClass = async (classId) => {
    if (!isFaculty || !user?.id) return

    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', classId)

      if (deleteError) throw deleteError

      // Refresh schedule
      await fetchWeeklySchedule()
    } catch (err) {
      console.error('Error deleting class:', err)
      setError('Failed to delete class: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch timetable documents
  const fetchTimetables = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          file_url,
          created_at,
          uploaded_by,
          users (
            first_name,
            last_name
          )
        `)
        .eq('type', 'timetable')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedTimetables = data.map(timetable => ({
        id: timetable.id,
        title: timetable.title,
        uploadedBy: timetable.users ? 
          `${timetable.users.first_name || ''} ${timetable.users.last_name || ''}`.trim() : 
          'Unknown',
        uploadDate: new Date(timetable.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
        fileUrl: timetable.file_url
      }))

      setTimetables(formattedTimetables)
    } catch (err) {
      console.error('Error fetching timetables:', err)
      setError('Failed to fetch timetables: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    setError(null)
    const file = e.target.files[0]
    
    if (!file) {
      setUploadedFile(null)
      return
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      setError('Only PDF files are allowed')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setUploadedFile(null)
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    setUploadedFile(null)
      return
    }

    setUploadedFile(file)
  }

  const handleFileUpload = async () => {
    if (!uploadedFile || !user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      setUploadProgress(0)

      // 1. Create a unique file name
      const fileExt = uploadedFile.name.split('.').pop()
      const fileName = `timetable_${Date.now()}.${fileExt}`
      const filePath = `timetables/${fileName}`

      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percent))
          }
        })

      if (uploadError) throw uploadError

      // 3. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // 4. Save to database
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: uploadedFile.name.replace(/\.pdf$/i, ''),
          type: 'timetable',
          file_url: publicUrlData.publicUrl,
          uploaded_by: user.id
        })

      if (insertError) {
        // If database insert fails, clean up the uploaded file
        await supabase.storage.from('documents').remove([filePath])
        throw insertError
      }

      // Reset form
      setUploadedFile(null)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh timetables list
      await fetchTimetables()

    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTimetable = async (id) => {
    if (!id || !user?.id || !isFaculty) return

    try {
      setLoading(true)
      setError(null)

      // 1. Get the timetable to find the file URL
      const { data: timetable, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // 2. Delete from storage if URL exists
      if (timetable?.file_url) {
        const filePath = timetable.file_url.split('/').pop()
        const storagePath = `timetables/${filePath}`
        
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([storagePath])

        if (storageError) throw storageError
      }

      // 3. Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // 4. Update UI
      setTimetables(prev => prev.filter(tt => tt.id !== id))

    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete timetable: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format time
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  // Render schedule card
  const renderScheduleCard = (cls) => {
    const colors = getSubjectColor(cls.subject)
    return (
      <div
        key={cls.id}
        className={`${colors.bg} ${colors.border} border rounded-md p-3 mb-3 hover:shadow-sm transition-shadow`}
      >
        <div className={`font-medium ${colors.text} text-sm mb-1.5`}>
          {cls.subject}
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <FaClock className="mr-1.5" size={10} />
            {cls.time} • {cls.duration}h
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <FaMapMarkerAlt className="mr-1.5" size={10} />
            {cls.room}
          </div>
        </div>
      </div>
    )
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
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          <FaCalendarWeek className="mr-2" />
          Weekly Class Schedule
        </h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          <p className="font-medium">Error loading schedule</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {weekDays.map((day) => (
          <div key={day} className="bg-white rounded-md shadow-sm">
            <div className="text-sm font-medium text-gray-900 p-3 border-b bg-gray-50">
              {day}
            </div>
            <div className="p-3">
              {weeklySchedule[day]?.length > 0 ? (
                weeklySchedule[day].map(cls => renderScheduleCard(cls))
              ) : (
                <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-200 rounded-md">
                  No classes scheduled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isFaculty && (
        <div className="mt-6 bg-white rounded-md shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Add New Class</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = {
              subjectId: e.target.subject.value,
              day: e.target.day.value,
              startTime: e.target.startTime.value,
              duration: parseInt(e.target.duration.value),
              room: e.target.room.value
            }
            handleAddClass(formData)
            e.target.reset()
          }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <select
                id="subject"
                name="subject"
                required
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select a subject</option>
                {subjects && subjects.length > 0 ? (
                  subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No subjects available</option>
                )}
              </select>
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>

            <div>
              <label htmlFor="day" className="block text-xs font-medium text-gray-700 mb-1">Day</label>
              <select
                id="day"
                name="day"
                required
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select a day</option>
                {weekDays.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startTime" className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                required
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-xs font-medium text-gray-700 mb-1">Duration (hours)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                min="1"
                max="4"
                required
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="room" className="block text-xs font-medium text-gray-700 mb-1">Room</label>
              <input
                type="text"
                id="room"
                name="room"
                required
                placeholder="e.g., Room 101"
                className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary-600 text-white px-3 py-2 rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Add Class
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
