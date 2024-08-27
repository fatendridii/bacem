from flask import Flask, request, jsonify
from langdetect import detect
from transformers import pipeline

app = Flask(__name__)

sentiment_analyzer = pipeline("sentiment-analysis")

@app.route('/detect-language', methods=['POST'])
def detect_language():
    data = request.get_json()
    text = data['text']
    language = detect(text)
    return jsonify({'language': language})

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    text = data['text']
    
    analysis = sentiment_analyzer(text)[0]
    sentiment_score = analysis['score']
    sentiment_label = analysis['label']
    
    return jsonify({'sentiment_score': sentiment_score, 'sentiment_label': sentiment_label})

if __name__ == '__main__':
    app.run(debug=True)