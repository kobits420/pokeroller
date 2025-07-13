import { fetchFriends } from './friendsManager.js';
const io = window.io;

let socket = null;
let selectedFriendId = null;
let friends = [];

function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('auth-token');
}

function renderFriendsList() {
    const list = document.getElementById('chat-friends-list');
    list.innerHTML = '';
    friends.forEach(friend => {
        const btn = document.createElement('div');
        btn.className = 'chat-friend' + (selectedFriendId === friend._id ? ' selected' : '');
        btn.textContent = friend.username;
        btn.onclick = () => {
            selectedFriendId = friend._id;
            renderFriendsList();
            document.getElementById('chat-messages').innerHTML = '';
        };
        list.appendChild(btn);
    });
}

function appendMessage(message, isMe) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-message' + (isMe ? ' me' : '');
    div.textContent = message;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function setupSocket() {
    if (socket) socket.disconnect();
    socket = io('/', {
        auth: { token: getToken() }
    });
    socket.on('private_message', ({ from, message }) => {
        if (from === selectedFriendId) {
            appendMessage(message, false);
        }
    });
}

export async function initChat() {
    // Fetch friends
    const token = getToken();
    if (!token) return;
    const res = await fetchFriends(token);
    friends = res.friends || [];
    renderFriendsList();
    setupSocket();

    // UI logic
    const chatWindow = document.getElementById('chat-window');
    const chatToggle = document.getElementById('chat-toggle');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    chatToggle.onclick = () => {
        chatWindow.classList.toggle('hidden');
        chatWindow.classList.toggle('active');
        chatToggle.style.display = chatWindow.classList.contains('hidden') ? 'flex' : 'none';
    };
    chatClose.onclick = () => {
        chatWindow.classList.add('hidden');
        chatWindow.classList.remove('active');
        chatToggle.style.display = 'flex';
    };
    chatWindow.onclick = () => {
        chatWindow.classList.add('active');
    };
    chatWindow.onblur = () => {
        chatWindow.classList.remove('active');
    };
    chatForm.onsubmit = (e) => {
        e.preventDefault();
        if (!selectedFriendId || !chatInput.value.trim()) return;
        socket.emit('private_message', { to: selectedFriendId, message: chatInput.value });
        appendMessage(chatInput.value, true);
        chatInput.value = '';
    };
} 