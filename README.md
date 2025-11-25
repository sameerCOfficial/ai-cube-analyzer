# ai-cube-analyzer

AI Cube Analyzer is a full-stack coach that ingests a single Rubik’s Cube solve video and highlights the exact timestamps where Inspection, Cross, F2L, OLL, and PLL occur. The backend runs a 3D convolutional model over sliding video windows, while the React frontend visualizes the detected phases in a richly styled timeline and insight dashboard.

## Highlights
- 🧠 **3D ConvNet inference** – `r3d_18` backbone fine-tuned on cube solves and exported to `backend/model.pt`.
- 🎬 **Video clipper** – converts every 16-frame window into normalized tensors for inference with configurable stride.
- 🎯 **Insightful UI** – drag-and-drop uploader, real-time status, and color-coded timeline with coaching tips per phase.
- 🏷️ **Labeling studio** – upload solves, review clip windows, and assign CFOP phases directly inside the app.
- 🔌 **Simple REST API** – one `POST /analyze` endpoint that returns ordered `{ time, phase }` predictions.
- ⚙️ **Configurable training** – tweak dataset and training hyperparameters through `config.yaml`.

## Project structure

```
backend/
  app.py              # Flask server exposing /analyze
  inference.py        # Clip extraction + inference helpers
  model.py            # r3d_18 definition and loading logic
  model.pt            # Trained weights (tracked locally)
frontend/
  src/                # React app with redesigned UI
requirements.txt      # Python dependencies for the backend
config.yaml           # Dataset + training hyperparameters
```

## Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- ffmpeg / OpenCV runtime libs (macOS homebrew: `brew install ffmpeg opencv`)
- A GPU is optional for inference but speeds up processing if available.

## Quick start

### 1. Backend API
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r ../requirements.txt
python app.py
```
This launches Flask on `http://0.0.0.0:5001/analyze`. Ensure `model.pt` exists in `backend/` or update `load_and_prepare_model` with the correct path.

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
Create React App will serve the UI at `http://localhost:3000`. By default it targets `http://localhost:5001`. To point at a different backend, start the frontend with `REACT_APP_API_BASE="https://your-host" npm start`.

## API contract
- **Endpoint:** `POST /analyze`
- **Body:** `multipart/form-data` with a `video` field (MP4/MOV/MKV)
- **Response:** JSON array ordered by capture time

```jsonc
[
  { "time": 0.00, "phase": "Inspection" },
  { "time": 4.25, "phase": "Cross" },
  { "time": 9.87, "phase": "F2L" },
  { "time": 16.03, "phase": "OLL" },
  { "time": 19.44, "phase": "PLL" }
]
```

## Built-in labeling studio
 Switch to the **Label dataset** tab in the UI to manage training data:

1. **Upload a solve** – the backend stores it under `backend/uploads/` and returns clip metadata (`framesPerClip`, `stride`, `clips`).
2. **Select a solve** – the video streams from `GET /label/video/<id>` while clip rows list each window.
3. **Choose clip windows** – set clip length & stride (in seconds) so contributors can label fewer, larger segments or very granular slices. The backend regenerates the clip list via `/label/segments/<id>`.
4. **Assign phases** – choose the correct CFOP phase per clip and click “Save annotations”. Labels persist as JSON under `backend/labels/<id>.labels.json`.

Available labeling endpoints:
- `POST /label/upload` – store video + return metadata
- `GET /label/videos` – list stored solves + clip info
- `GET /label/annotations/<id>` – fetch saved labels
- `POST /label/annotations/<id>` – persist `{ clipIndex, start, end, phase }[]`
- `POST /label/segments/<id>` – regenerate clip metadata with custom clip & stride seconds
- `GET /label/video/<id>` – stream the original video for playback

These files stay local, so you can periodically sync them to Google Drive/Colab for training.

## Configuration & training
- `config.yaml` controls dataset paths, frames per clip, batch size, epochs, and learning rate.
- `backend/inference.py` exposes `frames_per_clip` and `stride`; keep these consistent with training for optimal accuracy.
- Swap the backbone or fine-tune parameters in `backend/model.py` and re-export `model.pt`.

## Troubleshooting
- **“Unable to analyze video”** – confirm the backend console isn’t reporting CUDA/torch errors and that the request size is under your server limits.
- **OpenCV video read errors** – install the correct codec libraries for your OS; macOS users can run `brew install ffmpeg`.
- **CORS issues** – Flask already enables CORS via `flask_cors.CORS`. If hosting separately, set `REACT_APP_API_BASE` to the deployed backend URL.

## Roadmap ideas
- Support multiple solves per upload and aggregate averages.
- Export annotated videos with overlays.
- Add authentication plus solve history storage.
- Ship a lightweight mobile-friendly UI.