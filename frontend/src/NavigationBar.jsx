import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton';

function NavigationBar() {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <div style={styles.navContent}>
        <button onClick={() => navigate('/')} style={styles.homeButton}>
          Home
          <span style={styles.separator}> | </span>
        </button>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '15px',
    borderBottom: '1px solid #f3dbb9',
  },
  homeButton: {
    padding: 0,
    fontSize: '1.5em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: 'none',
    fontFamily: "'Nanum Brush Script', cursive",
  },
  separator: {
    color: '#f3dbb9',
    fontSize: '1.5em',
    alignSelf: 'center',
  }
};

export default NavigationBar;