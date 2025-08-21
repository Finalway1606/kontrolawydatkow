// Moduł API do komunikacji z serwerem
class ApiManager {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.token = localStorage.getItem('authToken');
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Sprawdź czy token jest wymagany dla tego endpointu
        const publicEndpoints = ['/api/register', '/api/login'];
        const isPublicEndpoint = publicEndpoints.some(ep => endpoint.startsWith(ep));
        
        if (!isPublicEndpoint) {
            // Odśwież token z localStorage
            this.token = localStorage.getItem('authToken');
            
            if (!this.token) {
                throw new Error('Brak tokenu dostępu');
            }
            
            config.headers['Authorization'] = `Bearer ${this.token}`;
        } else if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Metody uwierzytelniania
    async register(username, email, password) {
        const response = await this.makeRequest('/api/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', response.token);
        }
        
        return response;
    }

    async login(username, password) {
        const response = await this.makeRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', response.token);
        }
        
        return response;
    }

    // Metody kategorii i produktów
    async getCategories() {
        return await this.makeRequest('/api/categories');
    }

    async searchProducts(query, category = null) {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (category) params.append('category', category);
        
        return await this.makeRequest(`/api/products/search?${params.toString()}`);
    }

    async addProduct(name, category, price) {
        return await this.makeRequest('/api/products', {
            method: 'POST',
            body: JSON.stringify({ 
                name, 
                category, 
                price 
            })
        });
    }

    async getUserPrices() {
        return await this.makeRequest('/api/user-prices');
    }

    // Metody list zakupów
    async getLists() {
        return await this.makeRequest('/api/lists');
    }

    async createList(name) {
        return await this.makeRequest('/api/lists', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    async getListItems(listId) {
        return await this.makeRequest(`/api/lists/${listId}/items`);
    }

    async addItemToList(listId, productData) {
        return await this.makeRequest(`/api/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async deleteItemFromList(listId, itemId) {
        return await this.makeRequest(`/api/lists/${listId}/items/${itemId}`, {
            method: 'DELETE'
        });
    }

    // Metody współdzielenia
    async searchUsers(query) {
        return await this.makeRequest(`/api/users/search?query=${encodeURIComponent(query)}`);
    }

    async shareList(listId, userId, permission) {
        return await this.makeRequest(`/api/lists/${listId}/share`, {
            method: 'POST',
            body: JSON.stringify({ userId, permission })
        });
    }

    async getSharedUsers(listId) {
        return await this.makeRequest(`/api/lists/${listId}/shared`);
    }

    async removeSharing(listId, shareId) {
        return await this.makeRequest(`/api/lists/${listId}/share/${shareId}`, {
            method: 'DELETE'
        });
    }
}

// Globalna instancja managera API
const apiManager = new ApiManager();