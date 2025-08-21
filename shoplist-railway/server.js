const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'shoplist_pro_secret_key_2024'; // W produkcji użyj zmiennej środowiskowej

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Inicjalizacja bazy danych SQLite
const db = new sqlite3.Database('./shoplist.db', (err) => {
    if (err) {
        console.error('Błąd połączenia z bazą danych:', err.message);
    } else {
        console.log('✅ Połączono z bazą danych SQLite');
        initializeDatabase();
    }
});

// Tworzenie tabel w bazie danych
function initializeDatabase() {
    // Tabela użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela list zakupów
    db.run(`CREATE TABLE IF NOT EXISTS shopping_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Tabela produktów na listach
    db.run(`CREATE TABLE IF NOT EXISTS list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        store TEXT NOT NULL,
        category TEXT NOT NULL,
        product TEXT NOT NULL,
        quantity TEXT,
        grammage TEXT,
        price REAL,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES shopping_lists (id)
    )`);

    // Tabela bazy produktów użytkownika (uczenie się cen)
    db.run(`CREATE TABLE IF NOT EXISTS user_product_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        store TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Tabela współdzielonych list
    db.run(`CREATE TABLE IF NOT EXISTS shared_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        shared_by_user_id INTEGER NOT NULL,
        permission TEXT DEFAULT 'read', -- 'read' lub 'write'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES shopping_lists (id),
        FOREIGN KEY (shared_with_user_id) REFERENCES users (id),
        FOREIGN KEY (shared_by_user_id) REFERENCES users (id),
        UNIQUE(list_id, shared_with_user_id)
    )`);

    console.log('✅ Tabele bazy danych zostały utworzone');
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
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd bazy danych' });
            }

            if (row) {
                return res.status(400).json({ error: 'Użytkownik o tej nazwie lub emailu już istnieje' });
            }

            // Hashowanie hasła
            const hashedPassword = await bcrypt.hash(password, 10);

            // Dodanie użytkownika do bazy
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                [username, email, hashedPassword], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Błąd podczas tworzenia konta' });
                }

                const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
                
                res.status(201).json({
                    message: 'Konto zostało utworzone pomyślnie',
                    token,
                    user: { id: this.lastID, username, email }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Logowanie użytkownika
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
    }

    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd bazy danych' });
        }

        if (!user) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        try {
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
            res.status(500).json({ error: 'Błąd serwera' });
        }
    });
});

// Pobieranie list zakupów użytkownika (własnych i współdzielonych)
app.get('/api/lists', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            sl.*,
            u.username as owner_username,
            CASE 
                WHEN sl.user_id = ? THEN 'owner'
                ELSE sh.permission 
            END as user_permission,
            CASE 
                WHEN sl.user_id = ? THEN 0
                ELSE 1 
            END as is_shared
        FROM shopping_lists sl
        LEFT JOIN users u ON sl.user_id = u.id
        LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = ?
        WHERE sl.user_id = ? OR sh.shared_with_user_id = ?
        ORDER BY sl.updated_at DESC
    `;
    
    db.all(query, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id], (err, lists) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd pobierania list' });
        }
        res.json(lists);
    });
});

// Tworzenie nowej listy zakupów
app.post('/api/lists', authenticateToken, (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Nazwa listy jest wymagana' });
    }

    db.run('INSERT INTO shopping_lists (user_id, name) VALUES (?, ?)', 
        [req.user.id, name], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Błąd tworzenia listy' });
        }
        
        res.status(201).json({
            id: this.lastID,
            name,
            user_id: req.user.id,
            created_at: new Date().toISOString()
        });
    });
});

// Pobieranie produktów z listy
app.get('/api/lists/:listId/items', authenticateToken, (req, res) => {
    const { listId } = req.params;
    
    // Sprawdź dostęp do listy (właściciel lub współdzielona)
    const accessQuery = `
        SELECT 1 FROM shopping_lists sl
        LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = ?
        WHERE sl.id = ? AND (sl.user_id = ? OR sh.shared_with_user_id = ?)
    `;
    
    db.get(accessQuery, [req.user.id, listId, req.user.id, req.user.id], (err, access) => {
        if (err || !access) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        db.all('SELECT * FROM list_items WHERE list_id = ?', [listId], (err, items) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd pobierania produktów' });
            }
            res.json(items);
        });
    });
});

// Dodawanie produktu do listy
app.post('/api/lists/:listId/items', authenticateToken, (req, res) => {
    const { listId } = req.params;
    const { store, category, product, quantity, grammage, price } = req.body;
    
    if (!store || !category || !product) {
        return res.status(400).json({ error: 'Sklep, kategoria i produkt są wymagane' });
    }

    // Sprawdź uprawnienia do listy (właściciel lub write permission)
    const permissionQuery = `
        SELECT 
            CASE 
                WHEN sl.user_id = ? THEN 'owner'
                ELSE sh.permission 
            END as permission
        FROM shopping_lists sl
        LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = ?
        WHERE sl.id = ? AND (sl.user_id = ? OR sh.shared_with_user_id = ?)
    `;
    
    db.get(permissionQuery, [req.user.id, req.user.id, listId, req.user.id, req.user.id], (err, result) => {
        if (err || !result) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        if (result.permission !== 'owner' && result.permission !== 'write') {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji tej listy' });
        }

        // Dodaj produkt do listy
        db.run(`INSERT INTO list_items (list_id, store, category, product, quantity, grammage, price) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [listId, store, category, product, quantity, grammage, price], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Błąd dodawania produktu' });
            }

            // Zapisz cenę do bazy uczenia się
            if (price && price > 0) {
                db.run(`INSERT INTO user_product_prices (user_id, product, category, price, store) 
                        VALUES (?, ?, ?, ?, ?)`, 
                    [req.user.id, product, category, price, store]);
            }

            // Aktualizuj czas modyfikacji listy
            db.run('UPDATE shopping_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [listId]);
            
            res.status(201).json({
                id: this.lastID,
                list_id: listId,
                store, category, product, quantity, grammage, price,
                completed: 0
            });
        });
    });
});

// Usuwanie produktu z listy
app.delete('/api/lists/:listId/items/:itemId', authenticateToken, (req, res) => {
    const { listId, itemId } = req.params;
    
    // Sprawdź uprawnienia do listy (właściciel lub write permission)
    const permissionQuery = `
        SELECT 
            CASE 
                WHEN sl.user_id = ? THEN 'owner'
                ELSE sh.permission 
            END as permission
        FROM shopping_lists sl
        LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = ?
        WHERE sl.id = ? AND (sl.user_id = ? OR sh.shared_with_user_id = ?)
    `;
    
    db.get(permissionQuery, [req.user.id, req.user.id, listId, req.user.id, req.user.id], (err, result) => {
        if (err || !result) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        if (result.permission !== 'owner' && result.permission !== 'write') {
            return res.status(403).json({ error: 'Nie masz uprawnień do edycji tej listy' });
        }
    
        db.run('DELETE FROM list_items WHERE id = ? AND list_id = ?', 
            [itemId, listId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Błąd usuwania produktu' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Produkt nie został znaleziony' });
            }
            
            res.json({ message: 'Produkt został usunięty' });
        });
    });
});

// Pobieranie cen produktów użytkownika (do uczenia się)
app.get('/api/user-prices', authenticateToken, (req, res) => {
    const { product, category } = req.query;
    
    let query = 'SELECT * FROM user_product_prices WHERE user_id = ?';
    let params = [req.user.id];
    
    if (product && category) {
        query += ' AND LOWER(product) = ? AND LOWER(category) = ?';
        params.push(product.toLowerCase(), category.toLowerCase());
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, prices) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd pobierania cen' });
        }
        res.json(prices);
    });
});

// Pobieranie kategorii produktów
app.get('/api/categories', authenticateToken, (req, res) => {
    const categories = [
        { name: 'Warzywa', icon: '🥕' },
        { name: 'Owoce', icon: '🍎' },
        { name: 'Mięso i wędliny', icon: '🥩' },
        { name: 'Nabiał', icon: '🥛' },
        { name: 'Pieczywo', icon: '🍞' },
        { name: 'Mrożonki', icon: '🧊' },
        { name: 'Napoje', icon: '🥤' },
        { name: 'Słodycze', icon: '🍫' },
        { name: 'Chemia domowa', icon: '🧽' },
        { name: 'Higiena', icon: '🧴' },
        { name: 'Kosmetyki', icon: '💄' },
        { name: 'Artykuły biurowe', icon: '📝' },
        { name: 'Elektronika', icon: '📱' },
        { name: 'Odzież', icon: '👕' },
        { name: 'Inne', icon: '📦' }
    ];
    
    res.json(categories);
});

// Wyszukiwanie produktów
app.get('/api/products/search', authenticateToken, (req, res) => {
    const { query, category } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Zapytanie musi mieć co najmniej 2 znaki' });
    }
    
    let searchQuery = `
        SELECT 
            product as name,
            category,
            AVG(price) as average_price,
            COUNT(*) as price_count
        FROM user_product_prices 
        WHERE LOWER(product) LIKE ?
    `;
    let params = [`%${query.toLowerCase()}%`];
    
    if (category) {
        searchQuery += ' AND LOWER(category) = ?';
        params.push(category.toLowerCase());
    }
    
    searchQuery += ' GROUP BY LOWER(product), LOWER(category) ORDER BY price_count DESC, average_price ASC LIMIT 10';
    
    db.all(searchQuery, params, (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd wyszukiwania produktów' });
        }
        res.json(products);
    });
});

// Dodawanie nowego produktu
app.post('/api/products', authenticateToken, (req, res) => {
    const { name, category, price } = req.body;
    
    if (!name || !category || !price) {
        return res.status(400).json({ error: 'Nazwa produktu, kategoria i cena są wymagane' });
    }
    
    if (price <= 0) {
        return res.status(400).json({ error: 'Cena musi być większa od 0' });
    }
    
    // Dodaj produkt do bazy cen użytkownika
    db.run(`INSERT INTO user_product_prices (user_id, product, category, price, store) 
            VALUES (?, ?, ?, ?, ?)`, 
        [req.user.id, name, category, price, 'Różne'], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Błąd dodawania produktu' });
        }
        
        res.status(201).json({
            id: this.lastID,
            name,
            category,
            price,
            message: 'Produkt został dodany do bazy'
        });
    });
});

// Wyszukiwanie użytkowników do współdzielenia
app.get('/api/users/search', authenticateToken, (req, res) => {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Zapytanie musi mieć co najmniej 2 znaki' });
    }
    
    db.all(`SELECT id, username, email FROM users 
            WHERE (username LIKE ? OR email LIKE ?) AND id != ? 
            LIMIT 10`, 
        [`%${query}%`, `%${query}%`, req.user.id], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd wyszukiwania użytkowników' });
        }
        res.json(users);
    });
});

// Współdzielenie listy z użytkownikiem
app.post('/api/lists/:listId/share', authenticateToken, (req, res) => {
    const { listId } = req.params;
    const { userId, permission = 'read' } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'ID użytkownika jest wymagane' });
    }
    
    if (!['read', 'write'].includes(permission)) {
        return res.status(400).json({ error: 'Nieprawidłowe uprawnienia' });
    }
    
    // Sprawdź czy lista należy do użytkownika
    db.get('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?', 
        [listId, req.user.id], (err, list) => {
        if (err || !list) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz uprawnień' });
        }
        
        // Sprawdź czy użytkownik istnieje
        db.get('SELECT id, username FROM users WHERE id = ?', [userId], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'Użytkownik nie został znaleziony' });
            }
            
            // Dodaj współdzielenie (lub zaktualizuj istniejące)
            db.run(`INSERT OR REPLACE INTO shared_lists 
                    (list_id, shared_with_user_id, shared_by_user_id, permission) 
                    VALUES (?, ?, ?, ?)`, 
                [listId, userId, req.user.id, permission], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Błąd współdzielenia listy' });
                }
                
                res.json({
                    message: `Lista została udostępniona użytkownikowi ${user.username}`,
                    shared_with: user.username,
                    permission
                });
            });
        });
    });
});

// Pobieranie użytkowników, z którymi współdzielona jest lista
app.get('/api/lists/:listId/shared', authenticateToken, (req, res) => {
    const { listId } = req.params;
    
    // Sprawdź czy użytkownik ma dostęp do listy
    const accessQuery = `
        SELECT 1 FROM shopping_lists sl
        LEFT JOIN shared_lists sh ON sl.id = sh.list_id AND sh.shared_with_user_id = ?
        WHERE sl.id = ? AND (sl.user_id = ? OR sh.shared_with_user_id = ?)
    `;
    
    db.get(accessQuery, [req.user.id, listId, req.user.id, req.user.id], (err, access) => {
        if (err || !access) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz dostępu' });
        }
        
        // Pobierz listę współdzielonych użytkowników
        const sharedQuery = `
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
            WHERE sh.list_id = ?
            ORDER BY sh.created_at DESC
        `;
        
        db.all(sharedQuery, [listId], (err, sharedUsers) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd pobierania współdzielonych użytkowników' });
            }
            res.json(sharedUsers);
        });
    });
});

// Usuwanie współdzielenia listy
app.delete('/api/lists/:listId/share/:shareId', authenticateToken, (req, res) => {
    const { listId, shareId } = req.params;
    
    // Sprawdź czy użytkownik jest właścicielem listy
    db.get('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?', 
        [listId, req.user.id], (err, list) => {
        if (err || !list) {
            return res.status(404).json({ error: 'Lista nie została znaleziona lub nie masz uprawnień' });
        }
        
        db.run('DELETE FROM shared_lists WHERE id = ? AND list_id = ?', 
            [shareId, listId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Błąd usuwania współdzielenia' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Współdzielenie nie zostało znalezione' });
            }
            
            res.json({ message: 'Współdzielenie zostało usunięte' });
        });
    });
});

// Serwowanie plików statycznych
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'listazakupow.html'));
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`🚀 Serwer działa na porcie ${PORT}`);
    console.log(`📱 Aplikacja dostępna pod adresem: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Zamykanie serwera...');
    db.close((err) => {
        if (err) {
            console.error('Błąd zamykania bazy danych:', err.message);
        } else {
            console.log('✅ Baza danych została zamknięta');
        }
        process.exit(0);
    });
});