// API Client for communicating with the backend
class ApiClient {
    constructor() {
        // Change base API URL to relative path
        const API_BASE = '/api';
        this.baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://your-backend-url.com/api' 
            : `${API_BASE}`;
        this.token = localStorage.getItem('auth-token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth-token', token);
        } else {
            localStorage.removeItem('auth-token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: this.getHeaders(),
                ...options
            };

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Game endpoints
    async saveGameProgress(gameData) {
        return this.request('/game/save', {
            method: 'POST',
            body: JSON.stringify({ gameData })
        });
    }

    async getGameProgress() {
        return this.request('/game/progress');
    }

    async claimAchievement(achievementId, reward) {
        return this.request('/game/achievements/claim', {
            method: 'POST',
            body: JSON.stringify({ achievementId, reward })
        });
    }

    async equipTitle(title) {
        return this.request('/game/titles/equip', {
            method: 'POST',
            body: JSON.stringify({ title })
        });
    }

    async updateFavorites(pokemonId, action) {
        return this.request('/game/favorites', {
            method: 'POST',
            body: JSON.stringify({ pokemonId, action })
        });
    }

    async updateInventory(itemName, quantity, action) {
        return this.request('/game/inventory', {
            method: 'POST',
            body: JSON.stringify({ itemName, quantity, action })
        });
    }

    async updateAvatar(avatar) {
        return this.request('/game/avatar', {
            method: 'POST',
            body: JSON.stringify({ avatar })
        });
    }

    // User endpoints
    async getUserProfile() {
        return this.request('/user/profile');
    }

    async updateUserProfile(username, avatar) {
        return this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, avatar })
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/user/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    async getLeaderboard(limit = 10) {
        return this.request(`/user/leaderboard?limit=${limit}`);
    }

    async getUserStats() {
        return this.request('/user/stats');
    }

    async deleteAccount(password) {
        return this.request('/user/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient; 