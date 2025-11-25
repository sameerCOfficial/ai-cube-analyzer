import json
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from inference import load_and_prepare_model, run_inference_with_timestamps, summarize_video

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
LABEL_DIR = BASE_DIR / "labels"
for directory in (UPLOAD_DIR, LABEL_DIR):
    directory.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
CORS(app)

model = load_and_prepare_model()

@app.route('/label/upload', methods=['POST'])
def upload_for_labeling():
    if 'video' not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    video = request.files['video']
    if not video.filename:
        return jsonify({"error": "Invalid filename"}), 400

    video_id = uuid.uuid4().hex
    filename = secure_filename(video.filename)
    stored_name = f"{video_id}_{filename}"
    destination = UPLOAD_DIR / stored_name
    video.save(destination)

    summary = summarize_video(str(destination))
    summary.update({
        "videoId": video_id,
        "filename": filename,
        "videoUrl": f"/label/video/{video_id}"
    })

    meta_path = LABEL_DIR / f"{video_id}.meta.json"
    with meta_path.open("w", encoding="utf-8") as meta_file:
        json.dump(summary, meta_file, indent=2)

    return jsonify(summary)


@app.route('/label/video/<video_id>', methods=['GET'])
def serve_labeled_video(video_id):
    meta = _load_metadata(video_id)
    if not meta:
        return jsonify({"error": "Video not found"}), 404

    stored_name = next(UPLOAD_DIR.glob(f"{video_id}_*"), None)
    if not stored_name:
        return jsonify({"error": "Video file missing"}), 404

    return send_file(stored_name)


@app.route('/label/videos', methods=['GET'])
def list_label_videos():
    videos = []
    for meta_file in LABEL_DIR.glob("*.meta.json"):
        try:
            with meta_file.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
                videos.append(data)
        except json.JSONDecodeError:
            continue
    videos.sort(key=lambda entry: entry.get("createdAt", 0), reverse=True)
    return jsonify({"videos": videos})


@app.route('/label/annotations/<video_id>', methods=['GET', 'POST'])
def handle_annotations(video_id):
    if request.method == 'GET':
        annotations = _load_annotations(video_id)
        return jsonify({"annotations": annotations})

    payload = request.get_json(silent=True) or {}
    annotations = payload.get("annotations", [])
    labels_path = LABEL_DIR / f"{video_id}.labels.json"
    with labels_path.open("w", encoding="utf-8") as label_file:
        json.dump(annotations, label_file, indent=2)
    return jsonify({"saved": len(annotations)})


def _load_metadata(video_id):
    meta_path = LABEL_DIR / f"{video_id}.meta.json"
    if not meta_path.exists():
        return None
    with meta_path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _load_annotations(video_id):
    labels_path = LABEL_DIR / f"{video_id}.labels.json"
    if not labels_path.exists():
        return []
    with labels_path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


@app.route('/label/segments/<video_id>', methods=['POST'])
def update_segments(video_id):
    meta_path = LABEL_DIR / f"{video_id}.meta.json"
    stored_name = next(UPLOAD_DIR.glob(f"{video_id}_*"), None)
    if not meta_path.exists() or not stored_name:
        return jsonify({"error": "Video not found"}), 404

    try:
        with meta_path.open("r", encoding="utf-8") as fh:
            meta = json.load(fh)
    except json.JSONDecodeError:
        meta = {}

    payload = request.get_json(silent=True) or {}
    clip_seconds = max(float(payload.get("clipSeconds", 0) or 0), 0)
    stride_seconds = max(float(payload.get("strideSeconds", 0) or 0), 0)
    frames_per_clip = int(payload.get("framesPerClip") or 0)
    stride = int(payload.get("stride") or 0)

    fps = meta.get("fps", 0)
    if clip_seconds and fps:
        frames_per_clip = max(1, int(round(clip_seconds * fps)))
    if stride_seconds and fps:
        stride = max(1, int(round(stride_seconds * fps)))

    if frames_per_clip <= 0:
        frames_per_clip = meta.get("framesPerClip") or 16
    if stride <= 0:
        stride = meta.get("stride") or 4

    summary = summarize_video(str(stored_name), frames_per_clip=frames_per_clip, stride=stride)
    meta.update(summary)

    with meta_path.open("w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)

    return jsonify(meta)


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'video' not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    video = request.files['video']
    path = f"/tmp/{video.filename}"
    video.save(path)

    results = run_inference_with_timestamps(model, path)
    return jsonify(results)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
