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
  FaRegThumbsUp
} from 'react-icons/fa'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showComments, setShowComments] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Simulate API call to fetch announcements
    setTimeout(() => {
      setAnnouncements([
        {
          id: 1,
          authorName: 'Dean Williams',
          authorRole: 'Faculty',
          content: 'Important announcement: Campus will be closed this Friday for maintenance. All classes are moved online.',
          timestamp: '5 hours ago',
          likes: 42,
          comments: [
            { id: 1, author: 'John Smith', content: 'Will there be access to the library?', timestamp: '4 hours ago' },
            { id: 2, author: 'Maria Rodriguez', content: 'Thanks for the update!', timestamp: '3 hours ago' },
          ],
          shares: 12,
          isLiked: false,
          isBookmarked: false,
          media: null
        },
        {
          id: 2,
          authorName: 'Student Council',
          authorRole: 'Organization',
          content: 'Don\'t miss our annual cultural festival next week! Performances, food stalls, and many exciting events await. Check out the poster for more details.',
          timestamp: '1 day ago',
          likes: 87,
          comments: [
            { id: 1, author: 'David Johnson', content: 'Looking forward to this!', timestamp: '20 hours ago' },
          ],
          shares: 31,
          isLiked: true,
          isBookmarked: true,
          media: {
            type: 'image',
            url: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg'
          }
        },
        {
          id: 3,
          authorName: 'Prof. Robert Chen',
          authorRole: 'Faculty',
          content: 'Reminder: Research paper submissions are due this Friday. Please follow the formatting guidelines shared in class.',
          timestamp: '2 days ago',
          likes: 15,
          comments: [],
          shares: 5,
          isLiked: false,
          isBookmarked: false,
          media: null
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleNewAnnouncementChange = (e) => {
    setNewAnnouncement(e.target.value)
  }

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.trim() && selectedFiles.length === 0) return
    
    // In production, send to server
    const newPost = {
      id: Date.now(),
      authorName: `${user.firstName} ${user.lastName}`,
      authorRole: user.role === 'faculty' ? 'Faculty' : 'Student',
      content: newAnnouncement,
      timestamp: 'Just now',
      likes: 0,
      comments: [],
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      media: selectedFiles.length > 0 ? {
        type: selectedFiles[0].type.includes('image') ? 'image' : 'video',
        url: URL.createObjectURL(selectedFiles[0]) // This would be a server URL in production
      } : null
    }
    
    setAnnouncements([newPost, ...announcements])
    setNewAnnouncement('')
    setSelectedFiles([])
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

  const addComment = (id, commentText) => {
    if (!commentText.trim()) return
    
    setAnnouncements(announcements.map(announcement => {
      if (announcement.id === id) {
        const newComment = {
          id: Date.now(),
          author: `${user.firstName} ${user.lastName}`,
          content: commentText,
          timestamp: 'Just now'
        }
        
        return {
          ...announcement,
          comments: [...announcement.comments, newComment]
        }
      }
      return announcement
    }))
    
    // Clear comment input
    document.getElementById(`comment-input-${id}`).value = ''
  }

  const handleShare = (id) => {
    // In production, implement sharing functionality
    alert(`Sharing announcement #${id}`)
  }

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
              {user?.firstName?.[0]}{user?.lastName?.[0]}
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
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
              >
                <FaEllipsisH />
              </button>
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
                    className="w-full h-auto object-cover max-h-96" 
                  />
                ) : (
                  <video 
                    src={announcement.media.url} 
                    controls 
                    className="w-full" 
                  ></video>
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
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
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