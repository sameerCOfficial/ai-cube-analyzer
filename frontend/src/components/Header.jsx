const Header = ({ phaseCount, lastRun, mode = "analyze", onModeChange = () => {} }) => {
  const isLabeling = mode === "label";
  const titleParts = isLabeling
    ? { primary: "Build your personalized", highlight: "dataset" }
    : { primary: "Break down every solve", highlight: "phase-by-phase" };
  const paragraph = isLabeling
    ? "Collect raw solves, segment the clip windows, and tag each CFOP phase to keep improving the model without leaving the app."
    : "Upload a single video and let the model timestamp Inspection, Cross, F2L, OLL, and PLL in a clean timeline. Every clip is processed on-device for rapid feedback.";

  return (
    <header className="hero">
      <div className="hero__copy">
        <div className="hero__tabs">
          <button
            type="button"
            className={`hero__tab ${!isLabeling ? "hero__tab--active" : ""}`}
            onClick={() => onModeChange("analyze")}
          >
            Analyze solve
          </button>
          <button
            type="button"
            className={`hero__tab ${isLabeling ? "hero__tab--active" : ""}`}
            onClick={() => onModeChange("label")}
          >
            Label dataset
          </button>
        </div>
        <p className="hero__eyebrow">AI Cube Analyzer</p>
        <h1>
          {titleParts.primary} <span>{titleParts.highlight}</span>
        </h1>
        <p className="hero__paragraph">{paragraph}</p>
        <div className="hero__meta">
          <div>
            <p className="hero__meta-label">Phases profiled</p>
            <p className="hero__meta-value">{phaseCount}</p>
          </div>
          <div>
            <p className="hero__meta-label">Last analysis</p>
            <p className="hero__meta-value">
              {lastRun ? lastRun.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </div>
        </div>
      </div>
      <div className="hero__badge">
        <p>Powered by 3D ConvNets</p>
        <span>16-frame windows · Sliding stride</span>
      </div>
    </header>
  );
};

export default Header;