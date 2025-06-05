import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaFileUpload, FaDownload, FaEye, FaTrash, FaListAlt, FaCloudUploadAlt, FaSearch, FaFilter } from 'react-icons/fa'

export default function ResultsPage() {
  const { user, isStudent, isFaculty } = useAuth()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Fetch all result documents
  const fetchResults = async () => {
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
        .eq('type', 'result')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedResults = data.map(result => ({
        id: result.id,
        title: result.title,
        uploadedBy: result.users ? 
          `${result.users.first_name || ''} ${result.users.last_name || ''}`.trim() : 
          'Unknown',
        uploadDate: new Date(result.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        fileUrl: result.file_url
      }))

      setResults(formattedResults)
    } catch (err) {
      console.error('Error fetching results:', err)
      setError('Failed to fetch results: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchResults()
  }, [])

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    validateAndSetFile(file)
  }

  const validateAndSetFile = (file) => {
    setError(null)
    
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

  const handleFileChange = (e) => {
      const file = e.target.files[0]
    validateAndSetFile(file)
  }

  const handleFileUpload = async () => {
    if (!uploadedFile || !user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      setUploadProgress(0)

      // 1. Create a unique file name
      const fileExt = uploadedFile.name.split('.').pop()
      const fileName = `result_${Date.now()}.${fileExt}`
      const filePath = `results/${fileName}`

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
          type: 'result',
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

      // Refresh results list
      await fetchResults()

    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResult = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result?')) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Starting result deletion process...', { id })

      // 1. Get the document details first to ensure it exists and we have permission
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_url, uploaded_by')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error('Failed to fetch document details: ' + fetchError.message)
      }

      if (!document) {
        throw new Error('Document not found')
      }

      console.log('Document found:', document)

      // 2. Delete from storage if URL exists
      if (document.file_url) {
        // Extract the path after /documents/
        const fullPath = new URL(document.file_url).pathname
        const storagePath = fullPath.split('/documents/')[1]
        
        if (!storagePath) {
          console.error('Invalid file path:', document.file_url)
          throw new Error('Invalid file path')
        }
        
        console.log('Deleting file from storage:', storagePath)
        
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([storagePath])

        if (storageError) {
          console.error('Storage deletion error:', storageError)
          throw new Error('Failed to delete file: ' + storageError.message)
        }

        console.log('File deleted from storage successfully')
      }

      // 3. Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        throw new Error('Failed to delete document record: ' + dbError.message)
      }

      console.log('Document deleted from database successfully')
      setResults(prev => prev.filter(result => result.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete result: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort results
  const filteredResults = results
    .filter(result => 
      result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.uploadDate) - new Date(a.uploadDate)
      } else if (sortOrder === 'oldest') {
        return new Date(a.uploadDate) - new Date(b.uploadDate)
      } else if (sortOrder === 'name') {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

  if (loading && results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Examination Results</h1>
        <p className="text-gray-600 mt-1">
          {isFaculty 
            ? 'Upload and manage student examination results' 
            : 'View your examination results'}
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Upload Section - Faculty Only */}
      {isFaculty && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileUpload className="mr-2 text-primary-700" />
            Upload Result Document
          </h2>
          
          <div 
            className={`mb-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
            
            <label htmlFor="file-upload" className="cursor-pointer">
              <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your PDF file here, or{' '}
                <span className="text-primary-600 hover:text-primary-500">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Maximum file size: 10MB
              </p>
            </label>
          </div>
          
          {uploadedFile && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-md">
                    <FaFileUpload className="text-primary-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{uploadedFile.name}</h3>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-red-500"
                  onClick={() => {
                    setUploadedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  <FaTrash />
                </button>
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            type="button"
            className={`btn btn-primary w-full sm:w-auto
              ${!uploadedFile || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'}`}
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
      
      {/* Results List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaListAlt className="mr-2 text-primary-700" />
              Available Results
          </h2>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-md"
                >
                  <FaFilter />
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="p-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Sort by</h3>
                      <div className="space-y-1">
                        {[
                          { value: 'newest', label: 'Newest first' },
                          { value: 'oldest', label: 'Oldest first' },
                          { value: 'name', label: 'Name' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left px-3 py-1 text-sm rounded-md
                              ${sortOrder === option.value 
                                ? 'bg-primary-50 text-primary-700' 
                                : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => {
                              setSortOrder(option.value)
                              setIsFilterOpen(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {filteredResults.length === 0 ? (
          <div className="p-6 text-center">
            {searchTerm ? (
              <div className="text-gray-500">
                <p className="text-lg font-medium">No matching results</p>
                <p className="text-sm mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="text-lg font-medium">No result documents available</p>
                {isFaculty && (
                  <p className="text-sm mt-1">Upload your first result document above</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredResults.map((result) => (
              <div 
                key={result.id} 
                className="p-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-md font-medium text-gray-900 truncate">
                      {result.title}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="truncate">Uploaded by {result.uploadedBy}</span>
                      <span className="mx-2">•</span>
                      <span className="whitespace-nowrap">{result.uploadDate}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    <a
                      href={result.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50"
                      title="View document"
                    >
                      <FaEye />
                    </a>
                    <a
                      href={result.fileUrl}
                      download
                      className="p-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                      title="Download document"
                    >
                      <FaDownload />
                    </a>
                    {isFaculty && (
                      <button
                        type="button"
                        className="p-2 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete document"
                        onClick={() => handleDeleteResult(result.id)}
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
