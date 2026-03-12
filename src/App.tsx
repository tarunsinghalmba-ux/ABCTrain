import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ToastContainer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { Courses } from './pages/Courses'
import { LearningPaths } from './pages/LearningPaths'
import { Caregivers } from './pages/Caregivers'
import { CaregiverDetail } from './pages/CaregiverDetail'
import { Compliance } from './pages/Compliance'
import { ComplianceFramework } from './pages/ComplianceFramework'
import { MyCourses } from './pages/MyCourses'
import { AdminManagement } from './pages/AdminManagement'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute requiredRoles={['caregiver']}>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning-paths"
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <LearningPaths />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregivers"
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Caregivers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregivers/:id"
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CaregiverDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Compliance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance-framework"
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <ComplianceFramework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-management"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}
