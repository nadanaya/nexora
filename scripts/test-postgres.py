"""Run integration tests in an isolated, temporary local PostgreSQL cluster.

Requires PostgreSQL binaries. Does not touch any existing server or database.
The temporary cluster is stopped in finally and left in the OS temp directory.
"""
import os
import socket
import subprocess
import sys
import tempfile
import json
import hashlib
from datetime import datetime,timezone
import xml.etree.ElementTree as ET
from pathlib import Path

root=Path(__file__).resolve().parents[1]
evidence=root/'submission/evidence'
evidence.mkdir(parents=True,exist_ok=True)
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
report=evidence/f'tests-{stamp}.xml'
binary=Path(os.environ.get('PG_BIN','C:/Program Files/PostgreSQL/18/bin'))
cluster=Path(tempfile.mkdtemp(prefix='nexora-pg-test-'))
with socket.socket() as sock:
    sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
flags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0
def run(args,**kw):
    return subprocess.run([str(x) for x in args],creationflags=flags,check=True,**kw)
run([binary/'initdb', '-D', cluster/'data', '-U','postgres','-A','trust','--encoding=UTF8','--no-locale'],stdout=subprocess.DEVNULL)
try:
    run([binary/'pg_ctl','-D',cluster/'data','-l',cluster/'server.log','-o',f'-h 127.0.0.1 -p {port}','-w','start'],stdout=subprocess.DEVNULL)
    env=dict(os.environ,DATABASE_URL=f'postgresql://postgres@127.0.0.1:{port}/postgres',PYTHONIOENCODING='utf-8',PYTHONDONTWRITEBYTECODE='1')
    result=subprocess.run([sys.executable,'-m','pytest','backend/tests','-q','-ra','-p','no:cacheprovider',f'--junitxml={report}'],cwd=root,env=env,creationflags=flags,capture_output=True,encoding='utf-8',errors='replace')
    print(result.stdout)
    print(result.stderr)
    (evidence/f'tests-{stamp}.log').write_text(result.stdout+'\n'+result.stderr,encoding='utf-8')
    if report.exists():
        suites=ET.parse(report).getroot()
        summary=dict(at=stamp,exit_code=result.returncode,source_kind='test_execution',environment='isolated_postgresql',
            tests=[dict(name=t.attrib['name'],status='failed' if t.find('failure') is not None else 'skipped' if t.find('skipped') is not None else 'error' if t.find('error') is not None else 'passed') for t in suites.iter('testcase')],
            source_hashes={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'backend').rglob('*.py')})
        (evidence/'tests-latest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
finally:
    run([binary/'pg_ctl','-D',cluster/'data','-m','fast','-w','stop'],stdout=subprocess.DEVNULL)
sys.exit(result.returncode)
