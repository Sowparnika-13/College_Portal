import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FaUserGraduate, FaChalkboardTeacher, FaLock } from 'react-icons/fa'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('') // 👈 Role state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !role) {
      setError('Email, password, and role selection are required')
      return
    }

    try {
      setIsLoading(true)
      const userData = await login(email, password, role)
      if (userData) {
        navigate('/')
      } else {
        setError('Failed to load user profile. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 animate-fade">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">College Community Portal</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex space-x-6">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`text-center px-4 py-2 rounded-lg transition-all ${
                role === 'student'
                  ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="rounded-full p-3 inline-flex justify-center items-center">
                <FaUserGraduate className="h-6 w-6" />
              </div>
              <p className="mt-1 text-sm font-medium">Student</p>
              {role === 'student' && <p className="text-xs text-primary-500 mt-1">Selected</p>}
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('faculty')}
              className={`text-center px-4 py-2 rounded-lg transition-all ${
                role === 'faculty'
                  ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="rounded-full p-3 inline-flex justify-center items-center">
                <FaChalkboardTeacher className="h-6 w-6" />
              </div>
              <p className="mt-1 text-sm font-medium">Faculty</p>
              {role === 'faculty' && <p className="text-xs text-primary-500 mt-1">Selected</p>}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-field pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full btn btn-primary py-3 flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Sign in"}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-700 hover:text-primary-800">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
