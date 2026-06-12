"""
auto_scraper.py — Scraper automático para tsoto.net
====================================================
Extrae productos, descripciones limpias, GTIN, traduce a español
y guarda en Firebase.

Uso:
  python auto_scraper.py                  # Scrapea productos nuevos
  python auto_scraper.py --backfill-all    # Backfill descripciones + GTIN para todos
  python auto_scraper.py --product 24784   # Un producto específico
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

# ─── FIREBASE INIT ─────────────────────────────────────────────────────────

def init_firebase():
    cred_path = SERVICE_ACCOUNT_PATH
    if not os.path.exists(cred_path):
        # Buscar en ubicaciones alternativas
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
            print(f"❌ No se encontró serviceAccountKey.json en {cred_path} ni alternativas")
            sys.exit(1)

    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})
    return firestore.client()


db = init_firebase()

# ─── EXTRACCIÓN DE DESCRIPCIÓN ─────────────────────────────────────────────

def extract_description_clean(soup):
    """
    Del panel de descripción de tsoto.net, extrae SOLO el texto descriptivo:
    - Elimina div.MVO (datos técnicos)
    - Elimina div.important-blue / div.important (warnings)
    - Elimina span.b (límites de compra: "Max. bestellbare")
    - Convierte <br/> a \n
    - Filtra líneas no deseadas (pro Anschrift, Haushalt, bestellbare, 3x)
    """
    anker = soup.find("a", id="Description")
    if not anker:
        return ""

    for sib in anker.find_next_siblings():
        if sib.name == "div" and "panel" in (sib.get("class") or []):
            pc = sib.find("div", class_="PanelContent")
            if not pc:
                continue

            # Copia para no mutar el original
            c = copy.copy(pc)

            # Eliminar MVO (datos técnicos)
            for x in c.find_all("div", class_="MVO"):
                x.decompose()

            # Eliminar warnings
            for x in c.find_all("div", class_=["important-blue", "important"]):
                x.decompose()

            # Eliminar span.b (límites de compra)
            for x in c.find_all("span", class_="b"):
                x.decompose()

            # Convertir <br/> a \n
            for br in c.find_all("br"):
                br.replace_with("\n")

            texto = c.get_text()

            # Normalizar múltiples saltos de línea
            texto = re.sub(r"\n{3,}", "\n\n", texto)

            # Filtrar líneas que sean solo avisos de tsoto
            skip_patterns = [
                "pro Anschrift", "Haushalt", "bestellbare", "Max\\.", "3x",
            ]
            lines = texto.split("\n")
            clean_lines = []
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue
                # Saltar líneas que coinciden con patrones de exclusión
                if any(re.search(p, stripped, re.IGNORECASE) for p in skip_patterns):
                    continue
                clean_lines.append(stripped)

            return "\n".join(clean_lines).strip()

    return ""


def extract_gtin(soup):
    """
    Extrae el GTIN/EAN del MVO (datos técnicos) en la página de tsoto.
    """
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
                    # Buscar número de 8-14 dígitos (GTIN/EAN)
                    m = re.search(r"\b(\d{8,14})\b", texto)
                    if m:
                        return m.group(1)
    return ""


def normalize_dashes(text: str) -> str:
    """
    Normaliza guiones al inicio de línea: '-Shiroko' → '- Shiroko'
    """
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
        print(f"  ⚠️ Error traduciendo: {e}")
        return text


# ─── SCRAPING ──────────────────────────────────────────────────────────────

def get_product_page(tsoto_id: int) -> BeautifulSoup | None:
    """Obtiene el HTML de una página de producto de tsoto.net."""
    url = f"https://www.tsoto.net/Shop/{tsoto_id}-test"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  ❌ Error HTTP {tsoto_id}: {e}")
        return None


def process_product(tsoto_id: int, save: bool = True) -> dict:
    """
    Procesa un producto: scrapea, extrae descripción, GTIN, traduce.
    Retorna dict con los resultados.
    """
    print(f"\n🔍 Procesando {tsoto_id}...", end=" ")

    soup = get_product_page(tsoto_id)
    if not soup:
        return {"tsotoId": tsoto_id, "status": "error", "error": "HTTP falló"}

    # Extraer descripción limpia
    desc_original = extract_description_clean(soup)
    if not desc_original:
        print("❌ Sin descripción")
        return {"tsotoId": tsoto_id, "status": "sin_descripcion"}

    print(f"✅ ({len(desc_original)} chars)", end=" ")

    # Extraer GTIN
    gtin = extract_gtin(soup)

    # Traducir
    desc_es = translate_to_es(desc_original)
    print(f"→ ES ({len(desc_es)} chars)", end=" ")

    result = {
        "tsotoId": tsoto_id,
        "status": "ok",
        "description": desc_original,
        "description_es": desc_es,
        "gtin": gtin,
    }

    # Guardar en Firebase
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
        print(f"(⚠️ no encontrado en Firestore)")
        return

    doc_id = docs[0].id
    update_data = {
        "description": description,
        "description_es": description_es,
    }
    if gtin:
        update_data["gtin"] = gtin

    db.collection("products").document(doc_id).update(update_data)
    print(f"💾 {doc_id[:8]}...")


# ─── BATCH ─────────────────────────────────────────────────────────────────

def get_all_tsoto_ids() -> list[int]:
    """Obtiene todos los tsotoId de Firestore."""
    docs = list(
        db.collection("products")
        .where("tsotoId", ">=", 0)
        .stream()
    )
    ids = []
    for doc in docs:
        d = doc.to_dict()
        tid = d.get("tsotoId")
        if tid:
            ids.append(int(tid))
    return sorted(set(ids), reverse=True)


def get_pending_ids() -> list[int]:
    """Obtiene IDs que aún no tienen description_es."""
    docs = list(
        db.collection("products")
        .where("tsotoId", ">=", 0)
        .stream()
    )
    pending = []
    for doc in docs:
        d = doc.to_dict()
        tid = d.get("tsotoId")
        if tid and not d.get("description_es"):
            pending.append(int(tid))
    return sorted(set(pending), reverse=True)


def backfill_all():
    """Procesa todos los productos que faltan por descripción + GTIN."""
    pending = get_pending_ids()
    total = len(pending)
    print(f"\n📦 {total} productos pendientes\n")

    ok = 0
    sin_desc = 0
    errores = 0

    for i, tid in enumerate(pending, 1):
        result = process_product(tid)
        if result["status"] == "ok":
            ok += 1
        elif result["status"] == "sin_descripcion":
            sin_desc += 1
        else:
            errores += 1

        print(f"  [{i}/{total}]")
        time.sleep(REQUEST_DELAY)

    print(f"\n✅ Resumen: {ok} OK, {sin_desc} sin descripción, {errores} errores")


# ─── MAIN ──────────────────────────────────────────────────────────────────

def main():
    if "--backfill-all" in sys.argv:
        backfill_all()
    elif "--product" in sys.argv:
        idx = sys.argv.index("--product")
        if idx + 1 < len(sys.argv):
            tid = int(sys.argv[idx + 1])
            process_product(tid, save=True)
        else:
            print("❌ Especifica un ID: --product 24784")
    else:
        # Modo normal: procesar solo productos nuevos sin descripción
        backfill_all()


if __name__ == "__main__":
    main()
