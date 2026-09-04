import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const SIDEBAR_ITEMS = [
  { path: '/dashboard', label: 'Inicio', icon: 'bi-house-door' },
  { path: '/establo', label: 'Establo', icon: 'bi-grid' },
  { path: '/mercado', label: 'Mercado', icon: 'bi-shop' },
  { path: '/calendario', label: 'Carreras', icon: 'bi-flag' },
  { path: '/gacha', label: 'Gacha', icon: 'bi-dice-5' },
  { path: '/historial', label: 'Historial', icon: 'bi-clock-history' },
  { path: '/simulador', label: 'Simulador', icon: 'bi-play-circle' },
];

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="d-flex flex-column border-end"
      style={{
        width: collapsed ? '68px' : '220px',
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: 'var(--color-text-dark)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <button
        className="btn btn-link text-light p-2 mb-2 d-flex align-items-center justify-content-center"
        onClick={() => setCollapsed(!collapsed)}
        style={{ textDecoration: 'none' }}
      >
        <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </button>

      <Nav className="flex-column gap-1 px-2">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Nav.Link
              key={item.path}
              as={Link}
              to={item.path}
              className="text-light d-flex align-items-center gap-2 py-2"
              style={{
                borderRadius: '8px',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                fontWeight: isActive ? 600 : 400,
                fontSize: collapsed ? '0' : '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem', minWidth: '24px', textAlign: 'center' }}></i>
              {!collapsed && item.label}
            </Nav.Link>
          );
        })}
      </Nav>
    </div>
  );
}

export default Sidebar;
