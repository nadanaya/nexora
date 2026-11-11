"""HTTP verification through the isolated local Next/FastAPI demo gateway."""
import json
from pathlib import Path
import httpx

base='http://127.0.0.1:3107/api/engine/'
out=Path(__file__).resolve().parents[1]/'submission/evidence/guided-api.json'

def request(path,body=None):
    r=httpx.get(base+path,timeout=60) if body is None else httpx.post(base+path,json=body,timeout=60)
    r.raise_for_status()
    return r.json()

before=request('workspace')
evidence=dict(scope='isolated_local_http_gateway',source_kind='synthetic',external_ai='not_called_deterministic_explanation',runs={})
for scenario,length,state in [('A',6,'SIMULATED_PAID'),('B',8,'APPROVED'),('C',6,'REJECTED')]:
    run=request('demo/start',dict(scenario=scenario))['run_id']
    for step in range(length):snapshot=request(f'demo/{run}/step',dict(expected_step=step))
    active=[c for c in snapshot['cases'] if c['state']!='SUPERSEDED']
    assert active[0]['state']==state
    restored=request(f'demo/{run}/workspace')
    assert restored['scenario']['step']==length
    evidence['runs'][scenario]=dict(run_id=run,passed=True,snapshot=restored)
after=request('workspace')
assert before==after,'Live workspace changed during isolated guided runs'
evidence['operating_workspace_unchanged']=True
out.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Guided A/B/C passed via HTTP; operating workspace unchanged. Evidence: submission/evidence/guided-api.json')
