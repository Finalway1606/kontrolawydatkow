# ShopList Pro - Wdrożenie na Railway.app

## 🚀 Instrukcja wdrożenia na Railway

### Krok 1: Przygotowanie kodu
✅ Pliki zostały już przygotowane w folderze `shoplist-railway`

### Krok 2: Utworzenie repozytorium GitHub
1. Idź na https://github.com i zaloguj się
2. Kliknij "New repository"
3. Nazwa: `shoplist-pro-railway`
4. Ustaw jako **Public**
5. Kliknij "Create repository"

### Krok 3: Upload plików do GitHub
1. W nowym repozytorium kliknij "uploading an existing file"
2. Przeciągnij wszystkie pliki z folderu `shoplist-railway`
3. Commit message: "Initial commit - ShopList Pro for Railway"
4. Kliknij "Commit changes"

### Krok 4: Wdrożenie na Railway
1. Idź na https://railway.app
2. Kliknij "Start a New Project"
3. Wybierz "Deploy from GitHub repo"
4. Zaloguj się przez GitHub
5. Wybierz repozytorium `shoplist-pro-railway`
6. Railway automatycznie wykryje Node.js i rozpocznie wdrożenie

### Krok 5: Dodanie bazy danych PostgreSQL
1. W panelu Railway kliknij "+ New"
2. Wybierz "Database" → "PostgreSQL"
3. Railway automatycznie połączy bazę z aplikacją

### Krok 6: Konfiguracja zmiennych środowiskowych
Railway automatycznie ustawi:
- `DATABASE_URL` - połączenie z PostgreSQL
- `PORT` - port aplikacji
- `NODE_ENV=production`

Opcjonalnie możesz dodać:
- `JWT_SECRET` - własny klucz JWT (zalecane)

### Krok 7: Sprawdzenie wdrożenia
1. Railway pokaże URL aplikacji (np. `https://shoplist-pro-railway-production.up.railway.app`)
2. Kliknij URL aby otworzyć aplikację
3. Przetestuj rejestrację i logowanie

## 🔧 Konfiguracja dla GitHub Pages (Frontend)

### Przygotowanie plików frontend
1. Skopiuj pliki: `login.html`, `listazakupow.html`, `api.js`, `auth.js`
2. Utwórz nowe repozytorium GitHub: `shoplist-pro-frontend`
3. W `api.js` zmień URL API na Railway:

```javascript
const API_BASE_URL = 'https://twoja-aplikacja-railway.up.railway.app';
```

### Aktywacja GitHub Pages
1. W repozytorium frontend idź do Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: "main" / "master"
4. Folder: "/ (root)"
5. Kliknij "Save"

## 📱 Struktura wdrożenia

```
Backend (Railway):
├── server-railway.js     # Serwer Node.js
├── package.json         # Zależności
├── railway.json         # Konfiguracja Railway
└── Procfile            # Komenda uruchomienia

Frontend (GitHub Pages):
├── login.html          # Strona logowania
├── listazakupow.html   # Główna aplikacja
├── api.js             # Komunikacja z API
└── auth.js            # Zarządzanie uwierzytelnianiem
```

## 🌟 Funkcje aplikacji
- ✅ Rejestracja i logowanie użytkowników
- ✅ Tworzenie i zarządzanie listami zakupów
- ✅ Dodawanie produktów z cenami
- ✅ Kategoryzacja produktów
- ✅ Wyszukiwanie produktów
- ✅ Współdzielenie list (w przyszłości)
- ✅ Responsywny design

## 🔒 Bezpieczeństwo
- Hasła są hashowane (bcrypt)
- Uwierzytelnianie JWT
- CORS skonfigurowany
- Walidacja danych wejściowych

## 💰 Koszty
- **Railway**: Darmowe 500 godzin/miesiąc + PostgreSQL
- **GitHub Pages**: Całkowicie darmowe
- **Łącznie**: 0 zł/miesiąc

## 🆘 Rozwiązywanie problemów

### Błąd "Application failed to respond"
- Sprawdź logi w Railway Dashboard
- Upewnij się, że `PORT` jest ustawiony przez Railway

### Błąd CORS
- Sprawdź czy URL frontend jest dodany do CORS w `server-railway.js`

### Błąd bazy danych
- Sprawdź czy PostgreSQL jest podłączony
- Sprawdź zmienną `DATABASE_URL`

## 📞 Wsparcie
W przypadku problemów sprawdź:
1. Railway Dashboard → Logs
2. GitHub Actions (jeśli używasz)
3. Browser Developer Tools → Console