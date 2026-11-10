"""Fail closed before commit; print filenames/counts only, never secret values."""
import re
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git',*args],cwd=root).decode('utf-8')
staged=git('diff','--cached','--name-only','--diff-filter=ACMR').splitlines()
tracked=git('ls-files').splitlines()
forbidden=lambda p:any(part in ['.claude','.codex','.agents','.axhub','__pycache__'] for part in Path(p).parts) or (Path(p).name.startswith('.env') and Path(p).name!='.env.example') or p.endswith('.pyc')
bad=[p for p in set(tracked+staged) if forbidden(p)]
secrets=[]
for name in ['.env','.env.local']:
    p=root/name
    if p.exists():
        for line in p.read_text(encoding='utf-8').splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k,v=line.split('=',1)
                if any(s in k.upper() for s in ['KEY','TOKEN','SECRET','PASSWORD']) and len(v.strip())>=16:
                    secrets.append(v.strip().strip('"').strip("'"))
for p in staged:
    content=git('show',':'+p)
    if any(v in content for v in secrets) or re.search(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b',content):
        bad.append(p)
if bad:
    print('BLOCKED: unsafe tracked/staged files:',', '.join(sorted(set(bad))))
    raise SystemExit(1)
print(f'Secret and protected-path check passed: {len(staged)} staged files; no local secret value or protected directory tracked.')
