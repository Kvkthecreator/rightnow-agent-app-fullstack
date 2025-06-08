import os
import psycopg2
import pytest

@pytest.fixture(scope="session", autouse=True)
def check_db_connection():
    url = os.getenv("DATABASE_URL")
    try:
        conn = psycopg2.connect(url)
        conn.close()
    except Exception as e:
        pytest.skip(f"DB unreachable, skipping backend tests: {e}")
