import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { api } from "../lib/api";
import { subscribeToBoard } from "../lib/socket";
import BoardListColumn from "../components/BoardListColumn";

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Tracks card ids that just changed via WebSocket, so we can flash them
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState(new Set());
  const flashTimers = useRef({});

  const flagRecentlyUpdated = useCallback((cardId) => {
    setRecentlyUpdatedIds((prev) => new Set(prev).add(cardId));
    clearTimeout(flashTimers.current[cardId]);
    flashTimers.current[cardId] = setTimeout(() => {
      setRecentlyUpdatedIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 1000);
  }, []);

  const loadBoard = useCallback(() => {
    setLoading(true);
    api
      .getBoardDetail(boardId)
      .then(setLists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Live updates: merge incoming WebSocket events into local state
  useEffect(() => {
    const unsubscribe = subscribeToBoard(boardId, (event) => {
      setConnected(true);
      const { type, payload } = event;

      setLists((prevLists) => {
        switch (type) {
          case "LIST_CREATED": {
            if (prevLists.some((l) => l.id === payload.id)) return prevLists;
            return [...prevLists, payload];
          }
          case "LIST_DELETED": {
            const deletedListId = payload;
            return prevLists.filter((l) => l.id !== deletedListId);
          }
          case "CARD_CREATED": {
            return prevLists.map((l) =>
              l.id === payload.listId
                ? { ...l, cards: [...l.cards.filter((c) => c.id !== payload.id), payload] }
                : l
            );
          }
          case "CARD_UPDATED":
          case "CARD_MOVED": {
            return prevLists.map((l) => {
              const withoutCard = l.cards.filter((c) => c.id !== payload.id);
              if (l.id === payload.listId) {
                return { ...l, cards: [...withoutCard, payload] };
              }
              return { ...l, cards: withoutCard };
            });
          }
          case "CARD_DELETED": {
            const deletedId = payload;
            return prevLists.map((l) => ({
              ...l,
              cards: l.cards.filter((c) => c.id !== deletedId),
            }));
          }
          default:
            return prevLists;
        }
      });

      if (type === "CARD_CREATED" || type === "CARD_UPDATED" || type === "CARD_MOVED") {
        flagRecentlyUpdated(payload.id);
      }
    });

    return unsubscribe;
  }, [boardId, flagRecentlyUpdated]);

  async function handleAddList(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      await api.createList(boardId, { title: newListTitle.trim() });
      setNewListTitle("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddCard(listId, title, dueDate) {
    try {
      await api.createCard(boardId, listId, { title, dueDate });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCard(cardId) {
    try {
      await api.deleteCard(boardId, cardId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteList(listId) {
    try {
      await api.deleteList(boardId, listId);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("card-")) return;

    const activeCardId = Number(activeId.replace("card-", ""));

    let sourceListIndex = -1;
    let sourceCardIndex = -1;
    let movedCard = null;

    lists.forEach((l, li) => {
      const ci = l.cards.findIndex((c) => c.id === activeCardId);
      if (ci !== -1) {
        sourceListIndex = li;
        sourceCardIndex = ci;
        movedCard = l.cards[ci];
      }
    });

    if (sourceListIndex === -1) return;

    let destListIndex = -1;
    let destCardIndex = -1;

    if (overId.startsWith("list-")) {
      const destListId = Number(overId.replace("list-", ""));
      destListIndex = lists.findIndex((l) => l.id === destListId);
      destCardIndex = destListIndex !== -1 ? lists[destListIndex].cards.length : 0;
    } else if (overId.startsWith("card-")) {
      const overCardId = Number(overId.replace("card-", ""));
      lists.forEach((l, li) => {
        const ci = l.cards.findIndex((c) => c.id === overCardId);
        if (ci !== -1) {
          destListIndex = li;
          destCardIndex = ci;
        }
      });
    }

    if (destListIndex === -1) return;
    if (sourceListIndex === destListIndex && sourceCardIndex === destCardIndex) return;

    const newLists = lists.map((l) => ({ ...l, cards: [...l.cards] }));
    newLists[sourceListIndex].cards.splice(sourceCardIndex, 1);

    let insertIndex = destCardIndex;
    if (sourceListIndex === destListIndex && sourceCardIndex < destCardIndex) {
      insertIndex = destCardIndex - 1;
    }

    const updatedCard = { ...movedCard, listId: newLists[destListIndex].id };
    newLists[destListIndex].cards.splice(insertIndex, 0, updatedCard);

    setLists(newLists);

    const listsToPersist =
      sourceListIndex === destListIndex
        ? [newLists[destListIndex]]
        : [newLists[sourceListIndex], newLists[destListIndex]];

    listsToPersist.forEach((l) => {
      l.cards.forEach((c, idx) => {
        api
          .updateCard(boardId, c.id, { listId: l.id, position: idx })
          .catch((err) => setError(err.message));
      });
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/boards" className="text-paper-dim hover:text-paper text-sm">
            ← Boards
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs text-paper-dim">
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-teal" : "bg-paper-dim"}`}
          />
          {connected ? "Live" : "Connecting…"}
        </div>
      </header>

      <main className="flex-1 px-6 py-6 overflow-x-auto">
        {!loading && (
          <input
            className="input-field text-sm mb-4 max-w-xs"
            placeholder="Search cards…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-paper-dim">Loading…</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {lists.map((list) => {
                const filteredCards = searchQuery.trim()
                  ? list.cards.filter((c) =>
                      c.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : list.cards;
                return (
                  <BoardListColumn
                    key={list.id}
                    list={{ ...list, cards: filteredCards }}
                    recentlyUpdatedIds={recentlyUpdatedIds}
                    onAddCard={handleAddCard}
                    onDeleteCard={handleDeleteCard}
                    onDeleteList={handleDeleteList}
                  />
                );
              })}

              <form
                onSubmit={handleAddList}
                className="w-72 shrink-0 bg-surface/50 border border-dashed border-border rounded-lg p-3"
              >
                <input
                  className="input-field text-sm mb-2"
                  placeholder="New list title…"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                />
                <button type="submit" className="btn-secondary text-xs w-full">
                  + Add list
                </button>
              </form>
            </div>
          </DndContext>
        )}
      </main>
    </div>
  );
}