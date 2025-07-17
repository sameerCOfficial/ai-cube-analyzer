import matplotlib.pyplot as plt

def plot_hand_speed_timeline(speeds, fps=30, save_path=None):
    """
    Plot hand movement speeds over time.
    """
    seconds = [i / fps for i in range(len(speeds))]

    plt.figure(figsize=(12, 4))
    plt.plot(seconds, speeds, color='blue', linewidth=1.5)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Hand Movement Speed")
    plt.title("TPS-style Hand Motion Timeline")
    plt.grid(True)

    if save_path:
        plt.savefig(save_path)
        print(f"[✓] Saved plot to {save_path}")
    else:
        plt.show()
