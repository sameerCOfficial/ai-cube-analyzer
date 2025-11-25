import time

import cv2
import torch
from torchvision import transforms

from model import load_model as build_model

PHASES = ['Inspection', 'Cross', 'F2L', 'OLL', 'PLL']


def load_and_prepare_model(path='model.pt', device='cpu'):
    model = build_model(device=device)  # r3d_18 model initialized here
    model.load_state_dict(torch.load(path, map_location=device))
    model.eval()
    return model.to(device)

# 2. Preprocessing transform
transform = transforms.Compose([
    transforms.ToTensor(),  # converts HWC [0-255] → CHW [0-1]
    transforms.Resize((112, 112)),
    transforms.Normalize([0.5] * 3, [0.25] * 3)
])

# 3. Video → sliding window of clips
def extract_clips(video_path, frames_per_clip=16, stride=4):
    cap = cv2.VideoCapture(video_path)
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # BGR → RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame)
    cap.release()

    # Generate clips
    clips = []
    for i in range(0, len(frames) - frames_per_clip + 1, stride):
        clip = frames[i:i + frames_per_clip]
        clip_tensor = torch.stack([transform(f).float() for f in clip])  # [T, C, H, W]
        clips.append(clip_tensor.permute(1, 0, 2, 3))  # [C, T, H, W]
    return clips

# 4. Run inference
def run_inference(model, clips, device='cpu'):
    predictions = []
    with torch.no_grad():
        for clip in clips:
            clip = clip.unsqueeze(0).to(device)  # [1, C, T, H, W]
            logits = model(clip)
            pred = torch.argmax(logits, dim=1).item()
            predictions.append(pred)
    return predictions

# 5. Label mapping
def decode_predictions(predictions):
    return [PHASES[p] for p in predictions]

if __name__ == "__main__":
    model = load_model()
    clips = extract_clips("solve.mp4")
    preds = run_inference(model, clips)
    print(decode_predictions(preds))


def run_inference_with_timestamps(model, video_path, frames_per_clip=16, stride=4, device='cpu'):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame)
    cap.release()

    predictions = []
    with torch.no_grad():
        for i in range(0, len(frames) - frames_per_clip + 1, stride):
            clip = frames[i:i + frames_per_clip]
            clip_tensor = torch.stack([transform(f).float() for f in clip])  # [T, C, H, W]
            clip_tensor = clip_tensor.permute(1, 0, 2, 3).unsqueeze(0).to(device)

            logits = model(clip_tensor)
            pred = torch.argmax(logits, dim=1).item()

            timestamp_sec = i / fps
            predictions.append({
                "time": round(timestamp_sec, 2),
                "phase": PHASES[pred]
            })
    return predictions


def summarize_video(video_path, frames_per_clip=16, stride=4):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    cap.release()

    duration = round(frame_count / fps, 2) if fps else 0.0
    clips = []
    if fps and frame_count >= frames_per_clip:
        clip_index = 0
        for start in range(0, frame_count - frames_per_clip + 1, stride):
            clip_start = round(start / fps, 2)
            clip_end = round(min((start + frames_per_clip) / fps, duration), 2)
            clips.append({
                "index": clip_index,
                "start": clip_start,
                "end": clip_end
            })
            clip_index += 1

    summary = {
        "fps": fps,
        "frameCount": frame_count,
        "duration": duration,
        "framesPerClip": frames_per_clip,
        "stride": stride,
        "clips": clips,
        "createdAt": time.time()
    }
    return summary
