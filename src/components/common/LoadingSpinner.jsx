import { FaSpinner } from 'react-icons/fa'

export default function LoadingSpinner({ size = 'md', color = 'currentColor' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }
  
  return (
    <FaSpinner 
      className={`animate-spin ${sizeClasses[size]}`} 
      style={{ color }}
    />
  )
}