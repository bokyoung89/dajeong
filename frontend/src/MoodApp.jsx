import React, { useState, useEffect } from "react";

function MoodApp() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (text.trim() === "") {
      alert("문장을 입력해주세요!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      console.log("서버 응답:", data);
      setResult(data);
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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

      {result && typeof result === "object" && (
        <div style={styles.resultBox}>
          <p><strong>분석된 감정:</strong> {result.emotion}</p>
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
