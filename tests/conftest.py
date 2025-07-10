import httpx
import jwt
import pytest

_orig_init = httpx.Client.__init__


def _patched_init(self, *args, **kwargs):
    kwargs.pop("app", None)
    return _orig_init(self, *args, **kwargs)


httpx.Client.__init__ = _patched_init

WORKSPACE_A_JWT = jwt.encode({"sub": "user_a"}, "secret", algorithm="HS256")
WORKSPACE_B_JWT = jwt.encode({"sub": "user_b"}, "secret", algorithm="HS256")


@pytest.fixture
def workspace_a_jwt() -> str:
    return WORKSPACE_A_JWT


@pytest.fixture
def workspace_b_jwt() -> str:
    return WORKSPACE_B_JWT
