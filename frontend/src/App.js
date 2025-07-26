import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [video, setVideo] = useState(null);
  const [results, setResults] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) return;

    const formData = new FormData();
    formData.append('video', video);

    const res = await axios.post("http://192.168.1.152:5001/analyze", formData);
    setResults(res.data);
  };

  return (
    <div className="App">
      <h1>Rubik’s Cube Solve Phase Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="video/*" onChange={e => setVideo(e.target.files[0])} />
        <button type="submit">Analyze</button>
      </form>

      {results.length > 0 && (
        <div>
          <h2>Detected Phases:</h2>
          <ul>
            {results.map((item, i) => (
              <li key={i}>
                ⏱ {item.time}s → 🧩 {item.phase}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
