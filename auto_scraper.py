"""
auto_scraper.py — Scraper automatico completo para tsoto.net
============================================================
Busca productos nuevos en tsoto (comparando IDs), extrae TODOS los datos:
nombre, precio (conversion ×4 + ajuste + X9.00), imagenes (descarga +
redimension + upload a Storage), descripcion, GTIN, altura, linea,
fabricante, fecha lanzamiento (con -4 meses), categoria, etc.

Uso:
  python auto_scraper.py                    # Scrapea productos nuevos
  python auto_scraper.py --init 24942       # Inicializa estado
  python auto_scraper.py --product 24784    # Un producto especifico
  python auto_scraper.py --backfill 24877 24942  # Rango especifico
"""

import asyncio
import unicodedata
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore, storage
from PIL import Image, ImageEnhance
from io import BytesIO
from datetime import datetime
from dateutil.relativedelta import relativedelta
import aiohttp
import re, time, sys, os, random, copy, uuid
from concurrent.futures import ThreadPoolExecutor
from deep_translator import GoogleTranslator

# ─── CONFIG ────────────────────────────────────────────────────────────────

SERVICE_ACCOUNT_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT",
    os.path.join(os.path.dirname(__file__), "..", "tsoto_scraper", "secrets", "serviceAccountKey.json"),
)
STORAGE_BUCKET = "starfigs-29d31"
REQUEST_DELAY = 1.5  # segundos entre requests a tsoto.net
TSOTO_BASE = "https://www.tsoto.net"
STATE_DOC_ID = "_scraper_state"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0",
]

SKIP_BRANDS = {
    "sakami merchandise", "popbuddies", "dark horse comics",
    "great eastern entertainment", "takara tomy", "youtooz",
    "sun arrow", "the noble collection", "ensky", "ravensburger",
    "clementoni", "ncsoft", "artesania cerda", "neamedia icons",
    "thumbs up", "Benelic",
}

MAX_PRICE_EUR = 271.0

ROUNDING_CONFIG = {
    "strategy": "nearest",
    "min_price": 10,
    "max_price": 1000,
}

VERBOSE = False


# ─── FIREBASE INIT ─────────────────────────────────────────────────────────

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
            print(f"[ERR] No se encontro serviceAccountKey.json")
            sys.exit(1)

    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})
    return firestore.client(), storage.bucket()


db, bucket = init_firebase()


# ─── TRACKING ──────────────────────────────────────────────────────────────

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


def get_newest_tsoto_id() -> int | None:
    """Obtiene el ID del producto mas nuevo desde la pagina de ultimos."""
    url = f"{TSOTO_BASE}/Shop?order=desc&by=latest"
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        max_id = 0
        for a in soup.select('a[href*="/Shop/"]'):
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


# ─── UTILIDADES ────────────────────────────────────────────────────────────

def log(msg):
    if VERBOSE:
        print(msg)


def normalize_ascii(text: str) -> str:
    if not text:
        return text
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")


def slugify(text: str) -> str:
    text = normalize_ascii(text)
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# ─── TRADUCCION DE NOMBRES ────────────────────────────────────────────────

def translate_product_name(name: str) -> str:
    translations = {
        "Scale Figure": "Figura a Escala",
        "Scale Action Figure": "Figura de Accion a Escala",
        "Chibi Figure": "Figura Chibi",
        "Ichibansho Figure": "Ichiban Kuji",
        "Action Figure": "Figura de Accion",
        "Scale": "Escala",
        "Plusch": "Plush",
        "Schlusselanhanger": "Llavero",
        "Zubehor": "Accesorios",
        "Herr der Ringe": "El senor de los anillos",
        "Die Tagebucher der Apothekerin": "The Apothecary Diaries",
    }
    for eng, esp in translations.items():
        if eng in name:
            name = name.replace(eng, esp)
    return normalize_ascii(name)


def translate_product_line(line: str) -> str:
    if not line:
        return line
    translations = {"Ichibansho Figure": "Ichiban Kuji", "Ichibansho": "Ichiban Kuji"}
    normalized = normalize_ascii(' '.join(line.replace('&nbsp;', ' ').split()).lower())
    for term, translation in translations.items():
        if term.lower() in normalized:
            return translation
    return line


# ─── EXTRACCION DE DATOS DE LA PAGINA ─────────────────────────────────────

def extract_product_name(soup) -> str | None:
    """Extrae nombre desde .shop_article_title o #ShopArticleTitle."""
    name_elem = soup.select_one(".shop_article_title") or soup.select_one("#ShopArticleTitle")
    if not name_elem:
        return None
    return normalize_ascii(translate_product_name(name_elem.get_text(strip=True)))


def extract_euro_price(soup) -> float | None:
    """Extrae precio en EUR desde selectores de precio."""
    price_selectors = [".shop_article_price .b.bigger", ".m_shop_article_price .b.big"]
    price_tag = None
    for selector in price_selectors:
        price_tag = soup.select_one(selector)
        if price_tag:
            break
    if not price_tag:
        # Fallback: buscar en div.shop_article_price
        for el in soup.find_all(["div", "span"], class_=re.compile(r"shop_article_price|m_shop_article_price", re.I)):
            text = el.get_text(strip=True)
            m = re.search(r"(\d{1,6}(?:\.\d{3})*,\d{2})", text)
            if m:
                price_tag = el
                break
    if not price_tag:
        return None
    raw = price_tag.get_text(strip=True)
    # "60,99 EUR" o "1.299,00 EUR"
    m = re.search(r"(\d{1,6}(?:\.\d{3})*,\d{2})", raw)
    if not m:
        return None
    num_str = m.group(1).replace(".", "").replace(",", ".")
    return float(num_str)


def round_to_x9_00(price: float) -> float:
    """Redondea precio a formato X9.00 (19.00, 29.00, etc.)."""
    if price < ROUNDING_CONFIG["min_price"] or price > ROUNDING_CONFIG["max_price"]:
        return price
    tens = int(price // 10) * 10
    lower_price = tens - 1 + 0.00
    upper_price = tens + 9 + 0.00
    valid_lower = lower_price if lower_price >= ROUNDING_CONFIG["min_price"] else upper_price
    if valid_lower == upper_price:
        return upper_price
    diff_upper = abs(price - upper_price)
    diff_lower = abs(price - valid_lower)
    return valid_lower if diff_lower <= diff_upper else upper_price


def calculate_final_price(euro_price: float, product_line: str | None = None) -> float:
    """
    Logica de precios:
    1. Multiplica por 4
    2. Si es nendoroid: +10 fijo
    3. Sino: ajuste segun rango
    4. Redondeo X9.00
    """
    base = euro_price * 4
    if product_line and "nendoroid" in product_line.lower():
        adjusted = base + 10
        print(f"  [PRICE] NENDOROID: {euro_price}EUR x4 = {base} + 10 = {adjusted}")
    else:
        if base < 160:
            adj = 40
        elif base < 200:
            adj = 60
        elif base < 300:
            adj = 60
        elif base < 400:
            adj = 30
        elif base < 500:
            adj = 10
        elif base < 600:
            adj = 90
        elif base < 700:
            adj = 90
        elif base < 800:
            adj = 90
        elif base < 900:
            adj = -110
        elif base < 1000:
            adj = -150
        elif base < 1100:
            adj = -150
        else:
            adj = -150
        adjusted = base + adj
        print(f"  [PRICE] {euro_price}EUR x4 = {base} + {adj} = {adjusted}")

    if adjusted < 0:
        adjusted = 0
    final_price = round_to_x9_00(adjusted)
    print(f"  [PRICE] Redondeo X9.00: {adjusted:.2f} -> S/{final_price}")
    return final_price


def extract_release_date(soup) -> datetime | None:
    """Extrae fecha de lanzamiento del link release= y resta 4 meses."""
    rel_link = soup.select_one("a[href^='/Shop?release=']")
    if not rel_link:
        return None
    href = rel_link.get("href", "")
    m = re.search(r"release=(\d{4}-\d{2}-\d{2})_", href)
    if not m:
        return None
    real_date = datetime.strptime(m.group(1), "%Y-%m-%d")
    adjusted = real_date - relativedelta(months=4)
    now = datetime.now()
    if adjusted > now:
        print(f"  [DATE] Lanzamiento: {adjusted.strftime('%Y-%m-%d')} (original: {real_date.strftime('%Y-%m-%d')}, -4 meses)")
        return adjusted
    print(f"  [DATE] Fecha pasada (omitida): {adjusted.strftime('%Y-%m-%d')}")
    return None


def extract_details(soup) -> dict:
    """Extrae brand, line, height, scale desde div.ShopAF."""
    result = {"brand": None, "line": None, "heightCm": None, "scale": None}
    for div in soup.select("div.ShopAF"):
        text = div.get_text()
        if "Mase" in text or "Maße" in text:
            m = re.search(r"(\d+)", text)
            if m:
                result["heightCm"] = int(m.group(1))
        elif "Masstab" in text or "Maßstab" in text:
            result["scale"] = text.replace("Maßstab:", "").replace("Maßstab:", "").strip()
        elif "Hersteller" in text:
            tag = div.find("a")
            if tag:
                result["brand"] = normalize_ascii(tag.get_text(strip=True))
        elif "Produktreihe" in text:
            tag = div.find("a")
            if tag:
                result["line"] = translate_product_line(tag.get_text(strip=True))
    return result


def extract_image_urls(soup) -> list:
    """Extrae URLs de imagenes desde #ShopArticleGalleryBox."""
    gallery_box = soup.select_one("#ShopArticleGalleryBox")
    if not gallery_box:
        return []
    urls = []
    for li_item in gallery_box.select("ul#AGI li"):
        link = li_item.select_one("a[href]")
        if not link:
            continue
        href = link.get("href", "")
        if not href:
            continue
        if href.startswith("//"):
            full = "https:" + href
        elif href.startswith("/"):
            full = "https://www.tsoto.net" + href
        else:
            full = href
        if full.lower().endswith(".jpg"):
            urls.append(full)
    return urls


def extract_description_clean(soup):
    """Extrae descripcion limpia del panel Description."""
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
            skip_patterns = ["pro Anschrift", "Haushalt", "bestellbare", r"Max\.", "3x"]
            lines = texto.split("\n")
            clean = []
            for line in lines:
                s = line.strip()
                if not s:
                    continue
                if any(re.search(p, s, re.IGNORECASE) for p in skip_patterns):
                    continue
                clean.append(s)
            return "\n".join(clean).strip()
    return ""


def extract_gtin(soup) -> str:
    """Extrae GTIN/EAN del MVO."""
    anker = soup.find("a", id="Description")
    if not anker:
        return ""
    for sib in anker.find_next_siblings():
        if sib.name == "div" and "panel" in (sib.get("class") or []):
            pc = sib.find("div", class_="PanelContent")
            if pc:
                mvo = pc.find("div", class_="MVO")
                if mvo:
                    m = re.search(r"\b(\d{8,14})\b", mvo.get_text())
                    if m:
                        return m.group(1)
    return ""


def determine_category(line: str | None, name: str | None) -> str:
    """Determina categoria basado en keywords."""
    text = f"{line or ''} {name or ''}".lower()
    if "plush" in text or "peluche" in text or "plusch" in text:
        return "plush"
    if "nendoroid" in text:
        return "nendoroid"
    if "figma" in text:
        return "figma"
    if "figuarts" in text:
        return "figuarts"
    if "pop-up" in text or "pop up" in text or "popup" in text:
        return "pop-up-parade"
    if "ichiban" in text or "kuji" in text:
        return "ichiban-kuji"
    if "scale" in text or re.search(r'\d+/\d+', text):
        return "scale"
    return "figura"


def is_product_not_found(soup, page_text: str, product_id: int) -> bool:
    """Detecta si el producto no existe en tsoto."""
    for indicator in ["Nicht gefunden", "Artikel nicht gefunden", "Product not found", "Error 404"]:
        if indicator in page_text:
            log(f"  [CHECK] Producto {product_id}: '{indicator}'")
            return True
    # Verificar titulo
    if not (soup.select_one(".shop_article_title") or soup.select_one("#ShopArticleTitle")):
        log(f"  [CHECK] Producto {product_id}: sin titulo")
        return True
    # Verificar precio
    price_ok = bool(soup.select_one(".shop_article_price") or soup.select_one(".m_shop_article_price"))
    gallery_ok = bool(soup.select_one("#ShopArticleGalleryBox"))
    if not price_ok and not gallery_ok:
        log(f"  [CHECK] Producto {product_id}: sin precio ni galeria")
        return True
    return False


def normalize_dashes(text: str) -> str:
    lines = text.split("\n")
    normalized = []
    for line in lines:
        if line.startswith("-") and not line.startswith("- "):
            line = "- " + line[1:].lstrip()
        normalized.append(line)
    return "\n".join(normalized)


def translate_to_es(text: str) -> str:
    """Traduce descripcion de aleman a espanol."""
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


# ─── IMAGE PROCESSOR ───────────────────────────────────────────────────────

class ImageProcessor:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)

    def calculate_quality(self, image_type: str, file_size_kb: float) -> int:
        base = {"original": 75, "thumbnail": 80, "additional": 70, "gallery_thumb": 85}
        adj = -10 if file_size_kb > 500 else (-5 if file_size_kb > 200 else 0)
        return max(50, min(90, base.get(image_type, 75) + adj))

    def smart_resize(self, image, target_width, target_height=None, square=False):
        if square:
            size = min(image.size)
            left = (image.width - size) // 2
            top = (image.height - size) // 2
            image = image.crop((left, top, left + size, top + size))
            return image.resize((target_width, target_width), Image.Resampling.LANCZOS)
        if target_height is None:
            ratio = target_width / image.width
            target_height = int(image.height * ratio)
        else:
            ratio = min(target_width / image.width, target_height / image.height)
            target_width = int(image.width * ratio)
            target_height = int(image.height * ratio)
        return image.resize((target_width, target_height), Image.Resampling.LANCZOS)

    def compress_webp(self, image, image_type, original_size_kb):
        quality = self.calculate_quality(image_type, original_size_kb)
        if image.width < 800:
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.1)
        buf = BytesIO()
        image.save(buf, format="WEBP", quality=quality, method=4)
        return buf.getvalue()

    def upload_to_firebase(self, image_data: bytes, path: str) -> str | None:
        try:
            clean_path = path.replace("//", "/").strip("/")
            blob = bucket.blob(clean_path)
            token = str(uuid.uuid4())
            blob.metadata = {"firebaseStorageDownloadTokens": token}
            blob.upload_from_string(image_data, content_type="image/webp")
            url = (f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
                   f"{clean_path.replace('/', '%2F')}?alt=media&token={token}")
            return url
        except Exception as e:
            print(f"    [IMG ERR] Upload fallo: {e}")
            return None

    def process_single_image(self, image_data: bytes, original_size: int,
                             product_id: int, image_index: int, is_first: bool) -> dict:
        try:
            img = Image.open(BytesIO(image_data))
            if img.mode in ("RGBA", "LA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "RGBA":
                    bg.paste(img, mask=img.split()[-1])
                else:
                    bg.paste(img)
                img = bg
            elif img.mode != "RGB":
                img = img.convert("RGB")

            size_kb = original_size / 1024
            results = {}

            if is_first:
                # Original (1200px)
                main = self.smart_resize(img, 1200)
                main_data = self.compress_webp(main, "original", size_kb)
                results["imageUrl"] = self.upload_to_firebase(
                    main_data, f"products/{product_id}/{product_id}_original.webp")
                print(f"    Original: {len(main_data)/1024:.1f} KB")

                # Thumbnail (300px)
                thumb = self.smart_resize(img, 300)
                thumb_data = self.compress_webp(thumb, "thumbnail", size_kb)
                results["thumbnailUrl"] = self.upload_to_firebase(
                    thumb_data, f"products/{product_id}/{product_id}_thumb.webp")
                print(f"    Thumbnail: {len(thumb_data)/1024:.1f} KB")

                # Gallery thumb (100px cuadrada)
                gallery = self.smart_resize(img, 100, square=True)
                gallery_data = self.compress_webp(gallery, "gallery_thumb", size_kb)
                results["galleryThumbnailUrl"] = self.upload_to_firebase(
                    gallery_data, f"products/{product_id}/{product_id}_gallery_thumb.webp")
                print(f"    Gallery: {len(gallery_data)/1024:.1f} KB")
            else:
                # Adicional (1000px)
                add = self.smart_resize(img, 1000)
                add_data = self.compress_webp(add, "additional", size_kb)
                results["imageUrl"] = self.upload_to_firebase(
                    add_data, f"products/{product_id}/{product_id}_{image_index}.webp")
                print(f"    Adicional {image_index}: {len(add_data)/1024:.1f} KB")

                # Gallery thumb
                gallery = self.smart_resize(img, 100, square=True)
                gallery_data = self.compress_webp(gallery, "gallery_thumb", size_kb)
                results["galleryThumbnailUrl"] = self.upload_to_firebase(
                    gallery_data, f"products/{product_id}/{product_id}_gallery_thumb_{image_index}.webp")
                print(f"    Gallery: {len(gallery_data)/1024:.1f} KB")

            return results
        except Exception as e:
            print(f"    [IMG ERR] Procesando imagen {image_index}: {e}")
            return {"imageUrl": None, "thumbnailUrl": None, "galleryThumbnailUrl": None}

    async def download_image(self, session, url: str) -> tuple[bytes, int]:
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": "https://www.tsoto.net/",
        }
        async with session.get(url, headers=headers, timeout=30) as resp:
            if resp.status == 200:
                data = await resp.read()
                return data, len(data)
            raise Exception(f"HTTP {resp.status}")

    async def process_all_images(self, image_urls: list, product_id: int) -> tuple[list, str | None, list]:
        """Descarga y procesa TODAS las imagenes. Retorna (imageUrls, thumbnailUrl, galleryThumbnailUrls)."""
        if not image_urls:
            return [], None, []

        print(f"  [IMGS] Procesando {len(image_urls)} imagenes...")

        # Descargar en paralelo
        async with aiohttp.ClientSession() as session:
            tasks = [self.download_image(session, url) for url in image_urls]
            try:
                downloads = await asyncio.gather(*tasks, return_exceptions=True)
            except Exception as e:
                print(f"  [IMGS ERR] Error descargando: {e}")
                return [], None, []

        # Procesar cada imagen
        process_tasks = []
        for i, dl in enumerate(downloads):
            if isinstance(dl, Exception):
                print(f"  [IMGS ERR] Descarga imagen {i+1}: {dl}")
                continue
            image_data, original_size = dl
            task = self.executor.submit(
                self.process_single_image, image_data, original_size,
                product_id, i + 1, i == 0)
            process_tasks.append(task)

        results = []
        for task in process_tasks:
            try:
                results.append(task.result(timeout=120))
            except Exception as e:
                print(f"  [IMGS ERR] Procesando: {e}")
                results.append({"imageUrl": None, "thumbnailUrl": None, "galleryThumbnailUrl": None})

        # Extraer URLs
        image_urls_final = []
        thumbnail_url = None
        gallery_thumb_urls = []
        for i, r in enumerate(results):
            if r.get("imageUrl"):
                image_urls_final.append(r["imageUrl"])
                if r.get("galleryThumbnailUrl"):
                    gallery_thumb_urls.append(r["galleryThumbnailUrl"])
                if i == 0 and r.get("thumbnailUrl"):
                    thumbnail_url = r["thumbnailUrl"]

        ok_count = len([u for u in image_urls_final if u])
        print(f"  [IMGS] Completado: {ok_count} imagenes subidas")
        return image_urls_final, thumbnail_url, gallery_thumb_urls


image_processor = ImageProcessor()


# ─── SCRAPING ──────────────────────────────────────────────────────────────

def get_product_page(tsoto_id: int) -> BeautifulSoup | None:
    url = f"{TSOTO_BASE}/Shop/{tsoto_id}"
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
        "Referer": "https://www.google.com/",
    }
    for attempt in range(2):
        try:
            r = requests.get(url, headers=headers, timeout=20)
            if r.status_code == 200:
                return BeautifulSoup(r.text, "html.parser"), r.text
        except Exception as e:
            log(f"  [RETRY] Intento {attempt+1}: {e}")
        time.sleep(random.uniform(0.5, 1.5))
    return None, None


def find_existing_product_by_name(name: str) -> dict | None:
    """Busca producto existente por nombre exacto."""
    try:
        docs = db.collection("products").where("name", "==", name).limit(1).stream()
        for doc in docs:
            return {"id": doc.id, "data": doc.to_dict()}
    except Exception as e:
        log(f"  [DB] Error buscando duplicado: {e}")
    return None


def run_async(coro):
    """Ejecuta una corutina y retorna el resultado."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def process_product_async(tsoto_id: int, save: bool = True) -> dict:
    """Procesa UN producto (version async para poder procesar imagenes)."""
    print(f"\n[PROC] {tsoto_id}...", end=" ")

    soup, page_text = get_product_page(tsoto_id)
    if not soup:
        print("[ERR] HTTP fallo")
        return {"tsotoId": tsoto_id, "status": "error", "error": "HTTP fallo"}

    # Verificar si el producto existe
    if is_product_not_found(soup, page_text or "", tsoto_id):
        print("[SKIP] No encontrado en tsoto")
        return {"tsotoId": tsoto_id, "status": "no_encontrado"}

    # ─── Extraer datos ───
    name = extract_product_name(soup)
    if not name:
        print("[SKIP] Sin nombre")
        return {"tsotoId": tsoto_id, "status": "sin_nombre"}
    print(f"[OK] {name[:40]}...", end=" ")

    # Precio
    euro_price = extract_euro_price(soup)
    details = extract_details(soup)
    line = details.get("line")
    price = calculate_final_price(euro_price, line) if euro_price else None

    if euro_price and euro_price >= MAX_PRICE_EUR:
        print(f"[SKIP] Precio muy alto: {euro_price}EUR")
        return {"tsotoId": tsoto_id, "status": "precio_alto"}

    # Marca skip
    brand = details.get("brand")
    if brand and brand.lower() in SKIP_BRANDS:
        print(f"[SKIP] Marca: {brand}")
        return {"tsotoId": tsoto_id, "status": "marca_omitida"}

    # Fecha lanzamiento
    release_date = extract_release_date(soup)

    # Categoria
    category = determine_category(line, name)

    # Descripcion
    desc_original = extract_description_clean(soup)
    desc_es = translate_to_es(desc_original) if desc_original else ""
    gtin = extract_gtin(soup)

    # Imagenes
    image_urls_tsoto = extract_image_urls(soup)
    if not image_urls_tsoto:
        print("[SKIP] Sin imagenes")
        return {"tsotoId": tsoto_id, "status": "sin_imagenes"}

    print(f"({len(image_urls_tsoto)} img)", end=" ")

    # Procesar imagenes (descargar, redimensionar, subir a Storage)
    image_urls_final, thumbnail_url, gallery_thumb_urls = await image_processor.process_all_images(
        image_urls_tsoto, tsoto_id)

    if not image_urls_final:
        print("[SKIP] Error procesando imagenes")
        return {"tsotoId": tsoto_id, "status": "error_imagenes"}

    # Traduccion descripcion
    if desc_es:
        print(f"-> ES", end=" ")

    # Slug
    slug = slugify(name)

    # Construir datos del producto
    product_data = {
        "name": name,
        "slug": slug,
        "tsotoId": tsoto_id,
        "brand": brand or "",
        "line": line or "",
        "heightCm": details.get("heightCm"),
        "scale": details.get("scale"),
        "category": category,
        "imageUrls": image_urls_final,
        "thumbnailUrl": thumbnail_url,
        "galleryThumbnailUrls": gallery_thumb_urls,
        "views": 0,
        "stock": 0,
        "lastViewedAt": None,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "description": desc_original,
        "description_es": desc_es,
    }
    if gtin:
        product_data["gtin"] = gtin
    if price is not None:
        product_data["price"] = price
    if release_date:
        product_data["releaseDate"] = release_date

    # Guardar
    if save:
        save_to_firestore(tsoto_id, name, product_data)

    return {
        "tsotoId": tsoto_id,
        "status": "ok",
        "name": name,
        "price": price,
        "images": len(image_urls_final),
    }


def save_to_firestore(tsoto_id: int, name: str, product_data: dict):
    """Guarda o actualiza el producto en Firestore usando tsotoId como ID."""
    # Verificar duplicados por nombre
    existing = find_existing_product_by_name(name)
    if existing and existing["data"].get("tsotoId") != tsoto_id:
        print(f"\n  [DUP] Ya existe '{name}' con tsotoId {existing['data'].get('tsotoId')}, saltando")
        return

    # Buscar por tsotoId
    docs = list(db.collection("products").where("tsotoId", "==", tsoto_id).limit(1).stream())

    if docs:
        # Actualizar producto existente
        doc_id = docs[0].id
        update_data = {k: v for k, v in product_data.items()
                       if v is not None and k != "createdAt"}
        update_data["updatedAt"] = firestore.SERVER_TIMESTAMP
        db.collection("products").document(doc_id).update(update_data)
        print(f"[UPDATE] {doc_id[:8]}...")
    else:
        # Crear nuevo producto
        data = {k: v for k, v in product_data.items() if v is not None}
        data["createdAt"] = firestore.SERVER_TIMESTAMP
        doc_ref = db.collection("products").document(str(tsoto_id))
        doc_ref.set(data)
        print(f"[CREATE] {doc_ref.id[:8]}...")


def process_product(tsoto_id: int, save: bool = True) -> dict:
    """Wrapper sync para process_product_async."""
    return run_async(process_product_async(tsoto_id, save))


# ─── FLUJO PRINCIPAL ───────────────────────────────────────────────────────

def scrape_new_products():
    """Auto-descubrimiento: compara IDs y procesa productos nuevos."""
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
        print(f"\n[DONE] No hay productos nuevos (mas nuevo: {newest})")
        return

    new_ids = list(range(last_scraped + 1, newest + 1))
    total = len(new_ids)
    print(f"\n[NEW] {total} IDs en el rango ({new_ids[0]} - {new_ids[-1]})")
    print("      (los IDs que no existan se saltaran automaticamente)\n")

    ok = 0
    skipped = 0
    errores = 0
    max_ok_id = last_scraped

    for i, tid in enumerate(new_ids, 1):
        if i > 1:
            time.sleep(REQUEST_DELAY)

        result = process_product(tid)
        status = result.get("status", "error")
        if status == "ok":
            ok += 1
            if tid > max_ok_id:
                max_ok_id = tid
        else:
            skipped += 1 if status in ("no_encontrado", "sin_nombre", "sin_imagenes",
                                        "precio_alto", "marca_omitida", "sin_descripcion") else 0
            errores += 1 if status == "error" else 0

        if i % 5 == 0 or i == total:
            print(f"  [{i}/{total}] OK={ok} skip={skipped} err={errores}")

    if ok > 0:
        save_last_scraped_id(max_ok_id)
    else:
        print("\n  [STATE] No se guardo estado nuevo (0 productos OK)")

    print(f"\n[DONE] Resumen: {ok} OK, {skipped} skip, {errores} errores")


# ─── MAIN ──────────────────────────────────────────────────────────────────

def main():
    global VERBOSE
    if "--verbose" in sys.argv:
        VERBOSE = True

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
            result = process_product(tid)
            print(f"\nResultado: {result}")
        else:
            print("[ERR] Especifica un ID: --product 24784")

    elif "--backfill" in sys.argv:
        # Rango especifico: --backfill 24877 24942
        idx = sys.argv.index("--backfill")
        if idx + 2 < len(sys.argv):
            start_id = int(sys.argv[idx + 1])
            end_id = int(sys.argv[idx + 2])
            print(f"\n[BACKFILL] Procesando {start_id} -> {end_id}")
            for tid in range(start_id, end_id + 1):
                if tid > start_id:
                    time.sleep(REQUEST_DELAY)
                process_product(tid)
            print(f"\n[BACKFILL] Completo: {start_id} -> {end_id}")
        else:
            print("[ERR] Especifica: --backfill INICIO FIN")

    else:
        scrape_new_products()


if __name__ == "__main__":
    main()
