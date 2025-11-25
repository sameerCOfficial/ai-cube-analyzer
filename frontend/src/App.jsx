import { useMemo, useState } from "react";
import Header from "./components/Header";
import LabelingStudio from "./components/LabelingStudio";
import PhaseTimeline from "./components/PhaseTimeline";
import UploadForm from "./components/UploadForm";
import "./styles/main.css";

function App() {
  const [results, setResults] = useState([]);
  const [lastRun, setLastRun] = useState(null);
  const [mode, setMode] = useState("analyze");

  const insights = useMemo(() => {
    if (!results.length) {
      return [
        {
          label: "Phases detected",
          value: "0",
          description: "Upload a solve to receive instant, phase-by-phase coaching.",
        },
        {
          label: "Total analyzed time",
          value: "—",
          description: "We’ll calculate solve length once frames have been processed.",
        },
        {
          label: "Clips reviewed",
          value: "—",
          description: "Each 16-frame window adds another data point to your timeline.",
        },
      ];
    }

    const uniquePhases = new Set(results.map((entry) => entry.phase));
    const totalDuration = Math.max(
      (results[results.length - 1]?.time || 0) - (results[0]?.time || 0),
      0,
    );
    const clipCount = results.length;
    const avgWindow = clipCount ? (totalDuration / clipCount).toFixed(2) : "0.00";

    return [
      {
        label: "Phases detected",
        value: uniquePhases.size.toString(),
        description: "CFOP coverage detected across your uploaded solve.",
      },
      {
        label: "Total analyzed time",
        value: `${totalDuration.toFixed(2)}s`,
        description: "Span between the first and last confident predictions.",
      },
      {
        label: "Avg. phase window",
        value: `${avgWindow}s`,
        description: "Average duration of each analyzed clip window.",
      },
    ];
  }, [results]);

  const handleResults = (payload) => {
    setResults(Array.isArray(payload) ? payload : []);
    setLastRun(new Date());
  };

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />

      <Header phaseCount={insights[0].value} lastRun={lastRun} mode={mode} onModeChange={setMode} />

      {mode === "analyze" ? (
        <>
          <main className="layout">
            <section className="panel panel--primary">
              <UploadForm onResults={handleResults} />
            </section>
            <section className="panel panel--secondary">
              <PhaseTimeline results={results} />
            </section>
          </main>

          <section className="insights-grid">
            {insights.map((item) => (
              <article key={item.label} className="insight-card">
                <p className="insight-card__label">{item.label}</p>
                <p className="insight-card__value">{item.value}</p>
                <p className="insight-card__description">{item.description}</p>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="panel panel--full">
          <LabelingStudio />
        </section>
      )}
    </div>
  );
}

export default App;
