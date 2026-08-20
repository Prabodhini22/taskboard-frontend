import { useState } from "react";
import BoardCard from "./BoardCard";

export default function BoardListColumn({ list, recentlyUpdatedIds, onAddCard, onDeleteCard }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddCard(list.id, title.trim());
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="w-72 shrink-0 bg-surface border border-border rounded-lg p-3 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-paper font-medium text-sm">{list.title}</h3>
        <span className="font-mono text-[10px] text-paper-dim">{list.cards.length}</span>
      </div>

      <div className="space-y-2 overflow-y-auto">
        {list.cards.map((card) => (
          <BoardCard
            key={card.id}
            card={card}
            justUpdated={recentlyUpdatedIds.has(card.id)}
            onDelete={(cardId) => onDeleteCard(cardId)}
          />
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-2 space-y-2">
          <input
            autoFocus
            className="input-field text-sm"
            placeholder="Card title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs px-3 py-1.5">
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-paper-dim text-xs hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 text-paper-dim hover:text-paper text-sm text-left px-1 py-1.5"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
