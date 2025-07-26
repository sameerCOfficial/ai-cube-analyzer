from flask import Flask, request, jsonify
from flask_cors import CORS
from inference import run_inference_with_timestamps, load_and_prepare_model

app = Flask(__name__)
CORS(app)

model = load_and_prepare_model()

@app.route('/analyze', methods=['POST'])
def analyze():
    print("yoooooo")
    if 'video' not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    video = request.files['video']
    path = f"/tmp/{video.filename}"
    video.save(path)
    print("made it here!")

    results = run_inference_with_timestamps(model, path)
    print("made it here too lol")
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

