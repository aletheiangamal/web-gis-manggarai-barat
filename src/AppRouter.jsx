import { lazy, Suspense, useState } from 'react'
import { ArrowLeft, LogOut } from 'lucide-react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './useAuth.js'

const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'))

function AdminRoute() {
  const { isLoading, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState('')

  if (isLoading) {
    return (
      <div className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-slate-950 tw-font-sans tw-text-slate-100" role="status">
        Memeriksa sesi admin...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Gagal keluar dari sesi Supabase:', error)
      setSignOutError(error instanceof Error ? error.message : 'Gagal keluar dari sesi Supabase.')
    }
  }

  return (
    <div className="tw-min-h-screen tw-bg-slate-950">
      <nav className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-slate-800 tw-bg-slate-900 tw-px-4 tw-py-3 sm:tw-px-8">
        <Link to="/" className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-slate-300 hover:tw-text-white">
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke peta
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-slate-700 tw-bg-slate-800 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-slate-200 hover:tw-bg-slate-700"
        >
          <LogOut size={15} aria-hidden="true" />
          Keluar
        </button>
      </nav>
      {signOutError && (
        <p role="alert" className="tw-bg-rose-950 tw-px-4 tw-py-2 tw-text-sm tw-text-rose-200">
          {signOutError}
        </p>
      )}
      <Suspense
        fallback={
          <div className="tw-flex tw-min-h-[50vh] tw-items-center tw-justify-center tw-bg-slate-950 tw-font-sans tw-text-slate-100" role="status">
            Memuat dashboard admin...
          </div>
        }
      >
        <AdminDashboard />
      </Suspense>
    </div>
  )
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
