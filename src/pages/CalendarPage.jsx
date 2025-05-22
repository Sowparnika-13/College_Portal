import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaCalendarAlt, FaFileUpload, FaDownload, FaEye, FaTrash } from 'react-icons/fa'

export default function CalendarPage() {
  const { isFaculty } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    // Simulate API call to fetch documents
    setTimeout(() => {
      setDocuments([
        {
          id: 1,
          title: 'Academic Calendar 2025-2026',
          uploadedBy: 'Dean Williams',
          uploadDate: 'June 15, 2025',
          fileUrl: '#',
          fileSize: '2.4 MB'
        },
        {
          id: 2,
          title: 'Exam Schedule - Spring 2025',
          uploadedBy: 'Academic Office',
          uploadDate: 'May 20, 2025',
          fileUrl: '#',
          fileSize: '1.8 MB'
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
    const newDocument = {
      id: Date.now(),
      title: uploadedFile.name.replace('.pdf', ''),
      uploadedBy: 'Current User',
      uploadDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      fileUrl: '#',
      fileSize: `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
    }
    
    setDocuments([newDocument, ...documents])
    setUploadedFile(null)
    
    // Reset file input
    document.getElementById('file-upload').value = ''
  }

  const handleDeleteDocument = (id) => {
    // In production, send delete request to server
    setDocuments(documents.filter(doc => doc.id !== id))
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
        <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
        <p className="text-gray-600 mt-1">
          {isFaculty 
            ? 'Upload and manage academic calendars and schedules' 
            : 'View academic calendars and important dates'}
        </p>
      </div>
      
      {/* Upload Section - Faculty Only */}
      {isFaculty && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileUpload className="mr-2 text-primary-700" />
            Upload Calendar Document
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
                  <FaCalendarAlt className="text-gray-500 mr-2" />
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
            Upload Document
          </button>
        </div>
      )}
      
      {/* Document List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaCalendarAlt className="mr-2 text-primary-700" />
            Academic Documents
          </h2>
        </div>
        
        {documents.length === 0 ? (
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
                      <span className="mx-2">•</span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="p-2 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50"
                      title="View document"
                    >
                      <FaEye />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                      title="Download document"
                    >
                      <FaDownload />
                    </button>
                    {isFaculty && (
                      <button
                        type="button"
                        className="p-2 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete document"
                        onClick={() => handleDeleteDocument(doc.id)}
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