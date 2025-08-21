const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfiguracja bazy danych PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://*.github.io', 'https://*.githubpages.io'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

// Middleware uwierzytelniania
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Brak tokenu dostępu' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Nieprawidłowy token' });
        }
        req.user = user;
        next();
    });
};

// Inicjalizacja bazy danych
async function initDatabase() {
    try {
        // Tabela użytkowników
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela list zakupów
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shopping_lists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela elementów list
        await pool.query(`
            CREATE TABLE IF NOT EXISTS list_items (
                id SERIAL PRIMARY KEY,
                list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
                store VARCHAR(50),
                category VARCHAR(50),
                product VARCHAR(100) NOT NULL,
                quantity INTEGER DEFAULT 1,
                grammage VARCHAR(50),
                price DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela cen produktów użytkowników
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_product_prices (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                product VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela współdzielenia list
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shared_lists (
                id SERIAL PRIMARY KEY,
                list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
                shared_with_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                permission VARCHAR(10) DEFAULT 'read',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(list_id, shared_with_user_id)
            )
        `);

        console.log('✅ Tabele bazy danych zostały utworzone');
    } catch (error) {
        console.error('❌ Błąd inicjalizacji bazy danych:', error);
    }
}

// API Endpoints

// Rejestracja
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Użytkownik został utworzony',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Użytkownik o tej nazwie lub emailu już istnieje' });
        } else {
            console.error('Błąd rejestracji:', error);
            res.status(500).json({ error: 'Błąd serwera' });
        }
    }
});

// Logowanie
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Zalogowano pomyślnie',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Kategorie produktów
app.get('/api/categories', (req, res) => {
    const categories = [
        { name: 'Warzywa', icon: '🥕' },
        { name: 'Owoce', icon: '🍎' },
        { name: 'Mięso', icon: '🥩' },
        { name: 'Nabiał', icon: '🥛' },
        { name: 'Pieczywo', icon: '🍞' },
        { name: 'Napoje', icon: '🥤' },
        { name: 'Słodycze', icon: '🍫' },
        { name: 'Chemia', icon: '🧽' },
        { name: 'Kosmetyki', icon: '🧴' },
        { name: 'Mrożonki', icon: '🧊' },
        { name: 'Przyprawy', icon: '🌶️' },
        { name: 'Konserwy', icon: '🥫' },
        { name: 'Makarony', icon: '🍝' },
        { name: 'Alkohol', icon: '🍷' },
        { name: 'Inne', icon: '📦' }
    ];
    res.json(categories);
});

// Wyszukiwanie produktów
app.get('/api/products/search', authenticateToken, async (req, res) => {
    try {
        const { query, category } = req.query;
        const userId = req.user.userId;

        let sql = `
            SELECT 
                product as name,
                category,
                AVG(price) as average_price,
                COUNT(*) as price_count
            FROM user_product_prices 
            WHERE user_id = $1
        `;
        const params = [userId];

        if (query) {
            sql += ` AND product ILIKE $${params.length + 1}`;
            params.push(`%${query}%`);
        }

        if (category) {
            sql += ` AND category = $${params.length + 1}`;
            params.push(category);
        }

        sql += ` GROUP BY product, category ORDER BY product LIMIT 10`;

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd wyszukiwania produktów:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Dodawanie produktu
app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        const { name, category, price } = req.body;
        const userId = req.user.userId;

        await pool.query(
            'INSERT INTO user_product_prices (user_id, product, category, price) VALUES ($1, $2, $3, $4)',
            [userId, name, category, price]
        );

        res.status(201).json({ message: 'Produkt został dodany' });
    } catch (error) {
        console.error('Błąd dodawania produktu:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Ceny użytkownika
app.get('/api/user-prices', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT product, category, price FROM user_product_prices WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania cen:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Listy zakupów
app.get('/api/lists', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(`
            SELECT DISTINCT sl.id, sl.name, sl.created_at
            FROM shopping_lists sl
            LEFT JOIN shared_lists shl ON sl.id = shl.list_id
            WHERE sl.user_id = $1 OR shl.shared_with_user_id = $1
            ORDER BY sl.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania list:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Tworzenie listy
app.post('/api/lists', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.userId;

        const result = await pool.query(
            'INSERT INTO shopping_lists (user_id, name) VALUES ($1, $2) RETURNING *',
            [userId, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd tworzenia listy:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Elementy listy
app.get('/api/lists/:listId/items', authenticateToken, async (req, res) => {
    try {
        const { listId } = req.params;
        const result = await pool.query(
            'SELECT * FROM list_items WHERE list_id = $1 ORDER BY created_at DESC',
            [listId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania elementów listy:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Dodawanie do listy
app.post('/api/lists/:listId/items', authenticateToken, async (req, res) => {
    try {
        const { listId } = req.params;
        const { store, category, product, quantity, grammage, price } = req.body;

        const result = await pool.query(
            'INSERT INTO list_items (list_id, store, category, product, quantity, grammage, price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [listId, store, category, product, quantity, grammage, price]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd dodawania do listy:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Usuwanie z listy
app.delete('/api/lists/:listId/items/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        await pool.query('DELETE FROM list_items WHERE id = $1', [itemId]);
        res.json({ message: 'Element został usunięty' });
    } catch (error) {
        console.error('Błąd usuwania elementu:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serwowanie plików statycznych
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Inicjalizacja serwera
async function startServer() {
    try {
        await initDatabase();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Serwer Railway działa na porcie ${PORT}`);
            console.log(`📱 Aplikacja dostępna pod adresem: http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Błąd uruchamiania serwera:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Zamykanie serwera...');
    await pool.end();
    process.exit(0);
});