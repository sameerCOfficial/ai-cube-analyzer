import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision.models.video import r3d_18
from unused.dataset import CubePhaseDataset
import yaml
from tqdm import tqdm
import os

# Load config
with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Dataset & DataLoader
dataset = CubePhaseDataset(
    root=config["dataset_path"],
    frames_per_clip=config["frames_per_clip"]
)
train_loader = DataLoader(dataset, batch_size=config["batch_size"], shuffle=True)

# Model
model = r3d_18(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, 5)  # 5 phases
model = model.to(device)

# Optimizer & Loss
optimizer = torch.optim.Adam(model.parameters(), lr=config["learning_rate"])
criterion = nn.CrossEntropyLoss()

# Training loop
for epoch in range(config["epochs"]):
    model.train()
    total_loss = 0
    correct = 0

    for videos, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{config['epochs']}"):
        videos, labels = videos.to(device), labels.to(device)

        outputs = model(videos)
        loss = criterion(outputs, labels)
        total_loss += loss.item()

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()

    acc = correct / len(dataset)
    print(f"Epoch {epoch+1}: Loss = {total_loss:.4f}, Accuracy = {acc:.4f}")

# Save model
os.makedirs("checkpoints", exist_ok=True)
torch.save(model.state_dict(), "checkpoints/r3d18_phase_classifier.pt")
print("✅ Model saved to checkpoints/r3d18_phase_classifier.pt")
