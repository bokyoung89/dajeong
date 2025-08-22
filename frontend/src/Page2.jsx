import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginButton from "./LoginButton";

function Page2() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  let refText = result?.encouragement || "";
  let source = result?.source || "";

  try {
    // Check if encouragement is a JSON string and parse it
    if (typeof refText === 'string' && refText.startsWith('{')) {
      const parsed = JSON.parse(refText);
      refText = parsed.sentence || refText; // Use parsed sentence, fallback to original
      source = parsed.source || source;     // Use parsed source, fallback to original
    }
  } catch (e) {
    // If parsing fails, do nothing and use the original text
    console.error("Failed to parse encouragement JSON:", e);
  }
  const [typed, setTyped] = useState("");
  const [overlay, setOverlay] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [startedAt, setStartedAt] = useState(null);
  const [endedAt, setEndedAt] = useState(null);

  const inputRef = useRef(null);

  const getSyllables = (text) => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    }
    // fallback
    return Array.from(text);
  };

  const refArr = useMemo(() => getSyllables(refText), [refText]);
  const typedArr = useMemo(() => getSyllables(typed), [typed]);

  const { correctCount, accuracy, progress } = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typedArr.length; i++) {
      if (typedArr[i] === refArr[i]) correct++;
    }
    const acc = typedArr.length > 0 ? Math.round((correct / typedArr.length) * 100) : 100;
    const prog = refArr.length > 0 ? Math.min(100, Math.round((typedArr.length / refArr.length) * 100)) : 0;
    return { correctCount: correct, accuracy: acc, progress: prog };
  }, [refArr, typedArr]);

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  useEffect(() => {
    if (typedArr.length === 1 && startedAt === null) setStartedAt(now);
    if (typedArr.length >= refArr.length && refArr.length > 0 && endedAt === null) setEndedAt(now);
  }, [typedArr.length, refArr.length, startedAt, endedAt, now]);

  const elapsedSec = useMemo(() => {
    if (!startedAt) return 0;
    const end = endedAt ?? now;
    return (end - startedAt) / 1000;
  }, [startedAt, endedAt, now]);

  const tajaSpeed = useMemo(() => {
    if (elapsedSec <= 0) return 0;
    // 분당 타수 계산
    return Math.round((typedArr.length / elapsedSec) * 60);
  }, [typedArr.length, elapsedSec]);

  // 필사 영역 포커싱
  const focusInput = () => inputRef.current?.focus();

  useEffect(() => {
    setTyped("");
    setStartedAt(null);
    setEndedAt(null);
    inputRef.current?.focus();
  }, [refText]);

  const handleTyping = (e) => {
    const input = e.target.value;
    if (input.length <= refText.length) {
      setTyped(input);
    }
  };

  if (!result) {
    return (
      <div style={styles.container}>
        <LoginButton />
        <p>결과가 없습니다. 먼저 기분을 입력해주세요.</p>
        <button onClick={() => navigate("/")}>돌아가기</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <LoginButton />
      <p><strong>오늘 당신의 감정은:</strong> {result.emotion}입니다.</p>

      {/* 필사 입력 + 오버레이 + 가이드 통합 */}
      <div style={styles.quoteBox} onClick={focusInput}>
        {showGuide && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              borderRadius: 8,
              backgroundImage:
                "repeating-linear-gradient(transparent 0px, transparent 26px, rgba(99,102,241,0.08) 26px, rgba(99,102,241,0.08) 27px)",
            }}
          />
        )}

        {overlay ? (
          <>
            <div style={styles.refText}>{refText}</div>
            <div
              style={{
                ...styles.refText,
                position: "absolute",
                top: 15,
                left: 15,
                right: 15,
                pointerEvents: "none",
              }}
            >
              {typedArr.map((ch, i) => {
                let cls = "";
                if (refArr[i] === undefined) cls = "bg-yellow";
                else if (ch === refArr[i]) cls = "green";
                else cls = "red";
                return <span key={i} style={highlightStyles[cls]}>{ch}</span>;
              })}
              {typedArr.length < refArr.length && (
                <span style={styles.cursor}>
                  {refArr[typedArr.length] === " " ? "\u00A0" : refArr[typedArr.length]}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ ...styles.refText, color: "#aaa" }}>{refText}</div>
            <div style={styles.refText}>
              {typedArr.map((ch, i) => {
                let cls = "";
                if (refArr[i] === undefined) cls = "bg-yellow";
                else if (ch === refArr[i]) cls = "green";
                else cls = "red";
                return <span key={i} style={highlightStyles[cls]}>{ch}</span>;
              })}
              {typedArr.length < refArr.length && (
                <span style={styles.cursor}>
                  {refArr[typedArr.length] === " " ? "\u00A0" : refArr[typedArr.length]}
                </span>
              )}
            </div>
          </>
        )}

        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleTyping}
          style={styles.transparentInput}
          spellCheck={false}
        />
      </div>

      <hr style={{ width: "90vw", maxWidth: "800px", borderTop: "1px solid #aaa", margin: "20px 0" }} />

      {/* 출처 */}
      {source && (
        <div style={{ marginTop: 10, fontSize: "14px", color: "#ccc" }}>
          <em>{source}</em>
        </div>
      )}

      {/* 옵션 */}
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <label>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          문장 위에 입력하기 (오버레이)
        </label>
        &nbsp;&nbsp;
        <label>
          <input type="checkbox" checked={showGuide} onChange={(e) => setShowGuide(e.target.checked)} />
          가이드 라인 표시
        </label>
        &nbsp;&nbsp;
        <button onClick={() => {
          setTyped("");
          setStartedAt(null);
          setEndedAt(null);
          focusInput();
        }}>
          초기화
        </button>
      </div>

      {/* 결과 표시 */}
      <div style={{ marginTop: 20, color: "#f3dbb9" }}>
        <p>정확도: <strong>{accuracy}%</strong></p>
        <p>진행도: <strong>{progress}%</strong> ({typedArr.length}/{refArr.length})</p>
        <p>속도: <strong>{tajaSpeed}타</strong> {elapsedSec > 0 && <>· {Math.floor(elapsedSec)}초 경과</>}</p>
      </div>

      {/* 완료 메시지 */}
      {typedArr.length >= refArr.length && refArr.length > 0 && (
        <div style={{ marginTop: 20, padding: 10, backgroundColor: "#e6ffed", borderRadius: 6, color: "#057a55" }}>
          🎉 오늘 하루도 정말 수고했어요!
        </div>
      )}

      <button style={{ marginTop: 30 }} onClick={() => navigate("/")}>
        기분 다시 입력하기
      </button>
    </div>
  );
}

// 스타일 정의
const styles = {
  container: {
    position: "relative", // 추가
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "start",
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#3e513c",
    Color: "#f3dbb9",
    fontFamily: "Arial, sans-serif",
  },
  quoteBox: {
    position: "relative",
    margin: "40px",
    padding: "15px",
    borderRadius: "8px",
    width: "100vw",
    maxWidth: "800px",
    minHeight: "200px",
    textAlign: "left",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  },
  refText: {
    fontFamily: "'Noto Serif Korean', serif",
    fontSize: 26,
    lineHeight: "30px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "#746f6f",
  },
  transparentInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    padding: "15px",
    backgroundColor: "transparent",
    color: "transparent",
    caretColor: "#6366f1",
    fontFamily: "'Noto Serif Korean', serif",
    fontSize: 26,
    lineHeight: "30px",
    resize: "none",
    outline: "none",
    border: "none",
  },
  cursor: {
    display: "inline-block",
    borderBottom: "2px solid #6366f199",
    animation: "pulse 1s infinite",
  },
};

const highlightStyles = {
  green: { color: "#ffff" },
  red: { color: "#ff4d4d" },
  "bg-yellow": { backgroundColor: "#fff176", color: "#333" },
};

export default Page2;
