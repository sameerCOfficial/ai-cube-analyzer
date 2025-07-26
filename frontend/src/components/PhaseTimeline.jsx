const PhaseTimeline = ({ results }) => (
  <div className="mt-6 px-4 max-w-2xl mx-auto">
    {results.length === 0 ? (
      <p className="text-gray-500 text-center">No results yet.</p>
    ) : (
      <ul className="space-y-2">
        {results.map((entry, idx) => (
          <li key={idx} className="flex justify-between items-center bg-gray-100 p-3 rounded shadow">
            <span className="font-mono text-sm text-gray-700">{entry.time}s</span>
            <span className={`font-bold ${getColor(entry.phase)}`}>{entry.phase}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const getColor = (phase) => {
  const colors = {
    Inspection: "text-blue-600",
    Cross: "text-yellow-600",
    F2L: "text-green-600",
    OLL: "text-purple-600",
    PLL: "text-pink-600",
  };
  return colors[phase] || "text-gray-800";
};

export default PhaseTimeline;
