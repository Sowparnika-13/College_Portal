import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useState } from 'react'

export default function Layout() {
  // Sidebar state and toggle are no longer needed
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <Navbar />
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}