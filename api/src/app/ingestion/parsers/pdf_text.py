import fitz  # PyMuPDF

def extract_pdf_text(path_or_bytes) -> str:
    doc = fitz.open(stream=path_or_bytes, filetype="pdf") if isinstance(path_or_bytes, (bytes, bytearray)) else fitz.open(path_or_bytes)
    parts = []
    for page in doc:
        t = page.get_text("text")
        if t:
            parts.append(t)
    return "\n\n".join(parts).strip()