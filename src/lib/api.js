const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("taskboard_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body;
}

export const api = {
  signup: (data) => request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  listBoards: () => request("/boards"),
  createBoard: (data) => request("/boards", { method: "POST", body: JSON.stringify(data) }),
  getBoardDetail: (boardId) => request(`/boards/${boardId}`),

  createList: (boardId, data) =>
    request(`/boards/${boardId}/lists`, { method: "POST", body: JSON.stringify(data) }),

  createCard: (boardId, listId, data) =>
    request(`/boards/${boardId}/lists/${listId}/cards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCard: (boardId, cardId, data) =>
    request(`/boards/${boardId}/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCard: (boardId, cardId) =>
    request(`/boards/${boardId}/cards/${cardId}`, { method: "DELETE" }),
};

export { getToken };
