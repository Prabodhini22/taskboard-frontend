import { useEffect, useState } from "react";

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function BoardCard({ card, justUpdated, onDelete }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (justUpdated) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [justUpdated]);

  return (
    <div
      className={`bg-surface-raised border border-border rounded-md p-3 group ${
        flash ? "card-flash" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-paper text-sm font-medium leading-snug">{card.title}</p>
        <button
          onClick={() => onDelete(card.id)}
          className="text-paper-dim hover:text-danger text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-label="Delete card"
        >
          ✕
        </button>
      </div>

      {card.description && (
        <p className="text-paper-dim text-xs mt-1.5">{card.description}</p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className="font-mono text-[10px] text-paper-dim/70">
          #{String(card.id).padStart(3, "0")} · {timeAgo(card.updatedAt)}
        </span>
        {card.assigneeName && (
          <span className="text-[10px] bg-teal/15 text-teal rounded px-1.5 py-0.5">
            {card.assigneeName}
          </span>
        )}
      </div>
    </div>
  );
}
