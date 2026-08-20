import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { subscribeToBoard } from "../lib/socket";
import BoardListColumn from "../components/BoardListColumn";

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [connected, setConnected] = useState(false);

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
            const deletedId = payload; // payload is just the card id
            return prevLists.map((l) => ({
              ...l,
              cards: l.cards.filter((c) => c.id !== deletedId),
            }));
          }
                    case "LIST_DELETED": {
            const deletedListId = payload; // payload is just the list id
            return prevLists.filter((l) => l.id !== deletedListId);
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
      // Local list will also arrive via the WebSocket broadcast; no need to refetch.
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddCard(listId, title) {
    try {
      await api.createCard(boardId, listId, { title });
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
          <input className="input-field text-sm mb-4 max-w-xs" placeholder="Search cards…" 
          value={searchQuery} onChange={
            (e) => setSearchQuery(e.target.value)
            } />
             )
          }

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-paper-dim">Loading…</p>
        ) : (
          <div className="flex gap-4 h-full items-start">
            {lists.map((list) => {
                 const filteredCards = searchQuery.trim() ? list.cards.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()) ) : list.cards;
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
            }
          )
        } 

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
        )}
      </main>
    </div>
  );
}
