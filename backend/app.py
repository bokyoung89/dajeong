import json
from flask import Flask, Response, request, jsonify, send_from_directory, Blueprint
from flask_restx import Resource, Api, fields
from openai import OpenAI
from flask_cors import CORS
import os
import psycopg2
import random
from dotenv import load_dotenv
import traceback
import math

load_dotenv()

# ✅ React 빌드 경로 지정 (Vite나 CRA에 따라 dist/build 차이 있음)
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "../frontend/dist")

# static_folder를 frontend/dist로 설정하고, static_url_path를 ''로 설정
app = Flask(__name__, static_folder=REACT_BUILD_DIR, static_url_path='')
CORS(app)

# API 블루프린트 생성
blueprint = Blueprint('api', __name__, url_prefix='/api')
api = Api(blueprint, version='1.0', title='Dajeong API',
          description='감정 분석 및 문장 추천 API',
          doc='/docs/', ordered=True)
app.register_blueprint(blueprint)

# API 네임스페이스 생성
# url_prefix='/api'이므로, 네임스페이스 경로는 '/api'로 시작하게 됨
ns = api.namespace('', description='감정 분석 및 문장 추천 API')


# OpenAI 클라이언트 (환경변수에서 키 가져오기 권장)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# --- 임베딩 기반 분류를 위한 코드 시작 ---

# 임베딩 생성 헬퍼 함수
def get_embedding(text, model="text-embedding-3-small"):
   text = text.replace("\n", " ")
   return client.embeddings.create(input = [text], model=model).data[0].embedding

# 코사인 유사도 계산 헬퍼 함수
def cosine_similarity(v1, v2):
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(a * a for a in v2))
    if not magnitude1 or not magnitude2:
        return 0
    return dot_product / (magnitude1 * magnitude2)

# 각 카테고리를 대표하는 키워드 집합 (의미 기반 매핑 정확도 향상 목적)
EMOTION_KEYWORDS = {
    "기쁨": "기쁨, 행복, 즐거움, 신남, 만족",
    "평온": "평온, 평화, 안정, 차분함, 고요함",
    "기대": "기대, 설렘, 기다림",
    "희망": "희망, 긍정, 용기, 극복",
    "슬픔": "슬픔, 비참함, 눈물, 상실",
    "우울": "우울, 침울함, 공허함",
    "짜증": "짜증, 불만",
    "무기력": "무기력, 지침, 피곤함, 번아웃",
    "불안": "불안, 걱정, 초조함, 긴장",
    "두려움": "두려움, 공포, 무서움, 겁",
    "외로움": "외로움, 고독, 쓸쓸함, 혼자",
    "분노": "분노, 화남, 역정"
}

SITUATION_KEYWORDS = {
    "외로움": "외로움, 고독, 혼자 있는 시간",
    "친구": "친구, 우정, 친구관계",
    "가족": "가족, 부모님, 형제, 자매, 아이, 조카, 배우자",
    "실수": "실수, 잘못, 후회",
    "시험": "시험, 공부, 성적, 합격, 불합격",
    "직장": "직장, 회사, 업무, 동료, 상사",
    "취업": "취업, 구직, 면접, 이직",
    "건강": "건강, 질병, 병원, 아픔, 운동",
    "사랑": "사랑, 연인, 배우자, 애정, 커플, 데이트, 이별, 설렘",
    "실패": "실패, 좌절, 역경, 극복",
    "꿈": "꿈, 목표, 비전, 장래희망",
    "진로": "진로, 커리어, 미래, 계획",
    "자기돌봄": "자기돌봄, 휴식, 힐링, 명상, 취미",
    "자존감": "자존감, 자신감, 나 자신, 정체성",
    "인생": "인생, 삶, 일상, 행복, 의미",
    "인간관계": "인간관계, 지인, 사회생활, 소통, 갈등",
}

# 최적화를 위해 서버 시작 시 표준 카테고리의 임베딩 미리 계산
EMOTION_EMBEDDINGS = {}
SITUATION_EMBEDDINGS = {}

def initialize_embeddings():
    """서버 시작 시 표준 카테고리의 임베딩을 미리 계산합니다."""
    print("표준 카테고리에 대한 임베딩을 미리 계산합니다...")
    try:
        global EMOTION_EMBEDDINGS, SITUATION_EMBEDDINGS
        EMOTION_EMBEDDINGS = {name: get_embedding(keywords) for name, keywords in EMOTION_KEYWORDS.items()}
        SITUATION_EMBEDDINGS = {name: get_embedding(keywords) for name, keywords in SITUATION_KEYWORDS.items()}
        print("임베딩 계산이 완료되었습니다.")
    except Exception as e:
        print(f"시작 시 임베딩을 계산할 수 없습니다: {e}")
        # API 키가 없거나 다른 문제 발생 시, 서버는 시작되지만 매핑 기능은 실시간으로 처리됨
        pass

# LLM의 응답을 표준 카테고리로 매핑하는 함수
def map_to_category(term, category_embeddings, canonical_keyword_dict):
    # 시작 시 임베딩이 계산되지 않았다면, 실시간으로 계산
    if not category_embeddings:
        print("미리 계산된 임베딩이 없어 실시간으로 계산합니다...")
        try:
            for name, keywords in canonical_keyword_dict.items():
                if name not in category_embeddings:
                    category_embeddings[name] = get_embedding(keywords)
        except Exception as e:
            print(f"실시간 임베딩 계산에 실패했습니다: {e}")
            return "알 수 없음"

    if not term or term == "알 수 없음":
        return "알 수 없음"

    # 표준 카테고리 이름과 정확히 일치하는지 먼저 확인
    if term in category_embeddings:
        return term

    # 하위 키워드와 정확히 일치하는지 확인
    for category, keywords in canonical_keyword_dict.items():
        keyword_list = [kw.strip() for kw in keywords.split(',')]
        if term in keyword_list:
            print(f"'{term}' -> '{category}' (으)로 직접 매핑되었습니다.")
            return category

    try:
        term_embedding = get_embedding(term)
    except Exception as e:
        print(f"'{term}'에 대한 임베딩 생성에 실패했습니다: {e}")
        return "알 수 없음"

    # 코사인 유사도 계산
    similarities = {
        category: cosine_similarity(term_embedding, category_embedding)
        for category, category_embedding in category_embeddings.items()
    }

    if not similarities:
        return "알 수 없음"

    # 가장 유사도가 높은 카테고리 반환
    best_match = max(similarities, key=similarities.get)
    print(f"'{similarities}' -> '{best_match}' (으)로 매핑되었습니다.")
    print(f"'{term}' -> '{best_match}' (으)로 매핑되었습니다.")
    return best_match

# --- 임베딩 기반 분류를 위한 코드 종료 ---

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

mood_input_model = ns.model('MoodInput', {
    'text': fields.String(required=True, description='분석할 문장', example='피곤한 하루였어요.')
})

@ns.route("/mood")
class AnalyzeMood(Resource):
    @ns.expect(mood_input_model)
    @ns.doc(description="(GitAction 테스트) 사용자가 입력한 문장을 분석하여 감정과 상황을 식별하고, 위로의 문장을 추천합니다.")
    def post(self):
        """감정 및 상황 분석 API"""
        data = request.get_json()
        user_text = data.get("text", "").strip()
        if not user_text:
            return jsonify({"error": "문장을 입력해주세요"}), 400

        # 1. ChatGPT를 사용하여 감정 및 상황 분석 (임베딩 기반)
        system_prompt = "문장을 가장 관련성 높은 '감정'과 '상황'으로 분류. JSON 출력 에시 {\"emotion\": \"기쁨\", \"situation\": \"가족\"}"
        user_prompt = f'문장: {user_text}'

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=50,
                temperature=0.1,
            )
            response_text = response.choices[0].message.content.strip()
            chatgpt_result = json.loads(response_text.replace("'", '"'))

            unmapped_emotion = chatgpt_result.get("emotion", "알 수 없음")
            unmapped_situation = chatgpt_result.get("situation", "알 수 없음")
            
            print(f"chatGPT 1차 분석: 감정 ('{unmapped_emotion}'), 상황 ('{unmapped_situation}')")

            # 임베딩을 사용하여 결과값을 표준 카테고리로 매핑
            detected_emotion = map_to_category(unmapped_emotion, EMOTION_EMBEDDINGS, EMOTION_KEYWORDS)
            detected_situation = map_to_category(unmapped_situation, SITUATION_EMBEDDINGS, SITUATION_KEYWORDS)
            
            print(f"User text: '{user_text}' -> Mapped Emotion: '{detected_emotion}', Mapped Situation: '{detected_situation}'")

        except Exception as e:
            print(f"ChatGPT 분석 또는 매핑 오류: {e}")
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
            "situation": detected_situation,
            "encouragement": encouragement_data["sentence"],
            "source": f"{encouragement_data['title']}, {encouragement_data['author']}" if encouragement_data["title"] else ""
        })


@ns.route("/contents_by_emotion/<string:emotion>")
@ns.param('emotion', '쉼표로 구분된 감정 키워드 (예: 기쁨,행복)')
class ContentsByEmotion(Resource):
    @ns.doc(description="감정 및 상황에 따른 새로운 문장을 추천합니다.",
             params={'situation': '상황 키워드 (선택 사항, 예: 친구)'})
    def get(self, emotion):
        """새로운 필사 문장 조회 API"""
        situation = request.args.get("situation")
        print(f"--- 새로운 문장 요청: 감정='{emotion}', 상황='{situation}' ---")

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
            params = []

            # 감정 조건 추가 (OR)
            emotion_conditions = " OR ".join(["emotion LIKE %s"] * len(emotions))
            query += f"({emotion_conditions})"
            params.extend([f'%{em}%' for em in emotions])

            # 상황 조건 추가 (AND)
            if situation and situation != "알 수 없음":
                query += " AND situation LIKE %s"
                params.append(f'%{situation}%')

            cur.execute(query, tuple(params))
            contents = cur.fetchall()

            # 만약 감정과 상황 모두에 일치하는 내용이 없으면 감정만으로 재검색
            if not contents and situation and situation != "알 수 없음":
                query = "SELECT sentence, author, title FROM contents WHERE " + f"({emotion_conditions})"
                cur.execute(query, tuple([f'%{em}%' for em in emotions]))
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

# React 라우팅 처리 (SPA 지원)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    initialize_embeddings()
    app.run(host="0.0.0.0", port=5000, debug=True)