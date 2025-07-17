import csv

def save_speeds_csv(speeds, filename='hand_speeds.csv', fps=30):
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Frame', 'Time (s)', 'Speed'])
        for i, speed in enumerate(speeds):
            writer.writerow([i, i / fps, speed])
    print(f"[✓] Saved speeds to {filename}")
