import React, { useState } from "react";
import axios from "axios";

const UploadForm = ({ onResults }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5001/analyze", formData);
      onResults(res.data);
    } catch (err) {
      setError("Failed to analyze video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-6 text-center">
      <input type="file" accept="video/*" onChange={handleUpload} className="mb-3" />
      {loading && <div className="text-blue-600">Analyzing...</div>}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
};

export default UploadForm;
