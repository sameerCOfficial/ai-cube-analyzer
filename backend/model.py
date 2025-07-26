import torch
from torchvision.models.video import r3d_18

NUM_CLASSES = 5

def load_model(weights_path="model.pt", device="cpu"):
    model = r3d_18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, NUM_CLASSES)

    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.to(device)
    model.eval()
    
    return model
