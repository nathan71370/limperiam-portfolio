from src.services.upload_service import is_valid_image, save_upload

PNG_MAGIC = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
JPEG_MAGIC = b"\xff\xd8\xff" + b"\x00" * 50
WEBP_MAGIC = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 50
FAKE = b"This is not an image" + b"\x00" * 50


def test_is_valid_image_accepts_png() -> None:
    assert is_valid_image(PNG_MAGIC, "image.png") is True


def test_is_valid_image_accepts_jpeg() -> None:
    assert is_valid_image(JPEG_MAGIC, "image.jpg") is True


def test_is_valid_image_accepts_webp() -> None:
    assert is_valid_image(WEBP_MAGIC, "image.webp") is True


def test_is_valid_image_rejects_fake() -> None:
    assert is_valid_image(FAKE, "image.png") is False


def test_is_valid_image_rejects_bad_extension() -> None:
    assert is_valid_image(PNG_MAGIC, "image.exe") is False


def test_save_upload_creates_file_with_uuid_name(tmp_path) -> None:
    relative = save_upload(PNG_MAGIC, "original.png", str(tmp_path))
    assert relative.startswith("/uploads/")
    assert relative.endswith(".png")
    # uuid hex should be 32 chars
    filename = relative.replace("/uploads/", "")
    assert len(filename) == 32 + len(".png")
