import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import BoardCard from "./BoardCard";

export default function BoardListColumn({ list, recentlyUpdatedIds, onAddCard, onDeleteCard, onDeleteList }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
  });

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddCard(list.id, title.trim(), dueDate || null);
    setTitle("");
    setDueDate("");
    setAdding(false);
  }

  return (
    <div className="w-72 shrink-0 bg-surface border border-border rounded-lg p-3 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-paper font-medium text-sm">{list.title}</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-paper-dim">{list.cards.length}</span>
          <button
            onClick={() => onDeleteList(list.id)}
            className="text-paper-dim hover:text-danger text-xs"
            aria-label="Delete list"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-2 overflow-y-auto min-h-[40px] rounded-md transition-colors ${
          isOver ? "bg-teal/10" : ""
        }`}
      >
        <SortableContext
          items={list.cards.map((c) => `card-${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              justUpdated={recentlyUpdatedIds.has(card.id)}
              onDelete={(cardId) => onDeleteCard(cardId)}
            />
          ))}
        </SortableContext>
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
          <input
            type="date"
            className="input-field text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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