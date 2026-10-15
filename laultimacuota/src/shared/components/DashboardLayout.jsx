import React from 'react';
import Sidebar from './Sidebar';
import NavigationBar from './Navbar';
import ViernesWidget from '../../features/assistant/components/ViernesWidget';

function DashboardLayout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <NavigationBar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1" style={{ overflow: 'auto' }}>
          {children}
        </main>
      </div>
      <ViernesWidget />
    </div>
  );
}

export default DashboardLayout;
