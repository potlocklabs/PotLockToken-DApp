import React, { useState } from 'react';
import FrontEndHome from './FrontEndHome';
import BurnTokenPage from './BurnTokenPage';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('home'); // Default to FrontEndHome
  const [menuOpen, setMenuOpen] = useState(false); // State for toggling menu

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar Menu */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: menuOpen ? '200px' : '0',
          background: '#333',
          color: 'white',
          transition: 'width 0.3s',
          overflow: 'hidden',
          padding: menuOpen ? '10px' : '0',
          boxShadow: menuOpen ? '2px 0 5px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <div style={{ marginBottom: '0px', fontWeight: 'bold', fontSize: '1.5em' }}>PLT Menu</div>
        <button
          onClick={() => {
            setActivePage('home');
            setMenuOpen(false);
          }}
          style={menuButtonStyle}
        >
          Home
        </button>
        <button
          onClick={() => {
            setActivePage('burn');
            setMenuOpen(false);
          }}
          style={menuButtonStyle}
        >
          Burn Tokens!
        </button>
      </div>

      {/* Hamburger Icon */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <div style={hamburgerLineStyle}></div>
        <div style={hamburgerLineStyle}></div>
        <div style={hamburgerLineStyle}></div>
      </div>

      {/* Page Content */}
      <div
        style={{
          flex: 1,
          marginLeft: menuOpen ? '200px' : '0',
          transition: 'margin-left 0.3s',
          padding: '20px',
          background: '#f9f9f9',
          overflow: 'auto',
        }}
      >
        {activePage === 'home' && <FrontEndHome />}
        {activePage === 'burn' && <BurnTokenPage />}
      </div>
    </div>
  );
}

// Styles for Menu Buttons
const menuButtonStyle = {
  display: 'block',
  width: '100%',
  padding: '25px 0px',
  marginBottom: '30px',
  textAlign: 'center',
  background: 'none',
  color: 'white',
  border: 'none',
  fontSize: '1em',
  cursor: 'pointer',
  transition: 'background 0.3s',
}; 

menuButtonStyle[':hover'] = {
  background: '#444',
};

// Styles for Hamburger Icon
const hamburgerLineStyle = {
  width: '30px',
  height: '4px',
  background: '#333',
  margin: '5px 0',
  borderRadius: '2px',
};

export default App;
