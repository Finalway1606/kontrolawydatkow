// Baza danych z cenami produktów w polskich sklepach
// Ceny w złotych, aktualne na 2024 rok

const bazaCenProduktow = {
    // WARZYWA
    "ziemniaki_warzywa": {
        "Biedronka": [2.99, 3.49, 2.79],
        "Lidl": [2.89, 3.29, 2.69],
        "Kaufland": [3.19, 3.59, 2.99],
        "Carrefour": [3.09, 3.49, 2.89],
        "Auchan": [2.95, 3.35, 2.75],
        "Tesco": [3.15, 3.55, 2.95],
        "Aldi": [2.85, 3.25, 2.65],
        "Żabka": [3.99, 4.49, 3.79]
    },
    "marchew_warzywa": {
        "Biedronka": [2.49, 2.89, 2.29],
        "Lidl": [2.39, 2.79, 2.19],
        "Kaufland": [2.69, 3.09, 2.49],
        "Carrefour": [2.59, 2.99, 2.39],
        "Auchan": [2.45, 2.85, 2.25],
        "Tesco": [2.65, 3.05, 2.45],
        "Aldi": [2.35, 2.75, 2.15],
        "Żabka": [3.49, 3.89, 3.29]
    },
    "cebula_warzywa": {
        "Biedronka": [2.19, 2.59, 1.99],
        "Lidl": [2.09, 2.49, 1.89],
        "Kaufland": [2.39, 2.79, 2.19],
        "Carrefour": [2.29, 2.69, 2.09],
        "Auchan": [2.15, 2.55, 1.95],
        "Tesco": [2.35, 2.75, 2.15],
        "Aldi": [2.05, 2.45, 1.85],
        "Żabka": [3.19, 3.59, 2.99]
    },
    "pomidory_warzywa": {
        "Biedronka": [6.99, 8.99, 5.99],
        "Lidl": [6.49, 8.49, 5.49],
        "Kaufland": [7.49, 9.49, 6.49],
        "Carrefour": [7.19, 9.19, 6.19],
        "Auchan": [6.89, 8.89, 5.89],
        "Tesco": [7.29, 9.29, 6.29],
        "Aldi": [6.39, 8.39, 5.39],
        "Żabka": [9.99, 11.99, 8.99]
    },

    // OWOCE
    "jabłka_owoce": {
        "Biedronka": [4.99, 6.99, 3.99],
        "Lidl": [4.49, 6.49, 3.49],
        "Kaufland": [5.49, 7.49, 4.49],
        "Carrefour": [5.19, 7.19, 4.19],
        "Auchan": [4.89, 6.89, 3.89],
        "Tesco": [5.29, 7.29, 4.29],
        "Aldi": [4.39, 6.39, 3.39],
        "Żabka": [7.99, 9.99, 6.99]
    },
    "banany_owoce": {
        "Biedronka": [5.49, 6.49, 4.99],
        "Lidl": [4.99, 5.99, 4.49],
        "Kaufland": [5.99, 6.99, 5.49],
        "Carrefour": [5.69, 6.69, 5.19],
        "Auchan": [5.39, 6.39, 4.89],
        "Tesco": [5.79, 6.79, 5.29],
        "Aldi": [4.89, 5.89, 4.39],
        "Żabka": [7.49, 8.49, 6.99]
    },
    "pomarańcze_owoce": {
        "Biedronka": [6.99, 8.99, 5.99],
        "Lidl": [6.49, 8.49, 5.49],
        "Kaufland": [7.49, 9.49, 6.49],
        "Carrefour": [7.19, 9.19, 6.19],
        "Auchan": [6.89, 8.89, 5.89],
        "Tesco": [7.29, 9.29, 6.29],
        "Aldi": [6.39, 8.39, 5.39],
        "Żabka": [9.99, 11.99, 8.99]
    },

    // NABIAŁ
    "mleko uht 3,2%_nabiał": {
        "Biedronka": [3.49, 3.89, 3.19],
        "Lidl": [3.29, 3.69, 2.99],
        "Kaufland": [3.69, 4.09, 3.39],
        "Carrefour": [3.59, 3.99, 3.29],
        "Auchan": [3.45, 3.85, 3.15],
        "Tesco": [3.65, 4.05, 3.35],
        "Aldi": [3.25, 3.65, 2.95],
        "Żabka": [4.49, 4.89, 4.19]
    },
    "masło_nabiał": {
        "Biedronka": [6.99, 8.99, 5.99],
        "Lidl": [6.49, 8.49, 5.49],
        "Kaufland": [7.49, 9.49, 6.49],
        "Carrefour": [7.19, 9.19, 6.19],
        "Auchan": [6.89, 8.89, 5.89],
        "Tesco": [7.29, 9.29, 6.29],
        "Aldi": [6.39, 8.39, 5.39],
        "Żabka": [9.99, 11.99, 8.99]
    },
    "ser żółty_nabiał": {
        "Biedronka": [24.99, 29.99, 19.99],
        "Lidl": [22.99, 27.99, 17.99],
        "Kaufland": [26.99, 31.99, 21.99],
        "Carrefour": [25.99, 30.99, 20.99],
        "Auchan": [24.49, 29.49, 19.49],
        "Tesco": [26.49, 31.49, 21.49],
        "Aldi": [22.49, 27.49, 17.49],
        "Żabka": [34.99, 39.99, 29.99]
    },
    "jogurt naturalny_nabiał": {
        "Biedronka": [2.99, 3.49, 2.49],
        "Lidl": [2.79, 3.29, 2.29],
        "Kaufland": [3.19, 3.69, 2.69],
        "Carrefour": [3.09, 3.59, 2.59],
        "Auchan": [2.95, 3.45, 2.45],
        "Tesco": [3.15, 3.65, 2.65],
        "Aldi": [2.75, 3.25, 2.25],
        "Żabka": [3.99, 4.49, 3.49]
    },

    // MIĘSO I WĘDLINY
    "pierś z kurczaka_mięso i wędliny": {
        "Biedronka": [18.99, 22.99, 15.99],
        "Lidl": [17.99, 21.99, 14.99],
        "Kaufland": [19.99, 23.99, 16.99],
        "Carrefour": [19.49, 23.49, 16.49],
        "Auchan": [18.79, 22.79, 15.79],
        "Tesco": [19.69, 23.69, 16.69],
        "Aldi": [17.79, 21.79, 14.79],
        "Żabka": [24.99, 28.99, 21.99]
    },
    "szynka_mięso i wędliny": {
        "Biedronka": [24.99, 29.99, 19.99],
        "Lidl": [22.99, 27.99, 17.99],
        "Kaufland": [26.99, 31.99, 21.99],
        "Carrefour": [25.99, 30.99, 20.99],
        "Auchan": [24.49, 29.49, 19.49],
        "Tesco": [26.49, 31.49, 21.49],
        "Aldi": [22.49, 27.49, 17.49],
        "Żabka": [34.99, 39.99, 29.99]
    },

    // PIECZYWO
    "chleb_pieczywo": {
        "Biedronka": [3.99, 4.99, 2.99],
        "Lidl": [3.49, 4.49, 2.49],
        "Kaufland": [4.49, 5.49, 3.49],
        "Carrefour": [4.19, 5.19, 3.19],
        "Auchan": [3.89, 4.89, 2.89],
        "Tesco": [4.29, 5.29, 3.29],
        "Aldi": [3.39, 4.39, 2.39],
        "Żabka": [5.99, 6.99, 4.99]
    },
    "bułki_pieczywo": {
        "Biedronka": [0.49, 0.69, 0.39],
        "Lidl": [0.39, 0.59, 0.29],
        "Kaufland": [0.59, 0.79, 0.49],
        "Carrefour": [0.54, 0.74, 0.44],
        "Auchan": [0.47, 0.67, 0.37],
        "Tesco": [0.57, 0.77, 0.47],
        "Aldi": [0.37, 0.57, 0.27],
        "Żabka": [0.79, 0.99, 0.69]
    },

    // NAPOJE
    "woda mineralna_napoje": {
        "Biedronka": [1.99, 2.49, 1.49],
        "Lidl": [1.79, 2.29, 1.29],
        "Kaufland": [2.19, 2.69, 1.69],
        "Carrefour": [2.09, 2.59, 1.59],
        "Auchan": [1.95, 2.45, 1.45],
        "Tesco": [2.15, 2.65, 1.65],
        "Aldi": [1.75, 2.25, 1.25],
        "Żabka": [2.99, 3.49, 2.49]
    },
    "coca cola_napoje": {
        "Biedronka": [4.99, 5.99, 3.99],
        "Lidl": [4.49, 5.49, 3.49],
        "Kaufland": [5.49, 6.49, 4.49],
        "Carrefour": [5.19, 6.19, 4.19],
        "Auchan": [4.89, 5.89, 3.89],
        "Tesco": [5.29, 6.29, 4.29],
        "Aldi": [4.39, 5.39, 3.39],
        "Żabka": [6.99, 7.99, 5.99]
    },

    // SŁODYCZE
    "czekolada_słodycze": {
        "Biedronka": [4.99, 6.99, 3.99],
        "Lidl": [4.49, 6.49, 3.49],
        "Kaufland": [5.49, 7.49, 4.49],
        "Carrefour": [5.19, 7.19, 4.19],
        "Auchan": [4.89, 6.89, 3.89],
        "Tesco": [5.29, 7.29, 4.29],
        "Aldi": [4.39, 6.39, 3.39],
        "Żabka": [7.99, 9.99, 6.99]
    },
    "cukierki_słodycze": {
        "Biedronka": [3.99, 5.99, 2.99],
        "Lidl": [3.49, 5.49, 2.49],
        "Kaufland": [4.49, 6.49, 3.49],
        "Carrefour": [4.19, 6.19, 3.19],
        "Auchan": [3.89, 5.89, 2.89],
        "Tesco": [4.29, 6.29, 3.29],
        "Aldi": [3.39, 5.39, 2.39],
        "Żabka": [5.99, 7.99, 4.99]
    },

    // CHEMIA DOMOWA
    "proszek do prania_chemia domowa": {
        "Biedronka": [19.99, 24.99, 14.99],
        "Lidl": [17.99, 22.99, 12.99],
        "Kaufland": [21.99, 26.99, 16.99],
        "Carrefour": [20.99, 25.99, 15.99],
        "Auchan": [19.49, 24.49, 14.49],
        "Tesco": [21.49, 26.49, 16.49],
        "Aldi": [17.49, 22.49, 12.49],
        "Żabka": [29.99, 34.99, 24.99]
    },
    "płyn do naczyń_chemia domowa": {
        "Biedronka": [4.99, 6.99, 3.99],
        "Lidl": [4.49, 6.49, 3.49],
        "Kaufland": [5.49, 7.49, 4.49],
        "Carrefour": [5.19, 7.19, 4.19],
        "Auchan": [4.89, 6.89, 3.89],
        "Tesco": [5.29, 7.29, 4.29],
        "Aldi": [4.39, 6.39, 3.39],
        "Żabka": [7.99, 9.99, 6.99]
    },

    // HIGIENA
    "pasta do zębów_higiena": {
        "Biedronka": [6.99, 9.99, 4.99],
        "Lidl": [5.99, 8.99, 3.99],
        "Kaufland": [7.99, 10.99, 5.99],
        "Carrefour": [7.49, 10.49, 5.49],
        "Auchan": [6.79, 9.79, 4.79],
        "Tesco": [7.69, 10.69, 5.69],
        "Aldi": [5.79, 8.79, 3.79],
        "Żabka": [11.99, 14.99, 8.99]
    },
    "szampon_higiena": {
        "Biedronka": [12.99, 16.99, 8.99],
        "Lidl": [11.99, 15.99, 7.99],
        "Kaufland": [13.99, 17.99, 9.99],
        "Carrefour": [13.49, 17.49, 9.49],
        "Auchan": [12.79, 16.79, 8.79],
        "Tesco": [13.69, 17.69, 9.69],
        "Aldi": [11.79, 15.79, 7.79],
        "Żabka": [18.99, 22.99, 14.99]
    },
    "papier toaletowy_higiena": {
        "Biedronka": [8.99, 12.99, 6.99],
        "Lidl": [7.99, 11.99, 5.99],
        "Kaufland": [9.99, 13.99, 7.99],
        "Carrefour": [9.49, 13.49, 7.49],
        "Auchan": [8.79, 12.79, 6.79],
        "Tesco": [9.69, 13.69, 7.69],
        "Aldi": [7.79, 11.79, 5.79],
        "Żabka": [14.99, 18.99, 11.99]
    },
    "ręczniki papierowe_higiena": {
        "Biedronka": [6.99, 9.99, 4.99],
        "Lidl": [5.99, 8.99, 3.99],
        "Kaufland": [7.99, 10.99, 5.99],
        "Carrefour": [7.49, 10.49, 5.49],
        "Auchan": [6.79, 9.79, 4.79],
        "Tesco": [7.69, 10.69, 5.69],
        "Aldi": [5.79, 8.79, 3.79],
        "Żabka": [11.99, 14.99, 8.99]
    }
};

// Funkcja do pobierania średniej ceny produktu w danym sklepie
function pobierzSredniaCene(produkt, kategoria, sklep) {
    const klucz = `${produkt.toLowerCase()}_${kategoria.toLowerCase()}`;
    
    if (bazaCenProduktow[klucz] && bazaCenProduktow[klucz][sklep]) {
        const ceny = bazaCenProduktow[klucz][sklep];
        const srednia = ceny.reduce((sum, cena) => sum + cena, 0) / ceny.length;
        return parseFloat(srednia.toFixed(2));
    }
    
    return null;
}

// Funkcja do pobierania losowej ceny z zakresu dla produktu
function pobierzLosowaRealnaaCene(produkt, kategoria, sklep) {
    const klucz = `${produkt.toLowerCase()}_${kategoria.toLowerCase()}`;
    
    if (bazaCenProduktow[klucz] && bazaCenProduktow[klucz][sklep]) {
        const ceny = bazaCenProduktow[klucz][sklep];
        const losowaIndex = Math.floor(Math.random() * ceny.length);
        return ceny[losowaIndex];
    }
    
    return null;
}

// Funkcja do wyszukiwania podobnych produktów
function znajdzPodobnyProdukt(produkt, kategoria) {
    const produktLower = produkt.toLowerCase();
    const kategoriaLower = kategoria.toLowerCase();
    
    // Słownik synonimów i podobnych produktów
    const synonimy = {
        'mleko': ['mleko uht 3,2%'],
        'ziemniak': ['ziemniaki'],
        'ziemniaczki': ['ziemniaki'],
        'jabłko': ['jabłka'],
        'banan': ['banany'],
        'pomarańcza': ['pomarańcze'],
        'pomidor': ['pomidory'],
        'kurczak': ['pierś z kurczaka'],
        'pierś kurczaka': ['pierś z kurczaka'],
        'cola': ['coca cola'],
        'pepsi': ['coca cola'],
        'papier': ['papier toaletowy'],
        'toaletowy': ['papier toaletowy'],
        'ręcznik': ['ręczniki papierowe'],
        'ręczniki': ['ręczniki papierowe'],
        'papierowy': ['ręczniki papierowe']
    };
    
    // Sprawdź synonimy
    for (const [synonim, produkty] of Object.entries(synonimy)) {
        if (produktLower.includes(synonim)) {
            for (const podobnyProdukt of produkty) {
                const klucz = `${podobnyProdukt}_${kategoriaLower}`;
                if (bazaCenProduktow[klucz]) {
                    return podobnyProdukt;
                }
            }
        }
    }
    
    // Sprawdź częściowe dopasowania
    for (const klucz of Object.keys(bazaCenProduktow)) {
        const [produktBazy, kategoriaBazy] = klucz.split('_');
        if (kategoriaBazy === kategoriaLower && 
            (produktBazy.includes(produktLower) || produktLower.includes(produktBazy))) {
            return produktBazy;
        }
    }
    
    return null;
}

// Eksportuj funkcje dla użycia w głównej aplikacji
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        bazaCenProduktow,
        pobierzSredniaCene,
        pobierzLosowaRealnaaCene,
        znajdzPodobnyProdukt
    };
}