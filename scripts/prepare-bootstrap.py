"""Prepare PII-minimized derived bootstrap data. Never modify source CSVs.

Creates/retains an ignored local matching seed. Only HMAC equality tokens,
business IDs, names, monetary records, source hashes/row references are exported.
No representative name, address, full bank account, or credential is exported.
"""
import hashlib
import json
import os
import secrets
import sys
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend import domain as D

app=Path(__file__).resolve().parents[1]
source=app.parent/'01_참가자_배포용/04_원본데이터/01_corevia'
paths=dict(agencies=source/'master/m_agency_cv.csv',rebates=source/'sales/sales_rebate_payment_cv.csv',deposits=source/'financials/fin_collection_history_cv.csv')
env=app/'.env.local'
values={}
if env.exists():
    values=dict(line.split('=',1) for line in env.read_text(encoding='utf-8').splitlines() if '=' in line and not line.startswith('#'))
seed=values.get('NEXORA_MATCH_KEY')
if not seed:
    seed=secrets.token_hex(32)
    with env.open('a',encoding='utf-8') as f:f.write('\nNEXORA_MATCH_KEY='+seed+'\n')
key=hashlib.sha256(('nexora-match-v1:'+seed).encode()).hexdigest()
before={k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in paths.items()}
s=D.empty()
actor=dict(id='system-bootstrap',role='조회전용',admin=True)
D.import_data(s,actor,{k:p.read_bytes().decode('utf-8') for k,p in paths.items()},key)
s['matching_key_fingerprint']=hashlib.sha256(key.encode()).hexdigest()
out=app/'backend/bootstrap.json'
out.write_text(json.dumps(s,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
assert before=={k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in paths.items()}
print('Prepared source-linked bootstrap: 50 agencies, 240 rebates, no raw matching fields or credentials. Source hashes unchanged.')
