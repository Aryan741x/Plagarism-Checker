from flask import Blueprint, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from similarity_python import python_matches
import re

routes = Blueprint("routes", __name__)

def normalize(text: str) -> str:
    text = re.sub(r'(?:\s(?=\S))', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

@routes.route("/internal-plagiarism", methods=["POST"])
def internal_plagiarism():
    payload = request.get_json(force=True)
    lang = payload.get("language", "text")
    docs = payload.get("documents", [])
    # print("Received payload:", payload)
    # print("Language:", lang)
    # print("Documents received:", len(docs))


    if len(docs) < 2:
        return jsonify(matches=[])

    if lang == "python":
        try:
            matches = python_matches(docs)
        except Exception as e:
            return jsonify(error=f"Python match failed: {str(e)}"), 500
        return jsonify(matches=matches)

    try:
        texts = [normalize(d["text"]) for d in docs]
        ids = [f'{d["userId"]}:{d["fileId"]}' for d in docs]
        vectorizer = TfidfVectorizer(analyzer="word", ngram_range=(1, 3), stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(texts)
        similarity_matrix = cosine_similarity(tfidf_matrix)
        THRESHOLD = 0.75
        matches = []
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                score = float(similarity_matrix[i, j])
                if score >= THRESHOLD:
                    matches.append({
                        "source": ids[i],
                        "target": ids[j],
                        "similarity": score
                    })
        return jsonify(matches=matches)
    except Exception as e:
        return jsonify(error=f"TF-IDF match failed: {str(e)}"), 500

@routes.route("/healthz", methods=["GET"])
def healthz():
    return jsonify(status="ok")
