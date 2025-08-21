const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shoplist_pro_secret_key_2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Konfiguracja PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test połączenia z bazą danych
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Błąd połączenia z bazą danych:', err.message);
        console.log('💡 Sprawdź konfigurację w pliku .env');
        console.log('💡 Dla testów lokalnych możesz użyć SQLite (uruchom: node server.js)');
    } else {
        console.log('✅ Połączono z bazą danych PostgreSQL');
        release();
        initializeDatabase();
    }
});

// Tworzenie tabel w bazie danych
async function initializeDatabase() {
    try {
        // Tabela użytkowników
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela kategorii produktów (globalna baza)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela produktów (globalna baza)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category_id INTEGER REFERENCES product_categories(id),
                created_by_user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, category_id)
            )
        `);

        // Tabela cen produktów (różne sklepy, różni użytkownicy)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_prices (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                store VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela list zakupów
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shopping_lists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela produktów na listach
        await pool.query(`
            CREATE TABLE IF NOT EXISTS list_items (
                id SERIAL PRIMARY KEY,
                list_id INTEGER NOT NULL REFERENCES shopping_lists(id),
                product_id INTEGER REFERENCES products(id),
                store VARCHAR(255) NOT NULL,
                quantity VARCHAR(50),
                grammage VARCHAR(50),
                price DECIMAL(10,2),
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela współdzielonych list
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shared_lists (
                id SERIAL PRIMARY KEY,
                list_id INTEGER NOT NULL REFERENCES shopping_lists(id),
                shared_with_user_id INTEGER NOT NULL REFERENCES users(id),
                shared_by_user_id INTEGER NOT NULL REFERENCES users(id),
                permission VARCHAR(10) DEFAULT 'read',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(list_id, shared_with_user_id)
            )
        `);

        // Dodaj podstawowe kategorie
        const defaultCategories = [
            'Owoce i warzywa', 'Mięso i wędliny', 'Nabiał', 'Pieczywo', 
            'Mrożonki', 'Napoje', 'Słodycze', 'Chemia domowa', 
            'Kosmetyki', 'Inne'
        ];

        for (const category of defaultCategories) {
            await pool.query(
                'INSERT INTO product_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [category]
            );
        }

        console.log('✅ Tabele bazy danych zostały utworzone');
    } catch (error) {
        console.error('❌ Błąd inicjalizacji bazy danych:', error.message);
    }
}

// Middleware do weryfikacji JWT
function authenticateToken(req, res, next) {
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
}

// ENDPOINTY API

// Rejestracja użytkownika
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    try {
        // Sprawdź czy użytkownik już istnieje
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Użytkownik o tej nazwie lub emailu już istnieje' });
        }

        // Hashowanie hasła
        const hashedPassword = await bcrypt.hash(password, 10);

        // Dodanie użytkownika do bazy
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({
            message: 'Konto zostało utworzone pomyślnie',
            token,
            user
        });
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Logowanie użytkownika
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        
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

// Pobieranie kategorii produktów
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM product_categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania kategorii:', error);
        res.status(500).json({ error: 'Błąd pobierania kategorii' });
    }
});

// Wyszukiwanie produktów w kategorii
app.get('/api/products/search', authenticateToken, async (req, res) => {
    const { query, category_id } = req.query;
    
    try {
        let sqlQuery = `
            SELECT p.*, pc.name as category_name 
            FROM products p 
            JOIN product_categories pc ON p.category_id = pc.id 
            WHERE 1=1
        `;
        const params = [];
        
        if (query && query.length >= 2) {
            sqlQuery += ` AND LOWER(p.name) LIKE LOWER($${params.length + 1})`;
            params.push(`%${query}%`);
        }
        
        if (category_id) {
            sqlQuery += ` AND p.category_id = $${params.length + 1}`;
            params.push(category_id);
        }
        
        sqlQuery += ' ORDER BY p.name LIMIT 20';
        
        const result = await pool.query(sqlQuery, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd wyszukiwania produktów:', error);
        res.status(500).json({ error: 'Błąd wyszukiwania produktów' });
    }
});

// Dodawanie nowego produktu do bazy
app.post('/api/products', authenticateToken, async (req, res) => {
    const { name, category_id, store, price } = req.body;
    
    if (!name || !category_id) {
        return res.status(400).json({ error: 'Nazwa produktu i kategoria są wymagane' });
    }
    
    try {
        // Sprawdź czy produkt już istnieje w tej kategorii
        const existingProduct = await pool.query(
            'SELECT * FROM products WHERE LOWER(name) = LOWER($1) AND category_id = $2',
            [name, category_id]
        );
        
        let product;
        if (existingProduct.rows.length > 0) {
            product = existingProduct.rows[0];
        } else {
            // Dodaj nowy produkt
            const result = await pool.query(
                'INSERT INTO products (name, category_id, created_by_user_id) VALUES ($1, $2, $3) RETURNING *',
                [name, category_id, req.user.id]
            );
            product = result.rows[0];
        }
        
        // Dodaj cenę jeśli została podana
        if (price && price > 0 && store) {
            await pool.query(
                'INSERT INTO product_prices (product_id, store, price, user_id) VALUES ($1, $2, $3, $4)',
                [product.id, store, price, req.user.id]
            );
        }
        
        res.status(201).json({
            message: 'Produkt został dodany do bazy',
            product
        });
    } catch (error) {
        console.error('Błąd dodawania produktu:', error);
        res.status(500).json({ error: 'Błąd dodawania produktu' });
    }
});

// Pobieranie cen produktu
app.get('/api/products/:productId/prices', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    const { store } = req.query;
    
    try {
        let query = `
            SELECT pp.*, u.username 
            FROM product_prices pp 
            JOIN users u ON pp.user_id = u.id 
            WHERE pp.product_id = $1
        `;
        const params = [productId];
        
        if (store) {
            query += ` AND LOWER(pp.store) = LOWER($${params.length + 1})`;
            params.push(store);
        }
        
        query += ' ORDER BY pp.created_at DESC LIMIT 10';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania cen:', error);
        res.status(500).json({ error: 'Błąd pobierania cen' });
    }
});

// Pobieranie list zakupów użytkownika (własnych i współdzielonych)
app.get('/api/lists', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                sl.*,
                u.username as owner_username,
                CASE 
                    WHEN sl.user_id = $1 THEN 'owner'
                    ELSE sh.permission 
                END as user_permission,
                CASE 
                    WHEN sl.user_id = $1 THEN FALSE
                    ELSE TRUE 
                END as is_shared
            FROM shopping_lists sl
            LEFT JOIN users u ON sl.user_id = u.id
            LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = $1
            WHERE sl.user_id = $1 OR sh.shared_with_user_id = $1
            ORDER BY sl.updated_at DESC
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania list:', error);
        res.status(500).json({ error: 'Błąd pobierania list' });
    }
});

// Tworzenie nowej listy zakupów
app.post('/api/lists', authenticateToken, async (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Nazwa listy jest wymagana' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO shopping_lists (user_id, name) VALUES ($1, $2) RETURNING *',
            [req.user.id, name]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd tworzenia listy:', error);
        res.status(500).json({ error: 'Błąd tworzenia listy' });
    }
});

// Pobieranie produktów z listy
app.get('/api/lists/:listId/items', authenticateToken, async (req, res) => {
    const { listId } = req.params;
    
    try {
        // Sprawdź dostęp do listy
        const accessCheck = await pool.query(`
            SELECT 1 FROM shopping_lists sl
            LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = $1
            WHERE sl.id = $2 AND (sl.user_id = $1 OR sh.shared_with_user_id = $1)
        `, [req.user.id, listId]);
        
        if (accessCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        const result = await pool.query(`
            SELECT 
                li.*,
                p.name as product_name,
                pc.name as category_name
            FROM list_items li
            LEFT JOIN products p ON li.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE li.list_id = $1
            ORDER BY li.created_at DESC
        `, [listId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania produktów:', error);
        res.status(500).json({ error: 'Błąd pobierania produktów' });
    }
});

// Dodawanie produktu do listy
app.post('/api/lists/:listId/items', authenticateToken, async (req, res) => {
    const { listId } = req.params;
    const { product_id, product_name, category_id, store, quantity, grammage, price } = req.body;
    
    if (!store || (!product_id && !product_name)) {
        return res.status(400).json({ error: 'Sklep i produkt są wymagane' });
    }

    try {
        // Sprawdź uprawnienia do listy
        const permissionCheck = await pool.query(`
            SELECT 
                CASE 
                    WHEN sl.user_id = $1 THEN 'owner'
                    ELSE sh.permission 
                END as permission
            FROM shopping_lists sl
            LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = $1
            WHERE sl.id = $2 AND (sl.user_id = $1 OR sh.shared_with_user_id = $1)
        `, [req.user.id, listId]);
        
        if (permissionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        const permission = permissionCheck.rows[0].permission;
        if (permission !== 'owner' && permission !== 'write') {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji tej listy' });
        }

        let finalProductId = product_id;
        
        // Jeśli nie ma product_id, sprawdź czy produkt istnieje lub utwórz nowy
        if (!product_id && product_name && category_id) {
            const existingProduct = await pool.query(
                'SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND category_id = $2',
                [product_name, category_id]
            );
            
            if (existingProduct.rows.length > 0) {
                finalProductId = existingProduct.rows[0].id;
            } else {
                // Utwórz nowy produkt
                const newProduct = await pool.query(
                    'INSERT INTO products (name, category_id, created_by_user_id) VALUES ($1, $2, $3) RETURNING id',
                    [product_name, category_id, req.user.id]
                );
                finalProductId = newProduct.rows[0].id;
            }
        }

        // Dodaj produkt do listy
        const result = await pool.query(`
            INSERT INTO list_items (list_id, product_id, store, quantity, grammage, price) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [listId, finalProductId, store, quantity, grammage, price]);

        // Zapisz cenę do bazy cen
        if (price && price > 0 && finalProductId) {
            await pool.query(
                'INSERT INTO product_prices (product_id, store, price, user_id) VALUES ($1, $2, $3, $4)',
                [finalProductId, store, price, req.user.id]
            );
        }

        // Aktualizuj czas modyfikacji listy
        await pool.query(
            'UPDATE shopping_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [listId]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd dodawania produktu:', error);
        res.status(500).json({ error: 'Błąd dodawania produktu' });
    }
});

// Usuwanie produktu z listy
app.delete('/api/lists/:listId/items/:itemId', authenticateToken, async (req, res) => {
    const { listId, itemId } = req.params;
    
    try {
        // Sprawdź uprawnienia
        const permissionCheck = await pool.query(`
            SELECT 
                CASE 
                    WHEN sl.user_id = $1 THEN 'owner'
                    ELSE sh.permission 
                END as permission
            FROM shopping_lists sl
            LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = $1
            WHERE sl.id = $2 AND (sl.user_id = $1 OR sh.shared_with_user_id = $1)
        `, [req.user.id, listId]);
        
        if (permissionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        const permission = permissionCheck.rows[0].permission;
        if (permission !== 'owner' && permission !== 'write') {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji tej listy' });
        }
    
        const result = await pool.query(
            'DELETE FROM list_items WHERE id = $1 AND list_id = $2',
            [itemId, listId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produkt nie został znaleziony' });
        }
        
        res.json({ message: 'Produkt został usunięty' });
    } catch (error) {
        console.error('Błąd usuwania produktu:', error);
        res.status(500).json({ error: 'Błąd usuwania produktu' });
    }
});

// Wyszukiwanie użytkowników do współdzielenia
app.get('/api/users/search', authenticateToken, async (req, res) => {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Zapytanie musi mieć co najmniej 2 znaki' });
    }
    
    try {
        const result = await pool.query(`
            SELECT id, username, email FROM users 
            WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2 
            LIMIT 10
        `, [`%${query}%`, req.user.id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd wyszukiwania użytkowników:', error);
        res.status(500).json({ error: 'Błąd wyszukiwania użytkowników' });
    }
});

// Współdzielenie listy z użytkownikiem
app.post('/api/lists/:listId/share', authenticateToken, async (req, res) => {
    const { listId } = req.params;
    const { userId, permission = 'read' } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'ID użytkownika jest wymagane' });
    }
    
    if (!['read', 'write'].includes(permission)) {
        return res.status(400).json({ error: 'Nieprawidłowe uprawnienia' });
    }
    
    try {
        // Sprawdź czy lista należy do użytkownika
        const listCheck = await pool.query(
            'SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2',
            [listId, req.user.id]
        );
        
        if (listCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz uprawnień' });
        }
        
        // Sprawdź czy użytkownik istnieje
        const userCheck = await pool.query(
            'SELECT id, username FROM users WHERE id = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Użytkownik nie został znaleziony' });
        }
        
        // Dodaj współdzielenie
        await pool.query(`
            INSERT INTO shared_lists (list_id, shared_with_user_id, shared_by_user_id, permission) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (list_id, shared_with_user_id) 
            DO UPDATE SET permission = $4, created_at = CURRENT_TIMESTAMP
        `, [listId, userId, req.user.id, permission]);
        
        res.json({
            message: `Lista została udostępniona użytkownikowi ${userCheck.rows[0].username}`,
            shared_with: userCheck.rows[0].username,
            permission
        });
    } catch (error) {
        console.error('Błąd współdzielenia listy:', error);
        res.status(500).json({ error: 'Błąd współdzielenia listy' });
    }
});

// Pobieranie użytkowników, z którymi współdzielona jest lista
app.get('/api/lists/:listId/shared', authenticateToken, async (req, res) => {
    const { listId } = req.params;
    
    try {
        // Sprawdź dostęp do listy
        const accessCheck = await pool.query(`
            SELECT 1 FROM shopping_lists sl
            LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = $1
            WHERE sl.id = $2 AND (sl.user_id = $1 OR sh.shared_with_user_id = $1)
        `, [req.user.id, listId]);
        
        if (accessCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        const result = await pool.query(`
            SELECT 
                sh.id,
                sh.permission,
                sh.created_at,
                u.id as user_id,
                u.username,
                u.email,
                owner.username as shared_by_username
            FROM shared_lists sh
            JOIN users u ON sh.shared_with_user_id = u.id
            JOIN users owner ON sh.shared_by_user_id = owner.id
            WHERE sh.list_id = $1
            ORDER BY sh.created_at DESC
        `, [listId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania współdzielonych użytkowników:', error);
        res.status(500).json({ error: 'Błąd pobierania współdzielonych użytkowników' });
    }
});

// Usuwanie współdzielenia listy
app.delete('/api/lists/:listId/share/:shareId', authenticateToken, async (req, res) => {
    const { listId, shareId } = req.params;
    
    try {
        // Sprawdź czy użytkownik jest właścicielem listy
        const listCheck = await pool.query(
            'SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2',
            [listId, req.user.id]
        );
        
        if (listCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz uprawnień' });
        }
        
        const result = await pool.query(
            'DELETE FROM shared_lists WHERE id = $1 AND list_id = $2',
            [shareId, listId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Współdzielenie nie zostało znalezione' });
        }
        
        res.json({ message: 'Współdzielenie zostało usunięte' });
    } catch (error) {
        console.error('Błąd usuwania współdzielenia:', error);
        res.status(500).json({ error: 'Błąd usuwania współdzielenia' });
    }
});

// Serwowanie plików statycznych
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'listazakupow.html'));
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`🚀 Serwer działa na porcie ${PORT}`);
    console.log(`📱 Aplikacja dostępna pod adresem: http://localhost:${PORT}`);
    console.log(`🌐 Używa bazy danych: ${process.env.DATABASE_URL ? 'PostgreSQL (online)' : 'PostgreSQL (lokalna)'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Zamykanie serwera...');
    pool.end(() => {
        console.log('✅ Połączenia z bazą danych zostały zamknięte');
        process.exit(0);
    });
});