import React from 'react';

function MyPage() {
  return (
    <div style={styles.container}>
      <h1 style={{color: "#f3dbb9"}}>테스트</h1>
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e513c',
    fontFamily: 'Arial, sans-serif',
    color: '#f3dbb9',
    padding: '20px',
  },
};

export default MyPage;
