import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { FaFileUpload, FaDownload, FaEye, FaTrash, FaListAlt, FaGraduationCap } from 'react-icons/fa'

export default function ResultsPage() {
  const { user, isStudent, isFaculty } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [results, setResults] = useState([])
  const [studentResults, setStudentResults] = useState(null)

  // Simulated student results for the current user
  const mockStudentResults = {
    currentSemester: 'Spring 2025',
    gpa: '3.75',
    totalCredits: 75,
    courses: [
      { code: 'CS101', name: 'Introduction to Computer Science', credits: 3, grade: 'A', points: 12 },
      { code: 'MATH201', name: 'Advanced Mathematics', credits: 4, grade: 'A-', points: 14.8 },
      { code: 'PHYS101', name: 'Physics I', credits: 4, grade: 'B+', points: 13.2 },
      { code: 'ENG102', name: 'English Composition', credits: 3, grade: 'A', points: 12 },
      { code: 'CHEM101', name: 'Chemistry I', credits: 4, grade: 'B', points: 12 },
    ]
  }

  useEffect(() => {
    // Simulate API call to fetch results
    setTimeout(() => {
      setResults([
        {
          id: 1,
          title: 'Computer Science - Midterm Results',
          semester: 'Spring 2025',
          uploadedBy: 'Prof. Johnson',
          uploadDate: 'April 15, 2025',
          fileUrl: '#',
          fileSize: '2.3 MB'
        },
        {
          id: 2,
          title: 'Engineering - Final Examination Results',
          semester: 'Fall 2024',
          uploadedBy: 'Academic Office',
          uploadDate: 'December 20, 2024',
          fileUrl: '#',
          fileSize: '3.1 MB'
        }
      ])
      
      if (isStudent) {
        setStudentResults(mockStudentResults)
      }
      
      setLoading(false)
    }, 1000)
  }, [isStudent])

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
    const newResult = {
      id: Date.now(),
      title: uploadedFile.name.replace('.pdf', ''),
      semester: 'Current Semester',
      uploadedBy: user?.firstName + ' ' + user?.lastName,
      uploadDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      fileUrl: '#',
      fileSize: `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
    }
    
    setResults([newResult, ...results])
    setUploadedFile(null)
    
    // Reset file input
    document.getElementById('file-upload').value = ''
  }

  const handleDeleteResult = (id) => {
    // In production, send delete request to server
    setResults(results.filter(result => result.id !== id))
  }

  // Helper function to get color class based on grade
  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600'
    if (grade.startsWith('B')) return 'text-blue-600'
    if (grade.startsWith('C')) return 'text-yellow-600'
    if (grade.startsWith('D')) return 'text-orange-600'
    return 'text-red-600'
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
        <h1 className="text-2xl font-bold text-gray-900">Examination Results</h1>
        <p className="text-gray-600 mt-1">
          {isFaculty 
            ? 'Upload and manage student examination results' 
            : 'View your academic performance and results'}
        </p>
      </div>
      
      {/* Student Results Section */}
      {isStudent && studentResults && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaGraduationCap className="mr-2 text-primary-700" />
              Your Performance
            </h2>
            <div className="text-sm">
              <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 font-medium">
                {studentResults.currentSemester}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-sm text-blue-700 mb-1">GPA</div>
              <div className="text-3xl font-bold text-blue-900">{studentResults.gpa}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-sm text-green-700 mb-1">Total Credits</div>
              <div className="text-3xl font-bold text-green-900">{studentResults.totalCredits}</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-sm text-purple-700 mb-1">Courses Completed</div>
              <div className="text-3xl font-bold text-purple-900">{studentResults.courses.length}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentResults.courses.map((course) => (
                  <tr key={course.code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getGradeColor(course.grade)}`}>
                        {course.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right">
            <button
              type="button"
              className="btn btn-primary"
            >
              <FaDownload className="mr-2" />
              Download Transcript
            </button>
          </div>
        </div>
      )}
      
      {/* Upload Section - Faculty Only */}
      {isFaculty && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFileUpload className="mr-2 text-primary-700" />
            Upload Results Document
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
                  <FaListAlt className="text-gray-500 mr-2" />
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
            Upload Results
          </button>
        </div>
      )}
      
      {/* Results Document List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaListAlt className="mr-2 text-primary-700" />
            Results Documents
          </h2>
        </div>
        
        {results.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No result documents available
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
              <div key={result.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">{result.title}</h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>{result.semester}</span>
                      <span className="mx-2">•</span>
                      <span>By {result.uploadedBy}</span>
                      <span className="mx-2">•</span>
                      <span>{result.uploadDate}</span>
                      <span className="mx-2">•</span>
                      <span>{result.fileSize}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="p-2 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50"
                      title="View results"
                    >
                      <FaEye />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                      title="Download results"
                    >
                      <FaDownload />
                    </button>
                    {isFaculty && (
                      <button
                        type="button"
                        className="p-2 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete results"
                        onClick={() => handleDeleteResult(result.id)}
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