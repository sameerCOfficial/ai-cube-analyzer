import axios from "axios";
import React, { useRef, useState } from "react";
import Spinner from "./Spinner";

const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const UploadForm = ({ onResults }) => {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const analyzeFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    try {
      setLoading(true);
      setError("");
      setStatus("Uploading and analyzing frames…");

      const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = Array.isArray(response.data) ? response.data : [];
      onResults(payload);
      setStatus(`Analysis complete – ${payload.length} segments detected.`);
    } catch (err) {
      setError("Unable to analyze the video. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file (mp4, mov, mkv…).");
      setStatus("");
      return;
    }
    setStatus(`Selected ${file.name}`);
    analyzeFile(file);
  };

  const handleInputChange = (event) => {
    handleFileSelect(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="upload">
      <div className="upload__header">
        <p className="eyebrow">1. Upload</p>
        <h2>Drop a single solve video</h2>
        <p>We turn every 16-frame window into a CFOP phase prediction in seconds.</p>
      </div>

      <label
        className={`dropzone ${dragActive ? "dropzone--active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="dropzone__input"
          onChange={handleInputChange}
        />
        <p>Drag & drop your solve</p>
        <button type="button" onClick={() => inputRef.current?.click()}>
          browse files
        </button>
        <span>Supported: MP4, MOV, MKV · &lt; 200MB</span>
      </label>

      {loading && (
        <div className="upload__status">
          <Spinner />
          <p>{status}</p>
        </div>
      )}

      {!loading && status && <p className="upload__status upload__status--success">{status}</p>}
      {error && <p className="upload__status upload__status--error">{error}</p>}
    </div>
  );
};

export default UploadForm;
