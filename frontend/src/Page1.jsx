import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import { useAuth } from "./AuthContext";

const FoggyRevealText = ({ text, style, charDelay = 50, initialDelay = 0 }) => {
  return (
    <p style={style}>
      {text.split('').map((char, index) => {
        const stagger = initialDelay + index * charDelay;
        return (
          <span
            key={index}
            className="foggy-char"
            style={{ animationDelay: `${stagger}ms, ${stagger + 2500 + Math.random() * 2000}ms` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </p>
  );
};

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

  const firstLine = "당신의 마음을 들려주세요.";

  return (
    <div style={styles.container}>
      <NavigationBar />
      <div style={styles.content}>
        <FoggyRevealText 
            text={firstLine}
            style={{ marginBottom: 10, fontFamily: "'Noto Serif Korean', serif", fontSize: "3em"}}
        />
        <FoggyRevealText 
            text="오늘 느낀 감정을 적어주시면, 따뜻한 위로의 말을 건네드릴게요."
            style={{ margin: 10, fontFamily: "'Noto Serif Korean', serif"}}
            charDelay={30}
            initialDelay={1500}
        />
        {session ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="지금의 마음을 자유롭게 적어주세요."
              className="textarea-shadcn"
            />
            <button onClick={handleSubmit} className="button-shadcn-outline" disabled={loading}>
              {loading ? "오늘의 감정은..." : "위로의 문장 받기"}
            </button>
          </>
        ) : (
          <button onClick={() => navigate("/login")} className="button-shadcn-outline">
            무료로 시작하기
          </button>
        )}
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
};

const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  @keyframes foggy-reveal {
    0% {
      opacity: 0;
      filter: blur(1px);
    }
    100% {
      opacity: 1;
      filter: blur(0);
    }
  }

  @keyframes subtle-pulse {
    0%, 100% {
      text-shadow: 0 0 3px rgba(243, 219, 185, 0.5);
    }
    50% {
      text-shadow: 0 0 6px rgba(243, 219, 185, 0.8);
    }
  }

  .foggy-char {
    display: inline-block;
    animation: foggy-reveal 2.5s forwards, subtle-pulse 4s infinite;
    opacity: 0;
  }

  .textarea-shadcn {
    width: 700px;
    min-height: 80px;
    padding: 12px 20px;
    margin-top: 50px;
    margin-bottom: 20px;
    font-size: 16px;
    line-height: 1.5;
    background-color: rgba(0, 0, 0, 0.2);
    color: #f3dbb9;
    border: 1px solid #f3dbb9;
    border-radius: 0.5rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    font-family: 'Noto Serif Korean', serif;
  }

  .textarea-shadcn:focus {
    border-color: #f3dbb9;
    box-shadow: 0 0 0 2px rgba(243, 219, 185, 0.5);
  }

  .textarea-shadcn::placeholder {
    color: #a39b8b;
    font-family: 'Noto Serif Korean', serif;
  }

  .button-shadcn-outline {
    margin-top: 20px;
    padding: 10px 25px;
    font-size: 1em;
    font-weight: 500;
    cursor: pointer;
    background-color: transparent;
    color: #f3dbb9;
    border: 1px solid #f3dbb9;
    border-radius: 0.5rem;
    outline: none;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .button-shadcn-outline:hover {
    background-color: #f3dbb9;
    color: #3e513c;
    border-color: #f3dbb9;
  }

  .button-shadcn-outline:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
document.head.appendChild(styleSheet);

export default Page1;