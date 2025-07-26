import Header from "./components/Header";
import UploadForm from "./components/UploadForm";
import PhaseTimeline from "./components/PhaseTimeline";
import { useState } from "react";
import "./styles/main.css";

function App() {
  const [results, setResults] = useState([]);
  return (
    <div>
      <Header />
      <UploadForm onResults={setResults} />
      <PhaseTimeline results={results} />
    </div>
  );
}

export default App;
