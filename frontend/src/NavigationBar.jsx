import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton';

function NavigationBar() {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <div style={styles.navContent}>
        <div className="logo-text" style={styles.logoText} onClick={() => navigate('/')}>다정문장</div> {/* Made logo clickable */}
        
        <LoginButton />
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '20px',
  },
  navContent: {
    width: '900px',
    padding: '20px 0',
    display: 'flex',
    justifyContent: 'space-between', // Changed to space-between
    alignItems: 'center',
    gap: '30px',
    borderBottom: '1px solid #f3dbb9',
  },
  homeButton: {
    padding: 0,
    fontSize: '20px',
    lineHeight: '20px', // Added lineHeight
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: 'none',
    fontFamily: "'Markazi Text', serif",
  },
  separator: {
    color: '#f3dbb9',
    fontSize: '20px',
    lineHeight: '20px',
    alignSelf: 'center',
    padding: '0 5px', // Added horizontal padding
  },
  logoText: { // Added logoText style
    fontSize: '1.5em', // Changed to 1.5em
    // color: '#f3dbb9', // Removed color
    fontFamily: "'Noto Serif Korean', serif", // Using a suitable font
    cursor: 'pointer', // Added cursor pointer
    transition: 'color 0.3s ease', // Added transition
  }
};



export default NavigationBar;