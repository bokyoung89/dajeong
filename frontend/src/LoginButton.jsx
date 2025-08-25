import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

function LoginButton() {
  console.log("✅ LoginButton 렌더링됨");
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = async () => {
    if (session) {
      // 로그아웃
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
      } else {
        navigate('/'); // 로그아웃 후 홈으로 이동
      }
    } else {
      // 로그인 페이지로 이동
      navigate('/login');
    }
  };

  return (
    <div style={styles.container}>
      {session && (
        <button className="nav-button" onClick={() => navigate('/myPage')} style={styles.myPageButton}>
          Library
        </button>
      )}
      <button className="nav-button" onClick={handleAuthClick} style={styles.loginButton}>
        {session ? 'Logout' : 'Login'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '20px', // Doubled gap
  },
  loginButton: {
    padding: 0,
    fontSize: '20px',
    lineHeight: '20px', // Added lineHeight
    cursor: 'pointer',
    backgroundColor: 'transparent',
    // color: '#f3dbb9', // Removed color
    border: 'none',
    fontFamily: "'Markazi Text', serif",
  },
  myPageButton: {
    padding: 0,
    fontSize: '20px',
    lineHeight: '20px', // Added lineHeight
    cursor: 'pointer',
    backgroundColor: 'transparent',
    // color: '#f3dbb9', // Removed color
    border: 'none',
    fontFamily: "'Markazi Text', serif",
  },
};

export default LoginButton;
