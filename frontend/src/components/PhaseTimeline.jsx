const PHASE_STYLES = {
  Inspection: { accent: "#7C3AED", tip: "Use this time to plan your cross and first pair." },
  Cross: { accent: "#FCD34D", tip: "Look for fingertricks that keep the cube oriented for F2L." },
  F2L: { accent: "#34D399", tip: "Track your next pair before finishing the current insertion." },
  OLL: { accent: "#A78BFA", tip: "Stabilize your grip to transition faster to PLL." },
  PLL: { accent: "#F472B6", tip: "Settle on an execution order to minimize cube rotations." },
};

const formatTime = (time) => `${Number(time).toFixed(2)}s`;

const PhaseTimeline = ({ results }) => {
  if (!results.length) {
    return (
      <div className="timeline timeline--empty">
        <p className="eyebrow">2. Review</p>
        <h2>Phase timeline</h2>
        <p>Upload a solve to visualize the moment each CFOP phase begins.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline__header">
        <p className="eyebrow">2. Review</p>
        <h2>Phase timeline</h2>
        <p>Each marker represents a 16-frame window classified by the 3D CNN.</p>
      </div>

      <ul className="timeline__list">
        {results.map((entry, index) => {
          const { accent, tip } = PHASE_STYLES[entry.phase] || {
            accent: "#7c90ff",
            tip: "Keep the solve smooth to help the model stay confident.",
          };

          return (
            <li key={`${entry.phase}-${entry.time}-${index}`} className="timeline__item">
              <div className="timeline__marker" style={{ borderColor: `${accent}40` }}>
                <span style={{ background: accent }} />
              </div>

              <div className="timeline__card">
                <div className="timeline__card-head">
                  <p>{entry.phase}</p>
                  <span>{formatTime(entry.time)}</span>
                </div>
                <p className="timeline__tip">{tip}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PhaseTimeline;
