import os
import uuid


def _detect_format(content: bytes) -> str | None:
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return ".webp"
    return None


def is_valid_image(content: bytes, filename: str) -> bool:
    detected = _detect_format(content)
    if detected is None:
        return False
    ext = os.path.splitext(filename)[1].lower()
    if detected == ".jpg" and ext in (".jpg", ".jpeg"):
        return True
    return ext == detected


def save_upload(content: bytes, original_filename: str, upload_dir: str) -> str:
    """Save file with UUID name and return public path (`/uploads/<uuid>.<ext>`)."""
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(original_filename)[1].lower()
    # Normalize jpg/jpeg
    if ext == ".jpeg":
        ext = ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(upload_dir, name)
    with open(path, "wb") as f:
        f.write(content)
    return f"/uploads/{name}"
