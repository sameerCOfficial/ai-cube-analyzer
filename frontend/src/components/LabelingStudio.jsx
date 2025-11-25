import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import Spinner from "./Spinner";

const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5001";
const PHASES = ["Inspection", "Cross", "F2L", "OLL", "PLL"];

const LabelingStudio = () => {
  const fileInputRef = useRef(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [annotations, setAnnotations] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [segmentConfig, setSegmentConfig] = useState({
    clipSeconds: 2,
    strideSeconds: 1,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/label/videos`);
      setVideos(response.data.videos || []);
    } catch (err) {
      setError("Unable to load labeled videos.");
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus("Uploading solve for labeling…");
    setError("");

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await axios.post(`${API_BASE_URL}/label/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchVideos();
      setStatus(`Uploaded ${response.data.filename}. Select it to begin labeling.`);
    } catch (err) {
      setError("Upload failed. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const selectVideo = async (video) => {
    setSelectedVideo(video);
    setAnnotations({});
    setStatus("");
    setError("");
    if (video?.fps) {
      const clipSeconds = video.framesPerClip && video.fps ? Number((video.framesPerClip / video.fps).toFixed(2)) : segmentConfig.clipSeconds;
      const strideSeconds = video.stride && video.fps ? Number((video.stride / video.fps).toFixed(2)) : segmentConfig.strideSeconds;
      setSegmentConfig({
        clipSeconds,
        strideSeconds,
      });
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/label/annotations/${video.videoId}`);
      const stored = response.data.annotations || [];
      const map = stored.reduce((acc, entry) => {
        acc[entry.clipIndex] = entry.phase;
        return acc;
      }, {});
      setAnnotations(map);
      if (stored.length) {
        setStatus(`Loaded ${stored.length} existing labels.`);
      }
    } catch (err) {
      setStatus("Ready to label fresh clips.");
    }
  };

  const handlePhaseChange = (clipIndex, phase) => {
    setAnnotations((prev) => ({ ...prev, [clipIndex]: phase }));
  };

  const handleSegmentInput = (field, value) => {
    setSegmentConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applySegments = async () => {
    if (!selectedVideo) return;
    const clipSeconds = Number(segmentConfig.clipSeconds);
    const strideSeconds = Number(segmentConfig.strideSeconds);
    if (!clipSeconds || clipSeconds <= 0) {
      setError("Clip length must be greater than zero.");
      return;
    }
    if (!strideSeconds || strideSeconds <= 0) {
      setError("Stride must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStatus("Regenerating clip boundaries…");
      const response = await axios.post(`${API_BASE_URL}/label/segments/${selectedVideo.videoId}`, {
        clipSeconds,
        strideSeconds,
      });
      setSelectedVideo(response.data);
      setAnnotations({});
      setStatus("Updated clip windows. Previous labels cleared.");
    } catch (err) {
      setError("Failed to regenerate clip windows.");
    } finally {
      setLoading(false);
    }
  };

  const saveAnnotations = async () => {
    if (!selectedVideo) return;
    const payload = (selectedVideo.clips || [])
      .map((clip) => ({
        clipIndex: clip.index,
        start: clip.start,
        end: clip.end,
        phase: annotations[clip.index],
      }))
      .filter((entry) => entry.phase);

    if (!payload.length) {
      setError("Apply at least one label before saving.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/label/annotations/${selectedVideo.videoId}`, {
        annotations: payload,
      });
      setStatus(`Saved ${payload.length} annotations.`);
      setError("");
    } catch (err) {
      setError("Could not save annotations.");
    } finally {
      setLoading(false);
    }
  };

  const labeledCount = useMemo(() => Object.values(annotations).filter(Boolean).length, [annotations]);

  const videoSrc = selectedVideo
    ? selectedVideo.videoUrl.startsWith("http")
      ? selectedVideo.videoUrl
      : `${API_BASE_URL}${selectedVideo.videoUrl}`
    : "";

  return (
    <div className="labeler">
      <section className="labeler__aside">
        <div className="labeler__upload">
          <p className="eyebrow">Dataset builder</p>
          <h2>Import a new solve</h2>
          <p>Store it locally, then tag each clip with the correct CFOP phase.</p>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            upload solve
          </button>
          <input ref={fileInputRef} type="file" className="sr-only" accept="video/*" onChange={handleUpload} />
          {loading && !selectedVideo && (
            <div className="labeler__status">
              <Spinner />
              <p>{status}</p>
            </div>
          )}
          {!loading && status && <p className="labeler__status labeler__status--success">{status}</p>}
          {error && <p className="labeler__status labeler__status--error">{error}</p>}
        </div>

        <div className="labeler__list">
          <p className="eyebrow">Saved solves</p>
          <ul>
            {videos.map((video) => (
              <li
                key={video.videoId}
                className={selectedVideo?.videoId === video.videoId ? "active" : ""}
                onClick={() => selectVideo(video)}
              >
                <p>{video.filename}</p>
                <span>{(video.duration || 0).toFixed(1)}s · {video.clips?.length || 0} clips</span>
              </li>
            ))}
            {!videos.length && <li className="empty">No solves yet. Upload one to begin.</li>}
          </ul>
        </div>
      </section>

      <section className="labeler__workspace">
        {!selectedVideo ? (
          <div className="labeler__placeholder">
            <p>Select a video to start labeling.</p>
          </div>
        ) : (
          <>
            <div className="labeler__player">
              <video src={videoSrc} controls preload="metadata" />
              <div className="labeler__player-meta">
                <p>{selectedVideo.filename}</p>
                <span>{selectedVideo.duration?.toFixed(1)}s total · {selectedVideo.clips?.length || 0} clips</span>
              </div>
            </div>

            <div className="clip-table">
              <div className="segment-controls">
                <div>
                  <label htmlFor="clipSeconds">Clip length (s)</label>
                  <input
                    id="clipSeconds"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={segmentConfig.clipSeconds}
                    onChange={(event) => handleSegmentInput("clipSeconds", event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="strideSeconds">Stride (s)</label>
                  <input
                    id="strideSeconds"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={segmentConfig.strideSeconds}
                    onChange={(event) => handleSegmentInput("strideSeconds", event.target.value)}
                  />
                </div>
                <button type="button" onClick={applySegments} disabled={loading}>
                  Update clips
                </button>
              </div>
              <div className="clip-table__head">
                <p className="eyebrow">Clip labels</p>
                <p>
                  {labeledCount}/{selectedVideo.clips?.length || 0} labeled
                </p>
              </div>
              <div className="clip-table__body">
                {(selectedVideo.clips || []).map((clip) => (
                  <div className="clip-row" key={clip.index}>
                    <div>
                      <p>Clip {clip.index + 1}</p>
                      <span>
                        {clip.start}s → {clip.end}s
                      </span>
                    </div>
                    <select value={annotations[clip.index] || ""} onChange={(event) => handlePhaseChange(clip.index, event.target.value)}>
                      <option value="">Unlabeled</option>
                      {PHASES.map((phase) => (
                        <option key={phase} value={phase}>
                          {phase}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {!selectedVideo.clips?.length && <p className="clip-table__empty">Not enough frames to generate clips.</p>}
              </div>
              <div className="clip-table__actions">
                <button type="button" onClick={saveAnnotations} disabled={loading || !labeledCount}>
                  {loading ? "Saving…" : "Save annotations"}
                </button>
              </div>
              {loading && selectedVideo && (
                <div className="labeler__status">
                  <Spinner />
                  <p>Saving labels…</p>
                </div>
              )}
              {error && selectedVideo && <p className="labeler__status labeler__status--error">{error}</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default LabelingStudio;

