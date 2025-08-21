import asyncio
import os
from playwright.async_api import async_playwright
from PIL import Image
import io

async def convert_html_to_gif():
    # Lista wszystkich paneli do konwersji
    panels = [
        'about_panel.html',
        'donation_panel.html', 
        'schedule_panel.html',
        'setup_panel.html',
        'rules_panel.html',
        'social_panel.html',
        'games_panel.html',
        'discord_panel.html'
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Ustawienie rozmiaru viewport na większy, aby pomieścić cały panel
        await page.set_viewport_size({"width": 400, "height": 200})
        
        for panel in panels:
            if os.path.exists(panel):
                print(f"Tworzę animowany GIF dla {panel}...")
                
                # Wczytaj plik HTML
                file_path = os.path.abspath(panel)
                await page.goto(f"file:///{file_path}")
                
                # Poczekaj na załadowanie animacji
                await page.wait_for_timeout(2000)
                
                # Znajdź element panelu
                panel_element = await page.query_selector('.panel')
                if panel_element:
                    frames = []
                    
                    # Zbierz 20 klatek przez 4 sekundy (5 FPS)
                    for i in range(20):
                        # Zrób screenshot elementu panelu
                        screenshot_bytes = await panel_element.screenshot()
                        
                        # Konwertuj na obraz PIL
                        img = Image.open(io.BytesIO(screenshot_bytes))
                        frames.append(img)
                        
                        # Poczekaj 200ms między klatkami
                        await page.wait_for_timeout(200)
                        
                        print(f"  Klatka {i+1}/20")
                    
                    # Zapisz jako animowany GIF
                    gif_name = panel.replace('.html', '.gif')
                    frames[0].save(
                        gif_name,
                        save_all=True,
                        append_images=frames[1:],
                        duration=200,  # 200ms między klatkami
                        loop=0  # Nieskończona pętla
                    )
                    
                    print(f"✅ Zapisano animowany GIF: {gif_name}")
                    
                else:
                    print(f"❌ Nie znaleziono elementu .panel w {panel}")
            else:
                print(f"❌ Plik {panel} nie istnieje!")
        
        await browser.close()
        print("\n🎉 Konwersja zakończona! Wszystkie panele zostały zapisane jako animowane pliki GIF.")

if __name__ == "__main__":
    asyncio.run(convert_html_to_gif())