from src.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_different_each_time() -> None:
    h1 = hash_password("mypass")
    h2 = hash_password("mypass")
    assert h1 != h2  # bcrypt uses salt


def test_verify_password_correct() -> None:
    h = hash_password("mypass")
    assert verify_password("mypass", h) is True


def test_verify_password_wrong() -> None:
    h = hash_password("mypass")
    assert verify_password("wrong", h) is False


def test_jwt_round_trip() -> None:
    token = create_access_token({"sub": "1", "email": "a@b.com"})
    payload = decode_access_token(token)
    assert payload["sub"] == "1"
    assert payload["email"] == "a@b.com"


def test_jwt_invalid_returns_none() -> None:
    assert decode_access_token("not.a.token") is None
