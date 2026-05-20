import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <span className="navbar-brand">Content Pipeline Tracker</span>
      <div className="navbar-right">
        <span className="navbar-user">
          {user?.name}
          <span className={`role-badge role-badge--${user?.role?.toLowerCase()}`}>
            {user?.role === 'ADMIN' ? 'Admin' : 'Writer'}
          </span>
        </span>
        <Link to="/change-password" className="btn-logout">
          Change Password
        </Link>
        <button className="btn-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  )
}
