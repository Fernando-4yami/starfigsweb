"""
auto_scraper.py — Scraper automático para tsoto.net
====================================================
Busca el último producto agregado en tsoto, compara con el último
scrapeado (guardado en Firestore), y procesa solo los nuevos.

Uso:
  python auto_scraper.py                  # Scrapea productos nuevos
  python auto_scraper.py --product 24784  # Un producto específico
"""

import asyncio
import unicodedata
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore, storage
from datetime import datetime
from dateutil.relativedelta import relativedelta
import re, time, sys, random, os, copy
from deep_translator import GoogleTranslator

# ─── CONFIG ────────────────────────────────────────────────────────────────
SERVICE_ACCOUNT_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT",
    os.path.join(os.path.dirname(__file__), "..", "tsoto_scraper", "secrets", "serviceAccountKey.json"),
)
STORAGE_BUCKET = "starfigs-29d31"
REQUEST_DELAY = 1.5  # segundos entre requests a tsoto.net
TSOTO_BASE = "https://www.tsoto.net"
STATE_DOC_ID = "_scraper_state"  # Documento en Firestore para tracking

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
            print(f"[ERR] No se encontró serviceAccountKey.json en {cred_path} ni alternativas")
            sys.exit(1)

    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})
    return firestore.client()


db = init_firebase()


# ─── TRACKING DEL ÚLTIMO PRODUCTO SCRAPEADO ────────────────────────────────

def get_last_scraped_id() -> int:
    """Obtiene el último tsotoId procesado desde Firestore."""
    doc_ref = db.collection("_meta").document(STATE_DOC_ID)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("lastTsotoId", 0)
    return 0


def save_last_scraped_id(tsoto_id: int):
    """Guarda el último tsotoId procesado en Firestore."""
    doc_ref = db.collection("_meta").document(STATE_DOC_ID)
    doc_ref.set({
        "lastTsotoId": tsoto_id,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    print(f"  [STATE] Último tsotoId guardado: {tsoto_id}")


# ─── ENCONTRAR PRODUCTOS EN TSOTO ────────────────────────────────────────

def get_latest_tsoto_ids() -> list[int]:
    """
    Scrapea la página de últimos productos de tsoto.net y devuelve
    TODOS los IDs de productos visibles, ordenados del más nuevo al más viejo.
    """
    url = f"{TSOTO_BASE}/Shop?order=desc&by=latest"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        links = soup.select('a[href*="/Shop/"]')
        ids = []
        seen = set()
        for a in links:
            href = a.get("href", "")
            m = re.search(r"/Shop/(\d+)", href)
            if m:
                pid = int(m.group(1))
                if pid > 1000 and pid not in seen:
                    seen.add(pid)
                    ids.append(pid)

        ids.sort(reverse=True)
        if not ids:
            print("[ERR] No se encontraron productos en la página de últimos")
            return []

        print(f"[LATEST] {len(ids)} productos visibles, el más nuevo: {ids[0]}")
        return ids
    except Exception as e:
        print(f"[ERR] Error obteniendo página de últimos: {e}")
        return []


# ─── EXTRACCIÓN DE DESCRIPCIÓN ─────────────────────────────────────────────

def extract_description_clean(soup):
    """Extrae la descripción limpia del panel de producto de tsoto.net."""
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
    """Extrae el GTIN/EAN del bloque de datos técnicos (MVO)."""
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


def normalize_dashes(text: str) -> str:
    """Normaliza guiones: '-Shiroko' → '- Shiroko'"""
    lines = text.split("\n")
    normalized = []
    for line in lines:
        if line.startswith("-") and not line.startswith("- "):
            line = "- " + line[1:].lstrip()
        normalized.append(line)
    return "\n".join(normalized)


# ─── TRADUCCIÓN ────────────────────────────────────────────────────────────

def translate_to_es(text: str) -> str:
    """Traduce texto de alemán a español usando Google Translate."""
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


# ─── SCRAPING ──────────────────────────────────────────────────────────────

def get_product_page(tsoto_id: int) -> BeautifulSoup | None:
    """Obtiene el HTML de una página de producto de tsoto.net."""
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
    """
    Procesa un producto: scrapea, extrae descripción, GTIN, traduce.
    Retorna dict con los resultados.
    """
    print(f"\n[PROC] {tsoto_id}...", end=" ")

    soup = get_product_page(tsoto_id)
    if not soup:
        return {"tsotoId": tsoto_id, "status": "error", "error": "HTTP falló"}

    desc_original = extract_description_clean(soup)
    if not desc_original:
        print("[SKIP] Sin descripcion")
        return {"tsotoId": tsoto_id, "status": "sin_descripcion"}

    print(f"[OK] ({len(desc_original)} chars)", end=" ")

    gtin = extract_gtin(soup)

    desc_es = translate_to_es(desc_original)
    print(f"-> ES ({len(desc_es)} chars)", end=" ")

    result = {
        "tsotoId": tsoto_id,
        "status": "ok",
        "description": desc_original,
        "description_es": desc_es,
        "gtin": gtin,
    }

    if save and desc_es:
        save_to_firestore(tsoto_id, desc_original, desc_es, gtin)

    return result


def save_to_firestore(tsoto_id: int, description: str, description_es: str, gtin: str):
    """Guarda description, description_es y gtin en el documento de Firestore."""
    docs = list(
        db.collection("products")
        .where("tsotoId", "==", tsoto_id)
        .limit(1)
        .stream()
    )
    if not docs:
        print(f"(no encontrado en Firestore)")
        return

    doc_id = docs[0].id
    update_data = {
        "description": description,
        "description_es": description_es,
    }
    if gtin:
        update_data["gtin"] = gtin

    db.collection("products").document(doc_id).update(update_data)
    print(f"[SAVE] {doc_id[:8]}...")


# ─── FLUJO PRINCIPAL: SCRAPEAR SOLO PRODUCTOS NUEVOS ────────────────────────

def scrape_new_products():
    """
    Flujo principal:
    1. Obtiene todos los IDs visibles en la página de últimos de tsoto
    2. Filtra solo los que son > último scrapeado
    3. Procesa solo esos (sin range() = sin IDs ficticios)
    4. Guarda el ID más alto que se procesó exitosamente
    """
    last_scraped = get_last_scraped_id()

    if last_scraped == 0:
        print("\n[STATE] No hay estado guardado. Usa --init ULTIMO_ID para establecer el punto de partida.")
        print("  Ejemplo: python auto_scraper.py --init 24942")
        print("  (el ID 24942 es el producto más nuevo en tsoto hoy)")
        return

    print(f"\n[STATE] Último producto scrapeado: {last_scraped}")

    all_ids = get_latest_tsoto_ids()
    if not all_ids:
        print("[ERR] No se pudieron obtener IDs de tsoto")
        return

    # Filtrar solo IDs mayores al último scrapeado (son los nuevos)
    new_ids = sorted([pid for pid in all_ids if pid > last_scraped])

    if not new_ids:
        print(f"\n[DONE] No hay productos nuevos (último visibles: {all_ids[0]}, ya procesado)")
        return

    total = len(new_ids)
    print(f"\n[NEW] {total} producto(s) nuevo(s) para procesar: {new_ids}\n")

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

        print(f"  [{i}/{total}]")

    # Solo guardar estado si al menos uno se procesó bien
    if ok > 0:
        save_last_scraped_id(max_ok_id)
    else:
        print("\n  [STATE] No se guardó estado nuevo (0 productos procesados OK)")

    print(f"\n[DONE] Resumen: {ok} OK, {sin_desc} sin descripcion, {errores} errores")
    if ok > 0:
        print(f"[DONE] Último tsotoId guardado: {max_ok_id}")


# ─── MAIN ──────────────────────────────────────────────────────────────────

def main():
    if "--init" in sys.argv:
        # Inicializar el estado con un ID específico
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
        # Modo normal: solo productos nuevos desde el último scrapeado
        scrape_new_products()


if __name__ == "__main__":
    main()
