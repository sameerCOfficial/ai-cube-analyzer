def detect_pauses(speeds, threshold=0.002, min_frames=15):
    """
    Return a list of (start_frame, end_frame) for low-movement (pause) periods.
    """
    pauses = []
    in_pause = False
    start = 0

    for i, speed in enumerate(speeds):
        if speed < threshold:
            if not in_pause:
                start = i
                in_pause = True
        else:
            if in_pause:
                if i - start >= min_frames:
                    pauses.append((start, i - 1))
                in_pause = False

    # If it ends on a pause
    if in_pause and (len(speeds) - start) >= min_frames:
        pauses.append((start, len(speeds) - 1))

    return pauses
