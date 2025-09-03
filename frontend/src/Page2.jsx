import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";

function Page2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [currentResult, setCurrentResult] = useState(location.state?.result);
  let refText = currentResult?.encouragement || "";
  let source = currentResult?.source || "";

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
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showAllDonePopup, setShowAllDonePopup] = useState(false); // New state for the 'all done' popup
  const [loading, setLoading] = useState(false);
  const [displayedSentences, setDisplayedSentences] = useState([]);

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

    if (typedArr.length >= refArr.length && refArr.length > 0 && endedAt === null) {
      setEndedAt(now);
      
      setTimeout(() => {
        setShowCompletePopup(true);
      }, 300);

      if (session && currentResult?.emotion) {
        const saveTranscription = async () => {
          try {
            const { error } = await supabase
              .from('transcriptions')
              .insert([{ content: refText, user_id: session.user.id, emotion: currentResult.emotion }]);

            if (error) throw error;
            console.log('필사 내용 및 감정이 성공적으로 저장되었습니다.');
          } catch (error) {
            console.error('필사 내용 저장 중 오류 발생:', error.message);
          }
        };
        saveTranscription();
      }
    }
  }, [typedArr.length, refArr.length, startedAt, endedAt, now, session, refText, currentResult]);

  const elapsedSec = useMemo(() => {
    if (!startedAt) return 0;
    const end = endedAt ?? now;
    return (end - startedAt) / 1000;
  }, [startedAt, endedAt, now]);

  const tajaSpeed = useMemo(() => {
    if (elapsedSec <= 0) return 0;
    return Math.round((typedArr.length / elapsedSec) * 60);
  }, [typedArr.length, elapsedSec]);

  const focusInput = () => inputRef.current?.focus();

  // Initialize displayedSentences only when the component mounts with initial data
  useEffect(() => {
    const initialResult = location.state?.result;
    if (initialResult?.encouragement) {
      setDisplayedSentences([initialResult.encouragement]);
    }
  }, [location.state?.result]);

  // Reset typing state when the sentence changes
  useEffect(() => {
    setTyped("");
    setStartedAt(null);
    setEndedAt(null);
    setShowCompletePopup(false);
    focusInput();
  }, [currentResult]);

  const handleTyping = (e) => {
    const input = e.target.value;
    if (input.length <= refText.length) {
      setTyped(input);
    }
  };

  const handleReset = () => {
    setTyped("");
    setStartedAt(null);
    setEndedAt(null);
    setShowCompletePopup(false);
    focusInput();
  };

  const fetchNewSentence = async (emotion, situation) => {
    setLoading(true);
    try {
      let url = `/api/contents_by_emotion/${encodeURIComponent(emotion)}`;
      if (situation) {
        url += `?situation=${encodeURIComponent(situation)}`;
      }

      const response = await fetch(url, { method: "GET" });
      const allSentences = await response.json();

      if (allSentences && allSentences.length > 0) {
        const availableSentences = allSentences.filter(
          (s) => !displayedSentences.includes(s.sentence)
        );

        if (availableSentences.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableSentences.length);
          const selectedSentence = availableSentences[randomIndex];

          const newResult = {
            emotion: emotion,
            situation: situation,
            encouragement: selectedSentence.sentence,
            source: `${selectedSentence.title}, ${selectedSentence.author}`
          };

          setCurrentResult(newResult);
          setDisplayedSentences((prev) => [...prev, selectedSentence.sentence]);
        } else {
          setShowAllDonePopup(true); // Show custom popup instead of alert
        }
      } else {
        alert("해당 감정에 대한 문장을 찾을 수 없습니다.");
      }
    } catch (err) {
      alert("새로운 문장을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentResult) {
    return (
      <div style={styles.container}>
        <NavigationBar />
        <div style={styles.content}>
          <p>결과가 없습니다. 먼저 기분을 입력해주세요.</p>
          <button onClick={() => navigate("/")} className="button-shadcn-outline">돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <NavigationBar />
      <div style={styles.content}>
        <p><strong>오늘 당신의 감정은:</strong> {currentResult.emotion}입니다.</p>

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
                    {refArr[typedArr.length] === " " ? " " : refArr[typedArr.length]}
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
                    {refArr[typedArr.length] === " " ? " " : refArr[typedArr.length]}
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

        <hr style={{ width: "100%", borderTop: "1px solid #aaa", margin: "20px 0" }} />

        {source && (
          <div style={{ marginTop: 10, fontSize: "14px", color: "#ccc" }}>
            <em>{source}</em>
          </div>
        )}

        <div>
          <button onClick={handleReset} className="button-shadcn-outline">
            초기화
          </button>
        </div>

        <div style={{ marginTop: 20, color: "#f3dbb9" }}>
          <p>정확도: <strong>{accuracy}%</strong></p>
        </div>

        <button className="button-shadcn-outline" onClick={() => navigate("/")}>
          기분 다시 입력하기
        </button>

        <button className="button-shadcn-outline" onClick={() => setShowCompletePopup(true)}>
          팝업 테스트
        </button>

        {/* 완료 팝업 */}
        {showCompletePopup && (
          <div style={styles.popupOverlay} onClick={() => setShowCompletePopup(false)}>
            <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
              <div style={styles.popupContent}>
                <span style={styles.emoji}>😸</span>
                <p style={styles.popupMessage}>오늘 하루도 정말 수고했어요!</p>
                <button 
                  className="button-shadcn-outline"
                  onClick={() => {
                    setShowCompletePopup(false);
                    fetchNewSentence(currentResult.emotion, location.state?.result?.situation);
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 모든 문장 완료 팝업 */}
        {showAllDonePopup && (
          <div style={styles.popupOverlay} onClick={() => setShowAllDonePopup(false)}>
            <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
              <div style={styles.popupContent}>
                <span style={styles.emoji}>🎉</span>
                <p style={styles.popupMessage}>
                  오늘의 위로 문장을 모두 만나셨습니다. <br />
                  이제 새로운 마음으로 다시 시작해볼까요?
                </p>
                <button 
                  className="button-shadcn-outline"
                  onClick={() => {
                    setShowAllDonePopup(false);
                    navigate("/");
                  }}
                >
                  다시 시작하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
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
      `}</style>
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
    width: '100%',
    maxWidth: '800px',
  },
  quoteBox: {
    position: "relative",
    margin: "20px 0",
    padding: "15px",
    borderRadius: "8px",
    width: "100%",
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
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out',
  },
  popup: {
    backgroundColor: '#3e513c',
    borderRadius: '16px',
    padding: '0',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    animation: 'fadeIn 0.4s ease-out',
    overflow: 'hidden',
    border: '1px solid #f3dbb9',
  },
  popupContent: {
    padding: '40px 30px',
    textAlign: 'center',
    color: '#f3dbb9',
  },
  emoji: {
    fontSize: '30px',
    display: 'block',
    marginBottom: '20px',
    animation: 'fadeIn 0.6s ease-out',
  },
  popupMessage: {
    fontSize: '18px',
    margin: '0 0 30px 0',
    color: '#f3dbb9',
    lineHeight: '1.5',
    fontFamily: 'Arial, sans-serif',
  },
};

const highlightStyles = {
  green: { color: "#ffff" },
  red: { color: "#ff4d4d" },
  "bg-yellow": { backgroundColor: "#fff176", color: "#333" },
};

export default Page2;