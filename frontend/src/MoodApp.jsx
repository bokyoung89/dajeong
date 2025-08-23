import React, { useState, useEffect } from "react";

function MoodApp() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false)  
  const [error, setError] = useState(null); // 에러 상태 추가

  const handleSubmit = async () => {
    if (text.trim() === "") {
      setError("문장을 입력해주세요!"); // alert 대신 setError 사용
      return;
    }

    setLoading(true);
    setError(null); // 새로운 요청 시 에러 초기화
    setResult(null); // 새로운 요청 시 결과 초기화
    try {
      // 백엔드 URL을 명시적으로 지정 (개발 환경에서 CORS 문제 방지)
      const response = await fetch("http://localhost:5000/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      console.log("서버 응답:", data);

      if (!response.ok) { // 응답이 성공적이지 않을 경우 에러 처리
        setError(data.error || "감정 분석에 실패했습니다.");
        return;
      }
      setResult(data);
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다." + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 감정별 이모지 및 텍스트 반환 함수
  const getEmotionDisplay = (emotion) => {
    switch (emotion) {
      case '기쁨': return '😊 기쁨';
      case '슬픔': return '😔 슬픔';
      case '분노': return '😡 분노';
      case '놀람': return '😮 놀람';
      case '혐오': return '🤢 혐오';
      case '두려움': return '😨 두려움';
      default: return '❓ 알 수 없음' ;
    }
  };

  return (
    <div style={styles.container}>
      <h1>오늘의 기분을 입력해보세요</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="오늘 기분을 자유롭게 입력하세요..."
        style={styles.textarea}
      />
      <button onClick={handleSubmit} style={styles.button} disabled={loading}>
        {loading ? "분석 중..." : "분석 및 격려"}
      </button>

      {error && <p style={{ ...styles.errorMessage, color: 'red' }}>{error}</p>} {/* 에러 메시지 표시 */}

      {result && typeof result === "object" && (
        <div style={styles.resultBox}>
          <p><strong>분석된 감정:</strong> {getEmotionDisplay.emotion}</p>
          <p><strong>격려 문장:</strong> {result.encouragement.text}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw" ,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#3e513c",
    color: "#f3dbb9",
    padding: "20px",
  },
  textarea: {
    width: "90vw",         // 화면 너비에 맞춰서 크기 조정 (최대 90%)
    maxWidth: 600,         // 최대 크기 제한
    height: "30vh",        // 높이도 화면 기준으로 비율 조절
    padding: "10px",
    margin: "5px",
    fontSize: "16px",
    resize: "vertical",
  },
  button: {
    padding: "10px 20px",
    margin: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
  resultBox: {
    marginTop: "20px",
    width: "400px",
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
};

export default MoodApp;
