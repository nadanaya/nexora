"""Disposable, loopback-only submission demo. Never starts against the live DB.

Gateway impersonation exists ONLY in this development script and uses synthetic
users. It is not a production endpoint and does not prove real human approvals.
"""
import base64
import atexit
import http.client
import json
import os
import signal
import socket
import subprocess
import sys
import tempfile
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path

root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root))
os.environ['PYTHONDONTWRITEBYTECODE']='1'
import psycopg
from backend import domain as D
from backend.store import migrate,transaction,connection

def port():
    with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]

pg_port,node_port,api_port=port(),port(),port()
gateway_port=int(os.environ.get('NEXORA_DEMO_PORT','3107'))
tenant='nexora-submission-demo'
key='synthetic-demo-matching-key-never-production'
secret='synthetic-demo-signing-key-never-production-0000'
actors={'draft':('기안 담당자','영업지원팀'),'support':('승인 담당자','영업지원팀'),'sales':('영업 소명 담당자','영업팀'),'executive':('영업임원','영업임원'),'finance':('재무 담당자','재무팀')}
actors.update(viewer=('조회 담당자','조회전용'),admin=('검증 관리자','조회전용'))
pg=Path(os.environ.get('PG_BIN','C:/Program Files/PostgreSQL/18/bin'))
resume=len(sys.argv)>2 and sys.argv[1]=='--resume'
cluster=Path(sys.argv[2]).resolve() if resume else Path(tempfile.mkdtemp(prefix='nexora-submission-demo-'))
if resume:
    assert cluster.name.startswith('nexora-submission-demo-') and Path(tempfile.gettempdir()).resolve() in cluster.parents and (cluster/'data/PG_VERSION').exists(), 'Only an existing isolated demo cluster can be resumed'
flags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0
def command(args):
    result=subprocess.run([str(x) for x in args],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=flags)
    if result.returncode:raise RuntimeError('Local test process failed: '+Path(str(args[0])).name)
if not resume:command([pg/'initdb','-D',cluster/'data','-U','postgres','-A','trust','--encoding=UTF8','--no-locale'])
if resume and subprocess.run([str(pg/'pg_ctl'),'-D',str(cluster/'data'),'status'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=flags).returncode==0:
    pg_port=int((cluster/'data/postmaster.pid').read_text().splitlines()[3])
else:
    command([pg/'pg_ctl','-D',cluster/'data','-l',cluster/'pg.log','-o',f'-h 127.0.0.1 -p {pg_port}','-w','start'])
children=[]
logs=[]
closed=False
def cleanup():
    global closed
    if closed:return
    closed=True
    for child in children:
        if child.poll() is None:child.terminate()
        try:child.wait(timeout=8)
        except subprocess.TimeoutExpired:child.kill()
    for log in logs:log.close()
    command([pg/'pg_ctl','-D',cluster/'data','-m','fast','-w','stop'])
atexit.register(cleanup)
env=dict(os.environ,DATABASE_URL=f'postgresql://postgres@127.0.0.1:{pg_port}/postgres',NEXORA_INTERNAL_SECRET=secret,NEXORA_MATCH_KEY=key,NEXORA_BOOTSTRAP='0',APPHUB_TENANT=tenant,PYTHONDONTWRITEBYTECODE='1',PORT=str(node_port),NEXORA_API_PORT=str(api_port))
os.environ.update(env)
migrate()

def fixture():
    if os.environ.get('NEXORA_DEMO_W07') == '1':
        source=root.parent/'01_참가자_배포용/04_원본데이터/01_corevia'
        return {k:p.read_text(encoding='utf-8') for k,p in dict(agencies=source/'master/m_agency_cv.csv',rebates=source/'sales/sales_rebate_payment_cv.csv',deposits=source/'financials/fin_collection_history_cv.csv').items()}
    agencies=['agency_id|agency_name|representative_name|address|bank_account_no|rebate_eligible']
    rebates=['rebate_id|agency_id|period_ym|rebate_amount_krw|approval_status|approver|payment_date']
    deposits=['deposit_id|agency_id|deposit_date|amount_krw|bank_account_no']
    for prefix in ['API','WEB']:
        for code,amount,rep,address,account in [('N1',2000000,'normal','normal','normal'),('C1',900000,'related','address1','account1'),('C2',800000,'related','address1','account2'),('C3',700000,'related','address2','account1'),('H1',900000,'hold','hold','hold')]:
            id=prefix+'-'+code
            agencies.append(f'{id}|합성 거래처 {id}|{prefix}-{rep}|{prefix}-{address}|{prefix}-{account}|True')
            rebates.append(f'REB-{id}|{id}|2026-06|{amount}|미지급|NONE|NONE')
        deposits.append(f'DEP-{prefix}|{prefix}-C2|2026-06-01|100|합성 다른 입금계좌')
    return dict(agencies='\n'.join(agencies)+'\n',rebates='\n'.join(rebates)+'\n',deposits='\n'.join(deposits)+'\n')

with transaction(tenant,True) as state:
    if not state['agencies']:
        admin=dict(id='demo-system',role='조회전용',admin=True)
        D.import_data(state,admin,fixture(),key)
        state['scenario']=dict(label='제출 전 로컬 합성 시연',source_kind='synthetic')
        for f in state['files']:f['source_kind']='synthetic'
        for table in ['agencies','rebates']:
            for row in state[table].values():row['source_kind']='synthetic'
        for actor,(name,role) in actors.items():
            state['members']['demo-'+actor]=dict(role=role)
            D.event(state,admin,'ROLE_ASSIGNED','demo-'+actor,dict(role=role,source_kind='synthetic'))
    else:
        assert state.get('scenario',{}).get('source_kind')=='synthetic', 'Only synthetic demo state can be resumed'

evidence=root/'submission/evidence'
evidence.mkdir(parents=True,exist_ok=True)
traffic=[]
fault_once=False
for name,args in [('api',[sys.executable,'-m','uvicorn','backend.main:app','--host','127.0.0.1','--port',str(api_port),'--no-access-log']),('web',['node','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',str(node_port)])]:
    log=(cluster/(name+'.log')).open('wb');logs.append(log)
    children.append(subprocess.Popen(args,cwd=root,env=env,stdout=log,stderr=log,creationflags=flags))

class Gateway(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def send_json(self,value,status=200):
        data=json.dumps(value,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    def do_GET(self):self.handle_request()
    def do_POST(self):self.handle_request()
    def handle_request(self):
        global fault_once
        expected=f'127.0.0.1:{gateway_port}'
        if self.headers.get('Host')!=expected or self.headers.get('Origin',f'http://{expected}')!=f'http://{expected}':return self.send_json({'error':'Local demo origin required'},403)
        if self.path=='/__demo/control':
            html='<h1>ISOLATED E2E CONTROL</h1>'+''.join(f'<p><a href="/__demo/actor/{a}">{a}</a></p>' for a in actors)+'<a href="/__demo/fault-once">Next workspace request returns 503</a><p><a href="/workspace/approvals?scope=live">Open isolated workspace</a></p>'
            data=html.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data);return
        if self.path=='/__demo/fault-once':
            fault_once=True
            return self.send_json({'armed':'next workspace request only','scope':'isolated_loopback'})
        if fault_once and self.path=='/api/engine/workspace':
            fault_once=False
            traffic.append(dict(at=D.now(),method=self.command,path=self.path,actor='isolated_fault',status=503,expected=True))
            return self.send_json({'error':'격리 E2E: 일시적인 API 오류','code':'E2E_EXPECTED_FAILURE'},503)
        if self.path.startswith('/__demo/actor/'):
            actor=self.path.rsplit('/',1)[-1]
            if actor not in actors:return self.send_json({'error':'Unknown synthetic actor'},404)
            self.send_response(303);self.send_header('Set-Cookie',f'demo_actor={actor}; HttpOnly; SameSite=Strict; Path=/');self.send_header('Location','/');self.end_headers();return
        if self.path=='/__demo/evidence':
            with transaction(tenant) as s:
                view=D.public_state(s,dict(id='demo-audit',role='조회전용',admin=False))
            with connection() as conn:
                counts={table:conn.execute(f'SELECT count(*) FROM {table} WHERE tenant=%s',(tenant,)).fetchone()[0] for table in ['nx_audit','nx_payment_items']}
            output=dict(source_kind='synthetic',scope='isolated_loopback_demo',external_ai=AI_status(),cases=view['cases'],tasks=view['tasks'],payments=view['payments'],events=view['events'],db_counts=counts,traffic=traffic)
            (evidence/'browser-api-snapshot.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
            return self.send_json(output)
        if self.path=='/__demo/stop' and self.command=='POST':
            self.send_json({'stopping':'isolated_synthetic_demo'})
            import threading
            threading.Thread(target=server.shutdown,daemon=True).start()
            return
        cookie=SimpleCookie(self.headers.get('Cookie',''))
        actor=cookie['demo_actor'].value if 'demo_actor' in cookie else 'draft'
        if actor not in actors:actor='draft'
        name,role=actors[actor]
        headers={k:v for k,v in self.headers.items() if k.lower() not in ['connection','content-length','cookie'] and not k.lower().startswith('x-axhub-')}
        headers.update({'X-AxHub-User-Id':'demo-'+actor,'X-AxHub-User-Name':base64.b64encode(('합성 '+name).encode()).decode(),'X-AxHub-Tenant-Slug':tenant,'X-AxHub-App-Role':'app_admin' if actor=='admin' else 'app_member','X-AxHub-Is-Admin':'true' if actor=='admin' else 'false'})
        size=int(self.headers.get('Content-Length','0'));body=self.rfile.read(size) if size else None
        conn=http.client.HTTPConnection('127.0.0.1',node_port,timeout=60)
        try:
            conn.request(self.command,self.path,body=body,headers=headers);response=conn.getresponse();data=response.read()
            self.send_response(response.status)
            for k,v in response.getheaders():
                if k.lower() not in ['connection','transfer-encoding','content-length']:self.send_header(k,v)
            self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
            if self.path.startswith('/api/engine/'):
                traffic.append(dict(at=D.now(),method=self.command,path=self.path,actor='demo-'+actor,status=response.status))
        except (OSError,http.client.HTTPException):self.send_json({'error':'Local demo is starting'},503)
        finally:conn.close()

def AI_status():
    from backend.analysis import configuration
    return configuration()

server=ThreadingHTTPServer(('127.0.0.1',gateway_port),Gateway)
def shutdown(*args):raise KeyboardInterrupt
signal.signal(signal.SIGTERM,shutdown)
try:
    print(f'ISOLATED_SYNTHETIC_DEMO http://127.0.0.1:{gateway_port}',flush=True)
    server.serve_forever()
except KeyboardInterrupt:pass
finally:
    server.server_close()
    cleanup()
