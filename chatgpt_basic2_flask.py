import json
from flask import Flask, request, jsonify
from openai import OpenAI

# 원래 코드와 동일(키는 환경변수로)
client = OpenAI(api_key="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")

# 원래 코드 변수 그대로 둠
description = "너는 다음 글에 대해 감정을 분석하는 AI야"

question = """각각의 문장에 대해 감정을 분석해줘. 그리고 json 형태(감정, 문장)로 출력해줘.
감정은 기쁨, 슬픔, 분노, 놀람, 혐오, 두려움 중 하나로 표현해줘.
1. 나는 오늘 아침에 일찍 일어났다.
2. 날씨가 너무 좋았다."""

app = Flask(__name__)

# Flask hello world route
@app.route("/", methods=["GET"])
def hello():
    return "안녕하세요~~ 처음 만들어보는 flask 서버입니다!"


@app.route("/analyze", methods=["POST"])
def analyze():
    # body로 description/question 받으면 교체, 없으면 기존 기본값 사용
    data = request.get_json(silent=True) or {}
    desc = data.get("description", description)
    ques = data.get("question", question)

    messages = [
        {"role": "system", "content": desc},
        {"role": "user", "content": ques},
    ]

    # 원래 코드와 동일: stream=True로 토큰 누적
    gpt_answer = ""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
        max_tokens=100,
    )

    for chunk in response:
        chunk_content = chunk.choices[0].delta.content
        if isinstance(chunk_content, str):
            gpt_answer += chunk_content
            # 서버 로그에 원래처럼 토큰 단위 출력
            print(chunk_content, end="")


    # 클라이언트에는 최종 문자열을 JSON으로 반환
    return gpt_answer

if __name__ == "__main__":
    # Flask 개발 서버 실행
    # 환경변수 OPENAI_API_KEY 설정 후 실행하세요.
    # 예) Linux/macOS:  export OPENAI_API_KEY="sk-..."
    #     Windows(PowerShell):  setx OPENAI_API_KEY "sk-..."
    app.run(host="0.0.0.0", port=5000, debug=True)