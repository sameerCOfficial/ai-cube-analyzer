import cv2
import mediapipe as mp
import numpy as np

mp_hands = mp.solutions.hands

class HandTracker:
    def __init__(self, max_num_hands=2, detection_confidence=0.5, tracking_confidence=0.5):
        self.hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=detection_confidence,
            min_tracking_confidence=tracking_confidence
        )
        self.previous_positions = {}

    def process_frame(self, frame, frame_idx):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.hands.process(rgb_frame)

        frame_speeds = []

        if result.multi_hand_landmarks:
            for hand_index, hand_landmarks in enumerate(result.multi_hand_landmarks):
                coords = np.array([
                    [lm.x, lm.y] for lm in hand_landmarks.landmark
                ])
                hand_center = coords.mean(axis=0)

                # Use hand index (0 or 1) to track separately
                prev = self.previous_positions.get(hand_index)
                speed = 0.0

                if prev is not None:
                    dist = np.linalg.norm(hand_center - prev)
                    speed = dist

                self.previous_positions[hand_index] = hand_center
                frame_speeds.append(speed)
        else:
            # No hands detected
            self.previous_positions = {}

        return frame_speeds  # could be [] or [speed1, speed2]

    def close(self):
        self.hands.close()
