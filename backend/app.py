import json
from flask import Flask, Response, request, jsonify, send_from_directory
from openai import OpenAI
from flask_cors import CORS
import os
import psycopg2
import random
from dotenv import load_dotenv
import traceback

load_dotenv()

# ✅ React 빌드 경로 지정 (Vite나 CRA에 따라 dist/build 차이 있음)
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "../frontend/dist")

app = Flask(__name__, static_folder=REACT_BUILD_DIR, static_url_path="/")
CORS(app)

# OpenAI 클라이언트 (환경변수에서 키 가져오기 권장)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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

    # 1. ChatGPT를 사용하여 감정 및 상황 분석
    system_prompt = "너는 사용자가 입력한 문장의 감정과 상황을 분석하는 AI야. 감정은 기쁨, 슬픔, 우울, 짜증, 무기력, 불안, 두려움, 외로움 중 하나 또는 두 가지로, 상황은 외로움, 친구, 가족, 실수, 시험, 직장, 취업, 건강, 실연 중 하나로 분석해줘."
    user_prompt = f"""
    다음 문장에 대한 감정과 상황을 분석하고, JSON 형태로 출력해줘.
    문장: {user_text}
    출력형식: {{"emotion": "감정", "situation": "상황"}}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=100  # 감정과 상황을 포함하므로 토큰 증가
        )
        response_text = response.choices[0].message.content.strip()
        chatgpt_result = json.loads(response_text.replace("'", '"'))
        detected_emotion = chatgpt_result.get("emotion", "알 수 없음")
        detected_situation = chatgpt_result.get("situation", "알 수 없음")

    except Exception as e:
        print(f"ChatGPT analysis error: {e}")
        detected_emotion = "알 수 없음"
        detected_situation = "알 수 없음"

    # 2. DB에서 해당 감정과 상황의 필사 문장 가져오기
    encouragement_data = {"sentence": "", "author": "", "title": ""}
    if detected_emotion != "알 수 없음":
        conn = None
        cur = None
        try:
            conn = get_db_connection()
            if conn:
                cur = conn.cursor()

                # 감정 문자열을 분리하여 각 감정에 대한 OR 조건 생성
                emotions = [e.strip() for e in detected_emotion.replace(",", " ").split() if e.strip()]
                
                # 기본 쿼리
                query = "SELECT sentence, author, title FROM contents WHERE "
                params = []

                # 감정 조건 추가 (OR)
                emotion_conditions = " OR ".join(["emotion LIKE %s"] * len(emotions))
                query += f"({emotion_conditions})"
                params.extend([f'%{emotion}%' for emotion in emotions])

                # 상황 조건 추가 (AND)
                if detected_situation != "알 수 없음":
                    query += " AND situation LIKE %s"
                    params.append(f'%{detected_situation}%')

                cur.execute(query, tuple(params))
                contents = cur.fetchall()

                # 만약 감정과 상황 모두에 일치하는 내용이 없으면 감정만으로 재검색
                if not contents and detected_situation != "알 수 없음":
                    query = "SELECT sentence, author, title FROM contents WHERE " + f"({emotion_conditions})"
                    cur.execute(query, tuple([f'%{emotion}%' for emotion in emotions]))
                    contents = cur.fetchall()

                if contents:
                    selected_content = random.choice(contents)
                    encouragement_data = {
                        "sentence": selected_content[0],
                        "author": selected_content[1],
                        "title": selected_content[2]
                    }
                else:
                    print(f"No content found for emotion: {detected_emotion}, situation: {detected_situation}")

            else:
                print("Database connection failed for mood analysis.")
        except Exception as e:
            print(f"Error fetching content from DB: {e}")
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
        
        # 감정 문자열을 분리하여 각 감정에 대한 OR 조건 생성
        emotions = [e.strip() for e in emotion.replace(",", " ").split() if e.strip()]
        
        if not emotions:
            return jsonify({"error": "감정을 입력해주세요"}), 400

        query = "SELECT sentence, author, title FROM contents WHERE "
        emotion_conditions = " OR ".join(["emotion LIKE %s"] * len(emotions))
        query += f"({emotion_conditions})"
        
        params = [f'%{em}%' for em in emotions]

        cur.execute(query, tuple(params))
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