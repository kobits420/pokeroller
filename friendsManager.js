// friendsManager.js
import apiClient from './utils/apiClient.js';

export async function fetchFriends(token) {
    console.log('fetchFriends called with token:', token ? token.substring(0, 20) + '...' : 'null');
    apiClient.setToken(token);
    try {
        const result = await apiClient.request('/user/friends');
        console.log('fetchFriends result:', result);
        return result;
    } catch (error) {
        console.error('fetchFriends error:', error);
        throw error;
    }
}

export async function fetchFriendRequests(token) {
    apiClient.setToken(token);
    return apiClient.request('/user/friends/requests');
}

export async function sendFriendRequest(username, token) {
    apiClient.setToken(token);
    return apiClient.request('/user/friends/request', {
        method: 'POST',
        body: JSON.stringify({ username })
    });
}

export async function acceptFriendRequest(userId, token) {
    apiClient.setToken(token);
    return apiClient.request('/user/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
}

export async function declineFriendRequest(userId, token) {
    apiClient.setToken(token);
    return apiClient.request('/user/friends/decline', {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
}

export async function removeFriend(userId, token) {
    apiClient.setToken(token);
    return apiClient.request('/user/friends/remove', {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
}

export async function fetchNotifications(token) {
    apiClient.setToken(token);
    return apiClient.request('/user/notifications');
} 