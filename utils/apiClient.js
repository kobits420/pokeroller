// API Client for communicating with the backend
class ApiClient {
    constructor() {
        // Configure API base URL to use the same hostname as the frontend
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        // Use the same hostname but port 3001 for the backend
        this.baseURL = `http://${currentHost}:3001/api`;
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

            console.log('Making API request to:', url);
            const response = await fetch(url, config);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response received:', text);
                throw new Error('Server returned non-JSON response');
            }
            
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
        console.log('Saving game progress to backend...');
        console.log('Game data structure:', Object.keys(gameData));
        console.log('Users in game data:', gameData.users ? Object.keys(gameData.users) : 'No users object');
        
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