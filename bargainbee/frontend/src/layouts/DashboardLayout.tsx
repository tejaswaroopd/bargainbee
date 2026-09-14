import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bee-surface">
      <Navbar />
      <div className="page-container py-6">
        <Outlet />
      </div>
    </div>
  );
}
