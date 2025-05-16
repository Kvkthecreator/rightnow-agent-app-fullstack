# agent_entrypoints.py
from fastapi import Request
from agents import Runner
from .util.webhook import send_webhook
import json

async def run_agent(req: Request):
    data = await req.json()
    ...
    return { ... }

async def run_agent_direct(req: Request):
    data = await req.json()
    ...
    return { ... }
