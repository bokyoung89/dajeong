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
        <button onClick={() => navigate('/myPage')} style={styles.myPageButton}>
          Library
        </button>
      )}
      <button onClick={handleAuthClick} style={styles.loginButton}>
        <span style={styles.separator}>| </span>
        {session ? 'Logout' : 'Login'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '10px',
  },
  loginButton: {
    padding: 0,
    fontSize: '1.5em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: 'none',
    fontFamily: "'Nanum Brush Script', cursive",
  },
  myPageButton: {
    padding: 0,
    fontSize: '1.5em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: 'none',
    fontFamily: "'Nanum Brush Script', cursive",
  },
};

export default LoginButton;
