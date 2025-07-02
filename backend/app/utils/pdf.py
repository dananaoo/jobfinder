import fitz  # PyMuPDF
from fastapi import UploadFile

async def extract_text_from_pdf(file: UploadFile) -> str:
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text 