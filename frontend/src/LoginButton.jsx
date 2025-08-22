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
          마이페이지
        </button>
      )}
      <button onClick={handleAuthClick} style={styles.loginButton}>
        {session ? '로그아웃' : '로그인'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    gap: '10px',
    zIndex: 1000,
  },
  loginButton: {
    padding: '8px 15px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: '#f3dbb9',
    color: '#3e513c',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  myPageButton: {
    padding: '8px 15px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: '#d4e6c8',
    color: '#3e513c',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
};

export default LoginButton;
