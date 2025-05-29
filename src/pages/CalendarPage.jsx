import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaCalendarAlt, FaFileUpload, FaDownload, FaEye, FaTrash } from 'react-icons/fa'

export default function CalendarPage() {
  const { user } = useAuth()  // Get the authenticated user
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Fetch documents from Supabase
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching documents...')
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          file_url,
          created_at,
          uploaded_by,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('type', 'calendar')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Documents fetched:', data)

      const enriched = data.map((doc) => {
        return {
          id: doc.id,
          title: doc.title,
          uploadedBy: doc.users ? 
            `${doc.users.first_name || ''} ${doc.users.last_name || ''}`.trim() || doc.users.email : 
            'Unknown',
          uploadDate: new Date(doc.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          fileUrl: doc.file_url,
          fileSize: 'Unknown'
        }
      })
      
      setDocuments(enriched)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to fetch documents: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

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
      e.target.value = ''
      setUploadedFile(null)
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      e.target.value = ''
      setUploadedFile(null)
      return
    }

    console.log('File selected:', file.name)
    setUploadedFile(file)
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) return

    // Check if user is authenticated
    if (!user?.id) {
      setError('You must be logged in to upload documents')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setUploadProgress(0)
      console.log('Starting file upload...', { userId: user.id })

      // 1. Create a unique file name
      const fileExt = uploadedFile.name.split('.').pop()
      const fileName = `calendar_${Date.now()}.${fileExt}`
      const filePath = `calendars/${fileName}`

      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percent))
            console.log('Upload progress:', Math.round(percent) + '%')
          }
        })

      if (uploadError) {
        throw new Error('Upload failed: ' + uploadError.message)
      }

      console.log('File uploaded successfully')

      // 3. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      const fileUrl = publicUrlData.publicUrl
      console.log('File URL generated:', fileUrl)

      // 4. Insert document metadata into DB
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: uploadedFile.name.replace(/\.pdf$/i, ''),
          type: 'calendar',
          file_url: fileUrl,
          uploaded_by: user.id  // Use the authenticated user's ID directly
        })

      if (insertError) {
        // If metadata insert fails, clean up the uploaded file
        await supabase.storage.from('documents').remove([filePath])
        throw new Error('Failed to save document metadata: ' + insertError.message)
      }

      console.log('Document metadata saved successfully')
      
      // Reset form
      setUploadedFile(null)
      setUploadProgress(0)
      document.getElementById('file-upload').value = ''
      
      // Refresh document list
      await fetchDocuments()
      
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (id, fileUrl) => {
    try {
      setLoading(true)
      setError(null)

      // Extract file path from URL
      const filePath = fileUrl.split('/').pop()
      const storagePath = `calendars/${filePath}`

      console.log('Deleting document:', { id, storagePath })

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([storagePath])

      if (storageError) {
        throw new Error('Failed to delete file: ' + storageError.message)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (dbError) {
        throw new Error('Failed to delete document record: ' + dbError.message)
      }

      console.log('Document deleted successfully')
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
        <p className="text-gray-600 mt-1">
          {user ? (
            'Upload and manage academic calendars and schedules'
          ) : (
            'View academic calendars and important dates'
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Upload Section - Faculty Only */}
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileUpload className="mr-2 text-primary-700" />
            Upload Calendar Document
          </h2>

          <div className="mb-4">
            <label className="form-label" htmlFor="file-upload">
              Select PDF file (Max 10MB)
            </label>
            <input
              type="file"
              id="file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {uploadedFile && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-500 mr-2" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</span>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            disabled={!uploadedFile || loading}
            onClick={handleFileUpload}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Uploading...</span>
              </span>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaCalendarAlt className="mr-2 text-primary-700" />
            Available Documents
          </h2>
        </div>

        {loading && documents.length === 0 ? (
          <div className="p-6 text-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No documents available
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">{doc.title}</h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>Uploaded by {doc.uploadedBy}</span>
                      <span className="mx-2">•</span>
                      <span>{doc.uploadDate}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50"
                      title="View document"
                    >
                      <FaEye />
                    </a>
                    <a
                      href={doc.fileUrl}
                      download
                      className="p-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                      title="Download document"
                    >
                      <FaDownload />
                    </a>
                    {user && (
                      <button
                        type="button"
                        className="p-2 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete document"
                        onClick={() => handleDeleteDocument(doc.id, doc.fileUrl)}
                        disabled={loading}
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
    </div>
  )
}
