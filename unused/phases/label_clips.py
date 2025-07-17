import os
from moviepy.editor import VideoFileClip
from pathlib import Path

PHASES = ["Inspection", "Cross", "F2L", "OLL", "PLL"]

def get_valid_float(prompt):
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("❌ Invalid number, try again.")

def get_phase_label():
    while True:
        phase = input("Enter phase label (Inspection, Cross, F2L, OLL, PLL): ").strip()
        if phase in PHASES:
            return phase
        print("❌ Invalid phase. Valid options:", ", ".join(PHASES))

def label_video_segments(video_path, output_root="dataset"):
    clip = VideoFileClip(video_path)
    print(f"[✓] Loaded video: {video_path} ({clip.duration:.2f}s)")

    while True:
        print("\nEnter segment to label (or 'q' to quit):")
        start_input = input("  Start time (in seconds): ").strip()
        if start_input.lower() == "q":
            break

        start = float(start_input)
        end = get_valid_float("  End time (in seconds): ")

        if end <= start or end > clip.duration:
            print("❌ Invalid time range.")
            continue

        phase = get_phase_label()

        output_dir = Path(output_root) / phase
        output_dir.mkdir(parents=True, exist_ok=True)

        basename = Path(video_path).stem
        output_filename = f"{basename}_{int(start*10):04}_{int(end*10):04}.mp4"
        output_path = output_dir / output_filename

        subclip = clip.subclip(start, end)
        subclip.write_videofile(str(output_path), codec="libx264", audio=False, verbose=False, logger=None)
        print(f"[💾] Saved to: {output_path}")

if __name__ == "__main__":
    video_file = input("Enter path to video (e.g., videos/solve1.mp4): ").strip()
    if not os.path.exists(video_file):
        print("❌ File not found.")
    else:
        label_video_segments(video_file)