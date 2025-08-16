#!/bin/bash

# Optional: Uncomment if you want to run backend too
# echo "Starting backend..."
# cd ./api
# source $(poetry env info --path)/bin/activate
# export PYTHONPATH=src
# uvicorn app.agent_server:app --reload &

# Start frontend
cd ./web
npx next dev
