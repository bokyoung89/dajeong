import React from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import kakaoLoginImage from './assets/kakao_login_medium_narrow.png';
import './GsiButton.css';

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
      <h1 style={styles.title}>다정문장</h1>
      <button onClick={handleGoogleLogin} className="gsi-material-button">
        <div className="gsi-material-button-state"></div>
        <div className="gsi-material-button-content-wrapper">
          <div className="gsi-material-button-icon">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{display: 'block'}}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </div>
          <span className="gsi-material-button-contents">Sign in with Google</span>
          <span style={{display: 'none'}}>Sign in with Google</span>
        </div>
      </button>
      <button onClick={handleKakaoLogin} style={{...styles.button, padding: 0, backgroundColor: 'transparent'}}>
        <img src={kakaoLoginImage} alt="Kakao로 로그인" />
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
    height: '100vh',
    width: '100vw',
    backgroundColor: '#3e513c',
    color: '#f3dbb9',
    fontFamily: 'Arial, sans-serif',
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