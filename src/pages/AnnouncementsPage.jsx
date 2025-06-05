import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { 
  FaThumbsUp, 
  FaComment, 
  FaShare, 
  FaEllipsisH, 
  FaImage, 
  FaVideo,
  FaUserCircle,
  FaPaperPlane,
  FaBookmark,
  FaRegBookmark,
  FaRegThumbsUp,
  FaTrash
} from 'react-icons/fa'
import { supabase } from '../services/supabase'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showComments, setShowComments] = useState({})
  const [showOptions, setShowOptions] = useState({})
  const fileInputRef = useRef(null)
  const optionsRef = useRef({})

  // Upload file to Supabase Storage
  const uploadFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `announcements/${fileName}`

      // First check if file type is supported
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('Unsupported file type')
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large (max 10MB)')
      }

      console.log('Uploading file:', {
        fileName,
        fileType: file.type,
        fileSize: file.size,
        filePath
      })

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          duplex: 'half'
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', data)

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      console.log('Generated public URL:', publicUrl)
      return publicUrl
    } catch (err) {
      console.error('Detailed upload error:', err)
      throw new Error(`Upload failed: ${err.message}`)
    }
  }

  // Insert new announcement into Supabase
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim() && selectedFiles.length === 0) return
    
    try {
      setLoading(true)
      let mediaUrls = []

      // Upload files if any
      if (selectedFiles.length > 0) {
        try {
          console.log('Starting file upload process for:', selectedFiles.map(f => f.name))
          const uploadPromises = selectedFiles.map(file => uploadFile(file))
          mediaUrls = await Promise.all(uploadPromises)
          console.log('Successfully uploaded files:', mediaUrls)
        } catch (error) {
          console.error('Detailed file upload error:', error)
          alert(`Failed to upload media: ${error.message}`)
          setLoading(false)
          return
        }
      }

      // Create the announcement
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .insert({
          content: newAnnouncement,
          user_id: user.id,
          media_url: mediaUrls
        })
        .select('id, content, created_at, user_id, media_url')
        .single()

      if (announcementError) {
        console.error('Announcement creation error:', announcementError)
        throw new Error(`Failed to create announcement: ${announcementError.message}`)
      }

      // Get user info for display
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, role')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('User data fetch error:', userError)
        throw new Error(`Failed to fetch user data: ${userError.message}`)
      }

      // Add the new announcement to state
      const newAnnouncementObj = {
        id: announcement.id,
        authorName: `${userData.first_name} ${userData.last_name}`,
        authorRole: userData.role === 'faculty' ? 'Faculty' : 'Student',
        content: announcement.content,
        timestamp: new Date(announcement.created_at).toLocaleString(),
        likes: 0,
        comments: [],
        shares: 0,
        isLiked: false,
        isBookmarked: false,
        media: announcement.media_url && announcement.media_url.length > 0 ? {
          type: getFileType(announcement.media_url[0]),
          url: announcement.media_url[0]
        } : null
      }

      setAnnouncements([newAnnouncementObj, ...announcements])
      setNewAnnouncement('')
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Detailed announcement creation error:', err)
      alert(`Failed to create announcement: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch announcements and comments from Supabase
  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true)
      try {
        // Fetch announcements with user info
        let { data: announcementsData, error } = await supabase
          .from('announcements')
          .select('id, content, created_at, user_id, media_url, users (first_name, last_name, role)')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch comments for all announcements
        let { data: commentsData } = await supabase
          .from('announcement_comments')
          .select('id, announcement_id, content, created_at, user_id, users (first_name, last_name)')
          .order('created_at', { ascending: true })

        // Map comments to announcements
        const announcementsWithComments = announcementsData.map(a => ({
          id: a.id,
          authorName: `${a.users.first_name} ${a.users.last_name}`,
          authorRole: a.users.role === 'faculty' ? 'Faculty' : 'Student',
          content: a.content,
          timestamp: new Date(a.created_at).toLocaleString(),
          likes: 0, // TODO: fetch likes
          comments: commentsData
            ? commentsData.filter(c => c.announcement_id === a.id).map(c => ({
                id: c.id,
                author: `${c.users.first_name} ${c.users.last_name}`,
                content: c.content,
                timestamp: new Date(c.created_at).toLocaleString(),
              }))
            : [],
          shares: 0,
          isLiked: false,
          isBookmarked: false,
          media: a.media_url && a.media_url.length > 0 ? {
            type: getFileType(a.media_url[0]),
            url: a.media_url[0]
          } : null
        }))

        setAnnouncements(announcementsWithComments)
      } catch (err) {
        console.error('Error fetching announcements:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  // Helper function to determine file type
  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const videoExtensions = ['mp4', 'webm', 'ogg']
    
    if (imageExtensions.includes(extension)) return 'image'
    if (videoExtensions.includes(extension)) return 'video'
    return 'image' // default to image if unknown
  }

  // Handle file selection with validation
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isValid && isValidSize
    })

    if (validFiles.length !== files.length) {
      // You might want to show an error message to the user here
      console.warn('Some files were rejected due to invalid type or size')
    }

    setSelectedFiles(validFiles)
  }

  const handleNewAnnouncementChange = (e) => {
    setNewAnnouncement(e.target.value)
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  // Insert new comment into Supabase
  const addComment = async (id, commentText) => {
    if (!commentText.trim()) return
    const { data, error } = await supabase
      .from('announcement_comments')
      .insert({
        announcement_id: id,
        user_id: user.id,
        content: commentText
      })
      .select('id, content, created_at, user_id')
      .single()
    if (error) return
    // Add comment to state
    setAnnouncements(announcements.map(announcement => {
      if (announcement.id === id) {
        return {
          ...announcement,
          comments: [
            ...announcement.comments,
            {
              id: data.id,
              author: `${user.first_name} ${user.last_name}`,
              content: data.content,
              timestamp: new Date(data.created_at).toLocaleString(),
            }
          ]
        }
      }
      return announcement
    }))
    // Clear comment input
    document.getElementById(`comment-input-${id}`).value = ''
  }

  const toggleLike = (id) => {
    setAnnouncements(announcements.map(announcement => {
      if (announcement.id === id) {
        const isLiked = !announcement.isLiked
        return {
          ...announcement,
          isLiked,
          likes: isLiked ? announcement.likes + 1 : announcement.likes - 1
        }
      }
      return announcement
    }))
  }

  const toggleBookmark = (id) => {
    setAnnouncements(announcements.map(announcement => {
      if (announcement.id === id) {
        return {
          ...announcement,
          isBookmarked: !announcement.isBookmarked
        }
      }
      return announcement
    }))
  }

  const toggleComments = (id) => {
    setShowComments({
      ...showComments,
      [id]: !showComments[id]
    })
  }

  const handleShare = (id) => {
    // In production, implement sharing functionality
    alert(`Sharing announcement #${id}`)
  }

  // Handle delete announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      setLoading(true)

      // First, delete any associated media from storage
      const announcement = announcements.find(a => a.id === id)
      if (announcement?.media?.url) {
        const mediaPath = announcement.media.url.split('/').pop() // Get filename from URL
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([`announcements/${mediaPath}`])

        if (storageError) {
          console.error('Error deleting media:', storageError)
        }
      }

      // Delete the announcement from the database
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== id))
      setShowOptions({})
    } catch (err) {
      console.error('Error deleting announcement:', err)
      alert('Failed to delete announcement. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle options menu
  const toggleOptions = (id) => {
    setShowOptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.entries(optionsRef.current).forEach(([id, ref]) => {
        if (ref && !ref.contains(event.target)) {
          setShowOptions(prev => ({
            ...prev,
            [id]: false
          }))
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with the latest campus news and events
        </p>
      </div>
      
      {/* Create Announcement */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-fade">
        <div className="flex items-start">
          <div className="mr-3">
            <div className="h-10 w-10 rounded-full bg-primary-700 flex items-center justify-center text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
          <div className="flex-1">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              rows="3"
              placeholder="Share an announcement with the community..."
              value={newAnnouncement}
              onChange={handleNewAnnouncementChange}
            ></textarea>
            
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedFiles[0].type.includes('image') ? (
                      <FaImage className="text-gray-500 mr-2" />
                    ) : (
                      <FaVideo className="text-gray-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-600">{selectedFiles[0].name}</span>
                  </div>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setSelectedFiles([])}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="flex items-center text-sm text-gray-600 hover:text-primary-700"
                  onClick={triggerFileInput}
                >
                  <FaImage className="mr-1" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  className="flex items-center text-sm text-gray-600 hover:text-primary-700"
                  onClick={triggerFileInput}
                >
                  <FaVideo className="mr-1" />
                  <span>Video</span>
                </button>
                <input
                  type="file"
                  id="file-input"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!newAnnouncement.trim() && selectedFiles.length === 0}
                onClick={handleCreateAnnouncement}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-lg shadow-md p-4 animate-fade">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <FaUserCircle className="h-10 w-10 text-gray-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">{announcement.authorName}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="capitalize">{announcement.authorRole}</span>
                    <span className="mx-1">•</span>
                    <span>{announcement.timestamp}</span>
                  </div>
                </div>
              </div>
              <div className="relative" ref={el => optionsRef.current[announcement.id] = el}>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 p-1"
                  onClick={() => toggleOptions(announcement.id)}
                >
                  <FaEllipsisH />
                </button>
                {showOptions[announcement.id] && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1">
                    {(user.id === announcement.user_id || user.role === 'faculty') && (
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FaTrash className="mr-2" />
                        Delete Announcement
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Post Content */}
            <div className="mb-3">
              <p className="text-gray-800 whitespace-pre-wrap">{announcement.content}</p>
            </div>
            
            {/* Post Media */}
            {announcement.media && (
              <div className="mb-3 rounded-lg overflow-hidden">
                {announcement.media.type === 'image' ? (
                  <img 
                    src={announcement.media.url} 
                    alt="Announcement" 
                    className="w-full h-auto object-contain max-h-[500px]" 
                    loading="lazy"
                  />
                ) : (
                  <video 
                    src={announcement.media.url} 
                    controls 
                    className="w-full max-h-[500px]" 
                  />
                )}
              </div>
            )}
            
            {/* Post Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div>
                {announcement.likes > 0 && (
                  <span>{announcement.likes} likes</span>
                )}
              </div>
              <div className="flex space-x-4">
                {announcement.comments.length > 0 && (
                  <span>{announcement.comments.length} comments</span>
                )}
                {announcement.shares > 0 && (
                  <span>{announcement.shares} shares</span>
                )}
              </div>
            </div>
            
            {/* Post Actions */}
            <div className="flex items-center justify-between border-t border-b border-gray-200 py-2 mb-3">
              <button
                type="button"
                className={`flex items-center px-2 py-1 rounded-md ${
                  announcement.isLiked 
                    ? 'text-primary-700 hover:bg-primary-50' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => toggleLike(announcement.id)}
              >
                {announcement.isLiked ? (
                  <FaThumbsUp className="mr-1" />
                ) : (
                  <FaRegThumbsUp className="mr-1" />
                )}
                <span>Like</span>
              </button>
              
              <button
                type="button"
                className="flex items-center px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => toggleComments(announcement.id)}
              >
                <FaComment className="mr-1" />
                <span>Comment</span>
              </button>
              
              <button
                type="button"
                className="flex items-center px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => handleShare(announcement.id)}
              >
                <FaShare className="mr-1" />
                <span>Share</span>
              </button>
              
              <button
                type="button"
                className={`flex items-center px-2 py-1 rounded-md ${
                  announcement.isBookmarked 
                    ? 'text-primary-700 hover:bg-primary-50' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => toggleBookmark(announcement.id)}
              >
                {announcement.isBookmarked ? (
                  <FaBookmark className="mr-1" />
                ) : (
                  <FaRegBookmark className="mr-1" />
                )}
                <span>Save</span>
              </button>
            </div>
            
            {/* Comments Section */}
            {(showComments[announcement.id] || announcement.comments.length > 0) && (
              <div className="animate-fade">
                {/* Existing Comments */}
                {announcement.comments.length > 0 && (
                  <div className="mb-3 space-y-3">
                    {announcement.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start bg-gray-50 p-3 rounded-lg">
                        <FaUserCircle className="h-8 w-8 text-gray-500 mr-2" />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{comment.author}</div>
                          <div className="text-sm text-gray-800">{comment.content}</div>
                          <div className="text-xs text-gray-500 mt-1">{comment.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment */}
                <div className="flex items-center">
                  <div className="mr-2">
                    <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      id={`comment-input-${announcement.id}`}
                      type="text"
                      className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      placeholder="Write a comment..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addComment(announcement.id, e.target.value)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-700"
                      onClick={() => {
                        const commentText = document.getElementById(`comment-input-${announcement.id}`).value
                        addComment(announcement.id, commentText)
                      }}
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
