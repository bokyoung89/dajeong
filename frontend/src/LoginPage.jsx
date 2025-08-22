import React from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // redirectTo: window.location.origin + '/myPage',
        redirectTo: "http://localhost:5173/",
      },
    });
    if (error) {
      alert('Google 로그인 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleKakaoLogin = async () => {
    alert('카카오 로그인은 Supabase 설정 및 추가적인 백엔드 설정이 필요합니다. 현재는 Google 로그인만 지원됩니다.');
    // Supabase에서 Kakao provider를 활성화하고, Kakao 개발자 콘솔에서 Redirect URI를 설정해야 합니다.
    // const { error } = await supabase.auth.signInWithOAuth({
    //   provider: 'kakao',
    //   options: {
    //     redirectTo: window.location.origin + '/myPage',
    //   },
    // });
    // if (error) {
    //   alert('Kakao 로그인 중 오류가 발생했습니다: ' + error.message);
    // }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>로그인</h1>
      <button onClick={handleGoogleLogin} style={styles.button}>
        Google로 로그인
      </button>
      <button onClick={handleKakaoLogin} style={styles.button}>
        Kakao로 로그인
      </button>
      <button onClick={() => navigate('/')} style={styles.backButton}>
        뒤로 가기
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

export default LoginPage;
