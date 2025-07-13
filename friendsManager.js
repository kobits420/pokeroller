// friendsManager.js

const API_BASE = '/api/user/friends';

export async function fetchFriends(token) {
    const res = await fetch(`${API_BASE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
}

export async function fetchFriendRequests(token) {
    const res = await fetch(`${API_BASE}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
}

export async function sendFriendRequest(username, token) {
    const res = await fetch(`${API_BASE}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username })
    });
    return res.json();
}

export async function acceptFriendRequest(userId, token) {
    const res = await fetch(`${API_BASE}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
    });
    return res.json();
}

export async function declineFriendRequest(userId, token) {
    const res = await fetch(`${API_BASE}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
    });
    return res.json();
}

export async function removeFriend(userId, token) {
    const res = await fetch(`${API_BASE}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
    });
    return res.json();
}

export async function fetchNotifications(token) {
    const res = await fetch('/api/user/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
} 