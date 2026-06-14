"""
auto_scraper.py — Scraper automatico para tsoto.net
====================================================
Busca el ultimo producto agregado en tsoto, compara con el ultimo
scrapeado (guardado en Firestore), y procesa solo los nuevos.

Uso:
  python auto_scraper.py                  # Scrapea productos nuevos
  python auto_scraper.py --product 24784  # Un producto especifico
"""

import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore
import re, time, sys, os, copy, unicodedata
from deep_translator import GoogleTranslator

# --- CONFIG ---
SERVICE_ACCOUNT_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT",
    os.path.join(os.path.dirname(__file__), "..", "tsoto_scraper", "secrets", "serviceAccountKey.json"),
)
STORAGE_BUCKET = "starfigs-29d31"
REQUEST_DELAY = 1.5
TSOTO_BASE = "https://www.tsoto.net"
STATE_DOC_ID = "_scraper_state"

# --- FIREBASE INIT ---

def init_firebase():
    cred_path = SERVICE_ACCOUNT_PATH
    if not os.path.exists(cred_path):
        alt_paths = [
            "secrets/serviceAccountKey.json",
            "../tsoto_scraper/secrets/serviceAccountKey.json",
            "/etc/secrets/serviceAccountKey.json",
        ]
        for p in alt_paths:
            if os.path.exists(p):
                cred_path = p
                break
        else:
            print(f"[ERR] No se encontro serviceAccountKey.json en {cred_path} ni alternativas")
            sys.exit(1)

    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})
    return firestore.client()


db = init_firebase()


# --- TRACKING ---

def get_last_scraped_id() -> int:
    doc_ref = db.collection("_meta").document(STATE_DOC_ID)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("lastTsotoId", 0)
    return 0


def save_last_scraped_id(tsoto_id: int):
    doc_ref = db.collection("_meta").document(STATE_DOC_ID)
    doc_ref.set({
        "lastTsotoId": tsoto_id,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    print(f"  [STATE] Ultimo tsotoId guardado: {tsoto_id}")


# --- ENCONTRAR PRODUCTOS NUEVOS EN TSOTO ---

def get_newest_tsoto_id() -> int | None:
    """Obtiene el ID del producto mas nuevo desde la pagina de ultimos de tsoto."""
    url = f"{TSOTO_BASE}/Shop?order=desc&by=latest"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        links = soup.select('a[href*="/Shop/"]')
        max_id = 0
        for a in links:
            href = a.get("href", "")
            m = re.search(r"/Shop/(\d+)", href)
            if m:
                pid = int(m.group(1))
                if pid > 1000 and pid > max_id:
                    max_id = pid

        if max_id == 0:
            print("[ERR] No se encontraron productos en la pagina de ultimos")
            return None

        print(f"[LATEST] Producto mas nuevo en tsoto: {max_id}")
        return max_id
    except Exception as e:
        print(f"[ERR] Error obteniendo pagina de ultimos: {e}")
        return None


# --- EXTRACCION DE DESCRIPCION ---

def extract_description_clean(soup):
    anker = soup.find("a", id="Description")
    if not anker:
        return ""

    for sib in anker.find_next_siblings():
        if sib.name == "div" and "panel" in (sib.get("class") or []):
            pc = sib.find("div", class_="PanelContent")
            if not pc:
                continue

            c = copy.copy(pc)

            for x in c.find_all("div", class_="MVO"):
                x.decompose()
            for x in c.find_all("div", class_=["important-blue", "important"]):
                x.decompose()
            for x in c.find_all("span", class_="b"):
                x.decompose()

            for br in c.find_all("br"):
                br.replace_with("\n")

            texto = c.get_text()
            texto = re.sub(r"\n{3,}", "\n\n", texto)

            skip_patterns = [
                "pro Anschrift", "Haushalt", "bestellbare", r"Max\.", "3x",
            ]
            lines = texto.split("\n")
            clean_lines = []
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue
                if any(re.search(p, stripped, re.IGNORECASE) for p in skip_patterns):
                    continue
                clean_lines.append(stripped)

            return "\n".join(clean_lines).strip()

    return ""


def extract_gtin(soup):
    anker = soup.find("a", id="Description")
    if not anker:
        return ""

    for sib in anker.find_next_siblings():
        if sib.name == "div" and "panel" in (sib.get("class") or []):
            pc = sib.find("div", class_="PanelContent")
            if pc:
                mvo = pc.find("div", class_="MVO")
                if mvo:
                    texto = mvo.get_text()
                    m = re.search(r"\b(\d{8,14})\b", texto)
                    if m:
                        return m.group(1)
    return ""


# --- EXTRACCION DE NOMBRE Y PRECIO ---

def extract_product_name(soup) -> str:
    """Extrae el nombre del producto desde el <title> de tsoto."""
    title = soup.find("title")
    if not title:
        return ""
    name = title.get_text(strip=True)
    # Quitar sufijo " - Shop - tsoto.net β"
    for suffix in [" - Shop - tsoto.net", " - tsoto.net", " - Shop"]:
        idx = name.find(suffix)
        if idx > 0:
            name = name[:idx]
            break
    return name.strip()


def extract_price(soup) -> float | None:
    """Extrae el precio numerico del producto."""
    for el in soup.find_all(["div", "span"], class_=re.compile(r"shop_article_price|m_shop_article_price", re.I)):
        text = el.get_text(strip=True)
        # Busca patron como "60,99 EUR" o "1.299,00 EUR"
        m = re.search(r"(\d{1,6}(?:\.\d{3})*,\d{2})", text)
        if m:
            # Convertir formato europeo "1.299,00" -> 1299.00
            num_str = m.group(1).replace(".", "").replace(",", ".")
            return float(num_str)
    return None


def generate_slug(name: str) -> str:
    """Genera un slug URL-friendly desde el nombre."""
    slug = name.lower()
    # Normalizar unicode (quitar acentos)
    slug = unicodedata.normalize("NFKD", slug).encode("ASCII", "ignore").decode("ASCII")
    # Reemplazar caracteres no alfanumericos por guiones
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def normalize_dashes(text: str) -> str:
    lines = text.split("\n")
    normalized = []
    for line in lines:
        if line.startswith("-") and not line.startswith("- "):
            line = "- " + line[1:].lstrip()
        normalized.append(line)
    return "\n".join(normalized)


# --- TRADUCCION ---

def translate_to_es(text: str) -> str:
    if not text or len(text.strip()) < 10:
        return text
    try:
        translator = GoogleTranslator(source="de", target="es")
        result = translator.translate(text)
        if result:
            result = normalize_dashes(result)
        return result or text
    except Exception as e:
        print(f"  [WARN] Error traduciendo: {e}")
        return text


# --- SCRAPING ---

def get_product_page(tsoto_id: int) -> BeautifulSoup | None:
    url = f"{TSOTO_BASE}/Shop/{tsoto_id}-test"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  [ERR] HTTP {tsoto_id}: {e}")
        return None


def process_product(tsoto_id: int, save: bool = True) -> dict:
    print(f"\n[PROC] {tsoto_id}...", end=" ")

    soup = get_product_page(tsoto_id)
    if not soup:
        return {"tsotoId": tsoto_id, "status": "error", "error": "HTTP fallo"}

    desc_original = extract_description_clean(soup)
    if not desc_original:
        print("[SKIP] Sin descripcion")
        return {"tsotoId": tsoto_id, "status": "sin_descripcion"}

    print(f"[OK] ({len(desc_original)} chars)", end=" ")

    gtin = extract_gtin(soup)
    name = extract_product_name(soup)
    price = extract_price(soup)

    desc_es = translate_to_es(desc_original)
    print(f"-> ES ({len(desc_es)} chars)", end=" ")

    result = {
        "tsotoId": tsoto_id,
        "status": "ok",
        "name": name,
        "price": price,
        "description": desc_original,
        "description_es": desc_es,
        "gtin": gtin,
    }

    if save and desc_es:
        save_to_firestore(tsoto_id, name, price, desc_original, desc_es, gtin)

    return result


def save_to_firestore(tsoto_id: int, name: str, price: float | None, description: str, description_es: str, gtin: str):
    docs = list(
        db.collection("products")
        .where("tsotoId", "==", tsoto_id)
        .limit(1)
        .stream()
    )
    if docs:
        # Producto existe → solo actualizar descripcion y gtin
        doc_id = docs[0].id
        update_data = {
            "description": description,
            "description_es": description_es,
        }
        if gtin:
            update_data["gtin"] = gtin
        db.collection("products").document(doc_id).update(update_data)
        print(f"[UPDATE] {doc_id[:8]}...")
        return

    # Producto NO existe → CREARLO
    slug = generate_slug(name) if name else f"producto-{tsoto_id}"
    product_data = {
        "name": name or f"Producto {tsoto_id}",
        "slug": slug,
        "price": price if price else 0,
        "description": description,
        "description_es": description_es,
        "tsotoId": tsoto_id,
        "imageUrls": [],
        "brand": "",
        "line": "",
        "category": "figura",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "views": 0,
        "stock": 0,
    }
    if gtin:
        product_data["gtin"] = gtin

    # Usar tsotoId como ID del documento para evitar duplicados en re-ejecuciones
    doc_ref = db.collection("products").document(str(tsoto_id))
    doc_ref.set(product_data)
    print(f"[CREATE] {doc_ref.id[:8]}...")


# --- FLUJO PRINCIPAL ---

def scrape_new_products():
    """
    1. Obtiene el ID mas nuevo en tsoto.net
    2. Compara con el ultimo scrapeado
    3. Itera por CADA ID en el rango (ultimo+1 ... mas nuevo)
       Si un ID no existe (HTTP 404), lo salta
    4. Guarda el ID mas alto procesado exitosamente
    """
    last_scraped = get_last_scraped_id()

    if last_scraped == 0:
        print("\n[STATE] No hay estado guardado. Usa --init ULTIMO_ID para empezar.")
        print("  Ejemplo: python auto_scraper.py --init 24942")
        return

    print(f"\n[STATE] Ultimo producto scrapeado: {last_scraped}")

    newest = get_newest_tsoto_id()
    if not newest:
        print("[ERR] No se pudo obtener el ID mas nuevo de tsoto")
        return

    if newest <= last_scraped:
        print(f"\n[DONE] No hay productos nuevos (mas nuevo: {newest}, ya procesado)")
        return

    new_ids = list(range(last_scraped + 1, newest + 1))
    total = len(new_ids)
    first_id = new_ids[0]
    last_id = new_ids[-1]
    print(f"\n[NEW] {total} IDs en el rango ({first_id} - {last_id})")
    print("      (los IDs que no existan se saltaran automaticamente)\n")

    ok = 0
    sin_desc = 0
    errores = 0
    max_ok_id = last_scraped

    for i, tid in enumerate(new_ids, 1):
        if i > 1:
            time.sleep(REQUEST_DELAY)

        result = process_product(tid)
        if result["status"] == "ok":
            ok += 1
            if tid > max_ok_id:
                max_ok_id = tid
        elif result["status"] == "sin_descripcion":
            sin_desc += 1
        else:
            errores += 1

        if i % 10 == 0 or i == total:
            print(f"  [{i}/{total}] OK={ok} sin_desc={sin_desc} err={errores}")

    if ok > 0:
        save_last_scraped_id(max_ok_id)
    else:
        print("\n  [STATE] No se guardo estado nuevo (0 productos OK)")

    print(f"\n[DONE] Resumen: {ok} OK, {sin_desc} sin descripcion, {errores} errores")
    if ok > 0:
        print(f"[DONE] Ultimo tsotoId guardado: {max_ok_id} (de {newest} en tsoto)")


# --- MAIN ---

def main():
    if "--init" in sys.argv:
        idx = sys.argv.index("--init")
        if idx + 1 < len(sys.argv):
            init_id = int(sys.argv[idx + 1])
            save_last_scraped_id(init_id)
            print(f"[INIT] Estado inicializado con tsotoId: {init_id}")
        else:
            print("[ERR] Especifica un ID: --init 24942")
    elif "--product" in sys.argv:
        idx = sys.argv.index("--product")
        if idx + 1 < len(sys.argv):
            tid = int(sys.argv[idx + 1])
            process_product(tid, save=True)
        else:
            print("[ERR] Especifica un ID: --product 24784")
    else:
        scrape_new_products()


if __name__ == "__main__":
    main()
