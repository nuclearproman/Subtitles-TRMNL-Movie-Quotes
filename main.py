import random
from fastapi import FastAPI
import httpx
from bs4 import BeautifulSoup

app = FastAPI()

WIKI_URL = "https://en.wikipedia.org/wiki/AFI%27s_100_Years...100_Movie_Quotes"
MAX_CHARS = 250  # Maximum characters to cleanly sit inside the TRMNL 2xl/3xl viewport template

@app.get("/")
async def get_random_quote():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(WIKI_URL, headers=headers, timeout=10.0)
            response.raise_for_status()
        except httpx.HTTPError:
            return {
                "quote": "TRMNL We Have A Problem! (Error fetching the quote...)",
                "character": "Nuclearpro",
                "film": "Debugging",
                "is_truncated": False
            }

    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table", {"class": "wikitable"})
    if not table:
        return {"error": "Could not locate the quotes table."}
    
    quotes_list = []
    
    for row in table.find_all("tr")[1:]:
        cells = row.find_all(["td", "th"])
        
        if len(cells) >= 5:
            # Strip outer typographic styling markers and footnotes
            quote_text = " " + cells[1].get_text(strip=True).strip('"').strip('“').strip('”') + " "
            character = cells[2].get_text(strip=True) + "  ,     "
            film = cells[4].get_text(strip=True)
            
            is_truncated = False
            
            # --- OVERFLOW PROTECTION TRUNCATION LOGIC ---
            if len(quote_text) > MAX_CHARS:
                # Find the nearest white space right under our max character ceiling
                truncation_point = quote_text.rfind(" ", 0, MAX_CHARS)
                if truncation_point != -1:
                    quote_text = quote_text[:truncation_point].rstrip(",.!?;:") + "..."
                else:
                    quote_text = quote_text[:MAX_CHARS] + "..."
                is_truncated = True
            # --------------------------------------------
            
            quotes_list.append({
                "quote": quote_text,
                "character": character,
                "film": film,
                "is_truncated": is_truncated
            })
            
    if not quotes_list:
        return {"error": "No quotes extracted from the page table."}
        
    return random.choice(quotes_list)
