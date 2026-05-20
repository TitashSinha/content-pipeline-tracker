import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-content">{children}</main>
    </div>
  )
}
