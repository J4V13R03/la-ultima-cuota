import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavigationBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar
      sticky="top"
      variant="dark"
      expand="lg"
      style={{ backgroundColor: 'var(--color-text-dark)', padding: '0.65rem 0' }}
      className="shadow-sm"
    >
      <Container fluid>
        <Navbar.Brand
          as={Link}
          to="/"
          className="font-heading fw-bold d-flex align-items-center gap-2"
          style={{ fontSize: '1.35rem' }}
        >
          <img
            src="/logo.svg"
            alt="La Última Cuota"
            style={{ height: '40px', width: 'auto' }}
          />
          La Última Cuota
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          {isAuthenticated && (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" className="text-light">
                Inicio
              </Nav.Link>
              <Nav.Link as={Link} to="/calendario" className="text-light">
                Calendario
              </Nav.Link>
            </Nav>
          )}
          <Nav className="ms-auto align-items-center">
            {isAuthenticated && user && (
              <>
                <span className="text-light me-3 d-flex align-items-center gap-2">
                  <span className="fw-medium">{user.username}</span>
                  <span
                    className="font-mono fw-bold px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  >
                    ${(user.balance ?? user.saldo ?? 0).toLocaleString('es-CL')}
                  </span>
                </span>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleLogout}
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Salir
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/login" className="text-light">
                  Iniciar Sesión
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="text-light">
                  Registrarse
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
