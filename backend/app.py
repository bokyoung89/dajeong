import json
from flask import Flask, Response, request, jsonify, send_from_directory
from openai import OpenAI
from flask_cors import CORS
import os

# ✅ React 빌드 경로 지정 (Vite나 CRA에 따라 dist/build 차이 있음)
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "../frontend/dist")

app = Flask(__name__, static_folder=REACT_BUILD_DIR, static_url_path="/")
CORS(app)

# OpenAI 클라이언트 (환경변수에서 키 가져오기 권장)
client = OpenAI(api_key="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")

# ✅ React 라우팅 처리 (SPA 지원)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(REACT_BUILD_DIR, path)):
        return send_from_directory(REACT_BUILD_DIR, path)
    else:
        return send_from_directory(REACT_BUILD_DIR, "index.html")

# ✅ 감정 분석 + 격려문 생성 API
@app.route("/api/mood", methods=["POST"])
def analyze_mood():
    data = request.get_json()
    user_text = data.get("text", "").strip()
    if not user_text:
        return jsonify({"error": "문장을 입력해주세요"}), 400

    system_prompt = "너는 사용자가 입력한 문장의 감정을 분석하고, 그 감정을 위로하는 격려 문장을 만들어주는 AI야."
    user_prompt = f"""
    다음 문장에 대한 감정을 분석하고, JSON 형태로 출력해줘. 
    감정은 기쁨, 슬픔, 분노, 놀람, 혐오, 두려움 중 하나로 해줘. 
    그리고 그 감정을 위로하는 격려 문장을 한국 문학 작품 속에서 찾아서 만들어줘.
    출처도 함께 포함해줘 (책 제목과 저자).
    문장: {user_text}
    출력형식: {{"emotion": "감정", "encouragement": "격려문", "source": "출처 (책 제목, 저자)"}}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=200
    )

    response_text = response.choices[0].message.content.strip()
    try:
        result = json.loads(response_text.replace("'", '"'))
        if not isinstance(result, dict):
            raise ValueError("응답이 dict 형식이 아님")
    except Exception:
        result = {"emotion": "알 수 없음", "encouragement": response_text, "source": ""}

    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
