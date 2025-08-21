import asyncio
import os
from playwright.async_api import async_playwright

async def convert_rules_panel_to_png():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Ustawienie rozmiaru viewport
        await page.set_viewport_size({"width": 400, "height": 200})
        
        panel_file = 'rules_panel.html'
        
        if os.path.exists(panel_file):
            print(f"Konwertuję {panel_file}...")
            
            # Wczytaj plik HTML
            file_path = os.path.abspath(panel_file)
            await page.goto(f"file:///{file_path}")
            
            # Poczekaj na załadowanie animacji
            await page.wait_for_timeout(2000)
            
            # Znajdź element panelu
            panel_element = await page.query_selector('.panel')
            if panel_element:
                # Zapisz jako PNG - screenshot tylko elementu panelu
                png_name = panel_file.replace('.html', '.png')
                await panel_element.screenshot(path=png_name)
                print(f"Zapisano PNG: {png_name}")
            else:
                print(f"Nie znaleziono elementu .panel w {panel_file}")
        else:
            print(f"Plik {panel_file} nie istnieje!")
        
        await browser.close()
        print("Konwersja PNG zakończona!")

if __name__ == "__main__":
    asyncio.run(convert_rules_panel_to_png())