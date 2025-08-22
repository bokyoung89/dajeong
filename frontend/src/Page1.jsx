import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginButton from "./LoginButton";

function Page1() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // ✅ 결과를 Page2로 전달
      navigate("/result", { state: { result: data } });
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <LoginButton />
      <h1 style={{ marginBottom: 0, fontFamily: "'Nanum Brush Script', cursive", fontSize: "5em" }}>오늘 당신의 하루는 어땠나요?</h1>
       <p style={{ marginTop: 10, fontSize: "50px", fontFamily: "'Nanum Brush Script', cursive" }}>How was your day today?</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예) 피곤한 하루였어요."
        style={styles.textarea}
      />
      <button onClick={handleSubmit} style={styles.button} disabled={loading}>
        {loading ? "분석 중..." : "문장 추천 받기"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: "relative", // 추가
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#3e513c",
    color: "#f3dbb9",
    padding: "20px",
  },
  textarea: {
    width: "800px",
    height: "25px",
    padding: "10px",
    margin: "5px",
    fontSize: "16px",
    lineHeight: "25px",
    backgroundColor: "#ffffff",      // 흰색 배경
    borderRadius: "10px",            // 둥근 모서리
    border: "1px solid #ccc",        // 테두리
    outline: "none",                 // 포커스 시 기본 테두리 제거
    color: "#545454", 
    textAlign: "center",
    fontFamily: "Arial, sans-serif", 
  },
  button: {
    padding: "10px 20px",
    margin: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  textarea::placeholder {
    color: #cbc2b9;
    text-align: center;
    font-family: Arial, sans-serif;
    line-height: 25px;
  }
`;
document.head.appendChild(styleSheet);

export default Page1;
