import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function BoardsPage() {
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listBoards()
      .then(setBoards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const board = await api.createBoard({ title: newTitle.trim() });
      setBoards((prev) => [...prev, board]);
      setNewTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl text-paper font-semibold">Your boards</h1>
          <p className="text-paper-dim text-sm mt-1">
            Signed in as {user?.name}
          </p>
        </div>
        <button onClick={logout} className="btn-secondary text-sm">
          Sign out
        </button>
      </header>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          className="input-field"
          placeholder="New board title…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
          {creating ? "Creating…" : "New board"}
        </button>
      </form>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : boards.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-paper-dim">
          No boards yet. Create your first one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              to={`/boards/${board.id}`}
              className="bg-surface border border-border rounded-lg p-5 hover:border-teal transition-colors"
            >
              <h2 className="text-lg text-paper font-medium">{board.title}</h2>
              {board.description && (
                <p className="text-paper-dim text-sm mt-1">{board.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
