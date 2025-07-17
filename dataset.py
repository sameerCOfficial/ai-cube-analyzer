from torchvision.io import read_video
from torchvision import transforms as T
from torch.utils.data import Dataset
import torch
import os
import random

PHASES = ['Inspection', 'Cross', 'F2L', 'OLL', 'PLL']

class CubePhaseDataset(Dataset):
    def __init__(self, root, frames_per_clip=16, transform=None):
        self.samples = []
        self.frames_per_clip = frames_per_clip
        self.transform = transform or T.Compose([
            T.Resize((112, 112)),
            T.Normalize([0.5] * 3, [0.25] * 3)
        ])

        for label, phase in enumerate(PHASES):
            phase_path = os.path.join(root, phase)
            if not os.path.exists(phase_path):
                continue
            for fname in os.listdir(phase_path):
                if fname.endswith('.mp4'):
                    self.samples.append((os.path.join(phase_path, fname), label))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]

        try:
            video, _, _ = read_video(path, pts_unit='sec')  # [T, H, W, C]
        except Exception as e:
            print(f"[ERROR] Failed to read {path}: {e}")
            return self.__getitem__((idx + 1) % len(self.samples))

        # Force RGB
        if video.shape[-1] > 3:
            video = video[..., :3]
        elif video.shape[-1] < 3:
            video = video.expand(video.shape[0], video.shape[1], video.shape[2], 3)

        video = video.permute(0, 3, 1, 2).float() / 255.0  # [T, C, H, W]

        # Drop clips that are too short
        if video.shape[0] < self.frames_per_clip:
            print(f"[SKIP] Too short: {path} with {video.shape[0]} frames")
            return self.__getitem__((idx + 1) % len(self.samples))

        # Clip to length
        start = random.randint(0, video.shape[0] - self.frames_per_clip)
        video = video[start:start + self.frames_per_clip]  # [T, C, H, W]

        # Transform per frame
        try:
            video = torch.stack([self.transform(frame) for frame in video])  # [T, C, H, W]
        except Exception as e:
            print(f"[SKIP] Failed transform on {path}: {e}")
            return self.__getitem__((idx + 1) % len(self.samples))

        return video.permute(1, 0, 2, 3), label  # [C, T, H, W]

ds = CubePhaseDataset("dataset")
x, y = ds[0]
print(x.shape, y)  # Expect: torch.Size([3, 16, 112, 112])
