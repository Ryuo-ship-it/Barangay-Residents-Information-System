// js/api.js – thin wrapper around fetch for BRIS backend
const API_BASE = 'http://localhost:3000';

window.BRISAPI = {
  // ---- Puroks ----
  getPuroks: async () => {
    const r = await fetch(`${API_BASE}/puroks`);
    return r.json();
  },

  // ---- Households ----
  getHouseholds: async () => {
    const r = await fetch(`${API_BASE}/households`);
    return r.json();
  },

  createHousehold: async (data) => {
    const r = await fetch(`${API_BASE}/households`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.json();
  },

  // ---- Residents ----
  getResidents: async () => {
    const r = await fetch(`${API_BASE}/residents`);
    return r.json();
  },

  createResident: async (data) => {
    const r = await fetch(`${API_BASE}/residents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.json();
  },

  updateResident: async (id, data) => {
    const r = await fetch(`${API_BASE}/residents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.json();
  },

  deleteResident: async (id) => {
    const r = await fetch(`${API_BASE}/residents/${id}`, { method: 'DELETE' });
    return r.json();
  },

  // ---- Profile ----
  getProfile: async () => {
    const r = await fetch(`${API_BASE}/profile`);
    return r.json();
  },

  setProfile: async (data) => {
    const r = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.json();
  }
};
