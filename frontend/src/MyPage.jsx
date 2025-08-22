import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

function MyPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [session, loading, navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <div style={styles.container}>로딩 중...</div>;
  }

  if (!session) {
    return null; // 로그인 페이지로 리디렉션되었으므로 아무것도 렌더링하지 않음
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>마이페이지</h1>
      <p style={styles.text}>환영합니다, {session.user.email}님!</p>
      <button onClick={handleLogout} style={styles.button}>
        로그아웃
      </button>
      <button onClick={() => navigate('/')} style={styles.backButton}>
        홈으로 돌아가기
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#3e513c',
    color: '#f3dbb9',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  title: {
    fontSize: '2.5em',
    marginBottom: '30px',
  },
  text: {
    fontSize: '1.2em',
    marginBottom: '20px',
  },
  button: {
    padding: '12px 25px',
    margin: '10px',
    fontSize: '1.1em',
    cursor: 'pointer',
    backgroundColor: '#f3dbb9',
    color: '#3e513c',
    border: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.3s ease',
  },
  backButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '1em',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#f3dbb9',
    border: '1px solid #f3dbb9',
    borderRadius: '8px',
    transition: 'background-color 0.3s ease',
  },
};

export default MyPage;

