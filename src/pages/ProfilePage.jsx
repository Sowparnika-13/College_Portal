import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return <div className="p-8">Loading...</div>
  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="mb-2">
        <span className="font-semibold">Name: </span>
        {user.first_name} {user.last_name}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Email: </span>
        {user.email}
      </div>
    </div>
  )
} 