import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import { useAuth } from "./AuthContext";

function Page1() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSubmit = async () => {
    if (!session) {
      navigate("/login");
      return;
    }

    if (text.trim() === "") {
      alert("문장을 입력해주세요.");
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
      <NavigationBar />
      <div style={styles.content}>
        <p style={{ marginBottom: 10, fontFamily: "'Noto Serif Korean', serif", fontSize: "3em"}}>당신의 마음을 들려주세요.</p>
        <p style={{ margin: 10, fontFamily: "'Noto Serif Korean', serif"}}>오늘 느낀 감정을 적어주시면, 따뜻한 위로의 말을 건네드릴게요.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="지금의 마음을 자유롭게 적어주세요."
          style={styles.textarea}
        />
        <button onClick={handleSubmit} style={styles.button} disabled={loading}>
          {loading ? "오늘의 감정은..." : "위로의 문장 받기"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#3e513c",
    color: "#f3dbb9",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    padding: "20px",
    marginBottom : "150px",
  },
  textarea: {
    width: "800px",
    height: "25px",
    padding: "10px",
    marginTop: "50px",
    marginBottom : "20px",
    fontSize: "16px",
    lineHeight: "25px",
    backgroundColor: "#ffffff",
    borderRadius: "50px",
    border: "1px solid #ccc",
    outline: "none",
    color: "#545454",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },
  button: {
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
