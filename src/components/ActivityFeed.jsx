function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ActivityFeed({ activities }) {
  if (!activities.length) {
    return <p className="text-paper-dim text-xs px-1">No activity yet.</p>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {activities.map((a) => (
        <div key={a.id} className="text-xs px-1">
          <p className="text-paper-dim">
            {a.description}
            <span className="text-paper-dim/50 ml-1.5 font-mono text-[10px]">
              {timeAgo(a.createdAt)}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
