from openai import OpenAI


client = OpenAI(api_key="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")



description = "너는 다음 글에 대해 감정을 분석하는 AI야"

question = """각각의 문장에 대해 감정을 분석해줘. 그리고 json 형태(감정, 문장)로 출력해줘.
감정은 기쁨, 슬픔, 분노, 놀람, 혐오, 두려움 중 하나로 표현해줘.
1. 나는 오늘 아침에 일찍 일어났다.
2. 날씨가 너무 좋았다.
3. 회사에서 야근을 하고와서 힘들었다
4. 상사 때문에 일을 다 망쳤다."""



# ChatGPT 질문 코드
messages = [
    {"role": "system", "content": description},
    {"role": "user", "content": question},
]


# ChatGPT 질문 코드
gpt_answer = ''  # 최종 답변 string
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    stream=True,
    max_tokens=100,
)


# 이미지 설명 출력
for chunk in response:
    chunk_content = chunk.choices[0].delta.content # chunk 를 저장
    if isinstance(chunk_content, str): # chunk 가 문자열이면 final_answer 에 추가
        gpt_answer += chunk_content
        print(chunk_content, end="") # 토큰 단위로 실시간 답변 출력
