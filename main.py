import cv2
import os
from hands.hand_tracker import HandTracker
from visualizer.timeline_plot import plot_hand_speed_timeline
import numpy as np
from hands.hand_tracker import HandTracker
from visualizer.timeline_plot import plot_hand_speed_timeline
from analysis.pause_reporter import detect_pauses
from utils.dataset_utils import save_speeds_csv

def analyze_hand_motion(video_path):
    cap = cv2.VideoCapture(video_path)
    tracker = HandTracker()
    frame_speeds = []

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        speeds = tracker.process_frame(frame, frame_idx)
        avg_speed = np.mean(speeds) if speeds else 0.0
        frame_speeds.append(avg_speed)

        frame_idx += 1

    cap.release()
    tracker.close()
    return frame_speeds

def main():
    filename = input("Enter the name of your video file (e.g., solve1.mp4): ").strip()
    video_path = os.path.join("videos", filename)

    if not os.path.exists(video_path):
        print(f"[!] File '{video_path}' not found.")
        return

    print(f"[✓] Processing video: {video_path}")
    hand_speeds = analyze_hand_motion(video_path)
    fps = 30

    plot_hand_speed_timeline(hand_speeds, fps=fps)

    save_speeds_csv(hand_speeds, filename=f"data/{filename}_speeds.csv", fps=fps)

    pauses = detect_pauses(hand_speeds, threshold=0.002, min_frames=15)
    print("\nDetected Pauses:")
    for start, end in pauses:
        if start == 0:
            pass
        print(f" - Pause from {start/fps:.2f}s to {end/fps:.2f}s")

if __name__ == "__main__":
    main()
