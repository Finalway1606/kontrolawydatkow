// Moduł autentykacji
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.API_BASE = 'http://localhost:3000/api';
    }

    isLoggedIn() {
        return !!this.token && !!this.user;
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        window.location.href = 'login.html';
    }

    // Sprawdź czy token jest ważny
    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${this.API_BASE}/user-prices`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                this.logout();
                return false;
            }

            return response.ok;
        } catch (error) {
            console.error('Błąd walidacji tokenu:', error);
            return false;
        }
    }

    // Przekieruj do logowania jeśli nie zalogowany
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Globalna instancja managera autentykacji
const authManager = new AuthManager();