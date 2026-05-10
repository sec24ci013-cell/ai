"""OCR Service — pytesseract for images, PyMuPDF for PDFs. Runs locally."""
import fitz  # PyMuPDF


def extract_text_from_image(image_path: str) -> str:
    """Extract text from image using pytesseract. Falls back gracefully."""
    try:
        import pytesseract
        from PIL import Image
        return pytesseract.image_to_string(Image.open(image_path))
    except ImportError:
        print("[OCR] pytesseract not installed. Attempting PIL-based metadata extraction.")
        try:
            from PIL import Image
            img = Image.open(image_path)
            return f"[Image: {img.format} {img.size[0]}x{img.size[1]}px — OCR unavailable, install pytesseract]"
        except Exception:
            return f"[Image file detected but OCR is unavailable: {image_path.split('/')[-1]}]"
    except Exception as e:
        print(f"[OCR Error] {e}")
        return f"[OCR failed for image: {image_path.split('/')[-1]}]"


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text


def extract_text(file_path: str, file_type: str) -> str:
    file_type = file_type.lower().strip(".")
    if file_type in ["jpg", "jpeg", "png", "bmp", "tiff", "webp"]:
        return extract_text_from_image(file_path)
    elif file_type in ["pdf"]:
        return extract_text_from_pdf(file_path)
    return ""

