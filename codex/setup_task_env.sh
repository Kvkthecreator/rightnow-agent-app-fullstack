cd api
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r src/requirements.codex.txt
export PYTHONPATH=src
cd ..
