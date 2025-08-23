from flask import Flask, Response, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import psycopg2
import random
from dotenv import load_dotenv
import traceback
from transformers import pipeline # transformers 임포트

load_dotenv()

# ✅ React 빌드 경로 지정 (Vite나 CRA에 따라 dist/build 차이 있음)
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "../frontend/dist")

app = Flask(__name__, static_folder=REACT_BUILD_DIR, static_url_path="/")
CORS(app)

# KoELECTRA 기반 감정 분석 모델 로드 (앱 시작 시 한 번만 로드)
try:
    emotion_analyzer = pipeline("sentiment-analysis", model="Jinuuuu/KoELECTRA_fine_tunning_emotion")
    print("KoELECTRA emotion analysis model loaded successfully.")
except Exception as e:
    print(f"Error loading KoELECTRA emotion analysis model: {e}")
    emotion_analyzer = None # 모델 로드 실패 시 None으로 설정

# React 라우팅 처리 (SPA 지원)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(REACT_BUILD_DIR, path)):
        return send_from_directory(REACT_BUILD_DIR, path)
    else:
        return send_from_directory(REACT_BUILD_DIR, "index.html")

# 감정 분석 API (격려문은 DB에서 가져옴)
@app.route("/api/mood", methods=["POST"])
def analyze_mood():
    data = request.get_json()
    user_text = data.get("text", "").strip()
    if not user_text:
        return jsonify({"error": "문장을 입력해주세요"}), 400

    if not emotion_analyzer:
        return jsonify({"error": "Emotion analysis model not loaded."}), 500

    # 1. KoELECTRA 모델을 사용하여 감정 분석
    try:
        result = emotion_analyzer(user_text)
        raw_emotion = result[0]['label']

        # 모델 출력 감정을 DB 감정으로 매핑
        emotion_mapping = {
            "angry": "분노",
            "happy": "기쁨",
            "sad": "슬픔",
            "anxious": "두려움",
            "embarrassed": "놀람",
            "heartache": "슬픔" # '상처'는 '슬픔'으로 매핑
        }
        detected_emotion = emotion_mapping.get(raw_emotion, "알 수 없음")

    except Exception as e:
        print(f"KoELECTRA emotion analysis error: {e}")
        traceback.print_exc()
        detected_emotion = "알 수 없음" # 오류 발생 시 기본 감정 설정

    # 2. DB에서 해당 감정의 필사 문장 가져오기
    encouragement_data = {"sentence": "", "author": "", "title": ""}
    if detected_emotion != "알 수 없음":
        conn = None
        cur = None
        try:
            conn = get_db_connection()
            if conn:
                cur = conn.cursor()
                cur.execute("SELECT sentence, author, title FROM contents WHERE emotion = %s", (detected_emotion,))
                contents = cur.fetchall()
                
                if contents:
                    selected_content = random.choice(contents)
                    encouragement_data = {
                        "sentence": selected_content[0],
                        "author": selected_content[1],
                        "title": selected_content[2]
                    }
                else:
                    print(f"No content found for emotion: {detected_emotion}")
            else:
                print("Database connection failed for mood analysis.")
        except Exception as e:
            print(f"Error fetching content from DB for emotion {detected_emotion}: {e}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

    # 최종 결과 반환
    return jsonify({
        "emotion": detected_emotion,
        "encouragement": encouragement_data["sentence"],
        "source": f"{encouragement_data['title']}, {encouragement_data['author']}" if encouragement_data["title"] else ""
    })


# 데이터베이스 연결 함수
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.environ.get("DB_HOST"),
            port=os.environ.get("DB_PORT", 6543),
            database=os.environ.get("DB_NAME"),
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASSWORD"),
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        traceback.print_exc()
        return None

# 감정에 따른 필사 문장 조회 API
@app.route("/api/contents_by_emotion/<emotion>", methods=["GET"])
def get_contents_by_emotion(emotion):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "데이터베이스 연결 실패"}), 500

        cur = conn.cursor()
        # SQL Injection 방지를 위해 플레이스홀더 사용
        cur.execute("SELECT sentence, author, title FROM contents WHERE emotion = %s", (emotion,))
        contents = cur.fetchall()
        
        # 결과를 JSON 형식으로 변환
        result = []
        for sentence, author, title in contents:
            result.append({
                "sentence": sentence,
                "author": author,
                "title": title
            })
        
        return jsonify(result)

    except Exception as e:
        print(f"Error fetching contents by emotion: {e}")
        return jsonify({"error": "데이터 조회 중 오류 발생"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)