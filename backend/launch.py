"""Supervise Node and private FastAPI as one AXHub container process."""
import hashlib
import os
import secrets
import signal
import subprocess
import sys
import time

env=dict(os.environ)
env['NEXORA_INTERNAL_SECRET']=secrets.token_hex(32)
seed=env.get('NEXORA_MATCH_KEY') or env.get('W07_IMPORT_TOKEN')
if not seed:
    sys.exit('NEXORA_MATCH_KEY or W07_IMPORT_TOKEN is required')
env['NEXORA_MATCH_KEY']=hashlib.sha256(('nexora-match-v1:'+seed).encode()).hexdigest()
env['NEXORA_BOOTSTRAP']='1'
children=[]
def stop(*args):
    for child in children:
        if child.poll() is None:child.terminate()
    for child in children:
        try:child.wait(timeout=8)
        except subprocess.TimeoutExpired:child.kill()
signal.signal(signal.SIGTERM,stop)
signal.signal(signal.SIGINT,stop)
try:
    children.append(subprocess.Popen([sys.executable,'-m','uvicorn','backend.main:app','--host','127.0.0.1','--port','8000','--no-access-log'],env=env))
    children.append(subprocess.Popen(['node','server.js'],env=env))
    while all(c.poll() is None for c in children):time.sleep(0.5)
finally:stop()
sys.exit(1)
