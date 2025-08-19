from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 모든 도메인 허용 (개발용)
