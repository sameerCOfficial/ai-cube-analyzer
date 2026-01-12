# ai-cube-analyzer

AI Cube Analyzer is a full-stack coach that ingests a single Rubik’s Cube solve video and highlights the exact timestamps where Inspection, Cross, F2L, OLL, and PLL occur. The backend runs a 3D convolutional model over sliding video windows, while the React frontend visualizes the detected phases in a richly styled timeline and insight dashboard.


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

## Built-in labeling studio
 Switch to the **Label dataset** tab in the UI to manage training data:

1. **Upload a solve** – the backend stores it under `backend/uploads/` and returns clip metadata (`framesPerClip`, `stride`, `clips`).
2. **Select a solve** – the video streams from `GET /label/video/<id>` while clip rows list each window.
3. **Choose clip windows** – set clip length & stride (in seconds) so contributors can label fewer, larger segments or very granular slices. The backend regenerates the clip list via `/label/segments/<id>`.
4. **Assign phases** – choose the correct CFOP phase per clip and click “Save annotations”. Labels persist as JSON under `backend/labels/<id>.labels.json`.
