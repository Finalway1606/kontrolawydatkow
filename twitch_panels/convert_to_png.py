import asyncio
import os
from playwright.async_api import async_playwright

async def convert_html_to_png_and_gif():
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
                print(f"Konwertuję {panel}...")
                
                # Wczytaj plik HTML
                file_path = os.path.abspath(panel)
                await page.goto(f"file:///{file_path}")
                
                # Poczekaj na załadowanie animacji
                await page.wait_for_timeout(2000)
                
                # Znajdź element panelu
                panel_element = await page.query_selector('.panel')
                if panel_element:
                    # Zapisz jako PNG - screenshot tylko elementu panelu
                    png_name = panel.replace('.html', '.png')
                    await panel_element.screenshot(path=png_name)
                    print(f"Zapisano PNG: {png_name}")
                    
                    # Zapisz jako animowany GIF
                    gif_name = panel.replace('.html', '.gif')
                    
                    # Nagrywanie animacji przez 4 sekundy (pełny cykl animacji)
                    print(f"Nagrywam animację dla {gif_name}...")
                    
                    # Rozpocznij nagrywanie wideo
                    await page.video.start_recording({
                        'dir': os.getcwd(),
                        'size': {'width': 320, 'height': 100}
                    })
                    
                    # Nagrywaj przez 4 sekundy (pełny cykl animacji)
                    await page.wait_for_timeout(4000)
                    
                    # Zatrzymaj nagrywanie
                    video_path = await page.video.stop_recording()
                    
                    print(f"Zapisano wideo: {video_path}")
                    print(f"Konwertuj wideo na GIF używając: ffmpeg -i {video_path} -vf 'fps=10,scale=320:100' {gif_name}")
                    
                else:
                    print(f"Nie znaleziono elementu .panel w {panel}")
            else:
                print(f"Plik {panel} nie istnieje!")
        
        await browser.close()
        print("\nKonwersja PNG zakończona!")
        print("Aby utworzyć pliki GIF, użyj ffmpeg do konwersji nagranych plików wideo.")

if __name__ == "__main__":
    asyncio.run(convert_html_to_png_and_gif())