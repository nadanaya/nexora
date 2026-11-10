"""PostgreSQL transaction boundary; tenant-wide lock also serializes graph changes.

Small W07 dataset: keep versioned workflow aggregate in JSONB rather than duplicate
rules across dozens of tables. Audit and successful item uniqueness are relational.
No SQLite or disk persistence fallback is permitted.
"""
import os
from contextlib import contextmanager
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb

from .domain import empty


def connection():
    return psycopg.connect(os.environ['DATABASE_URL'], connect_timeout=8, prepare_threshold=None)


def migrate():
    with connection() as conn:
        conn.execute(Path(__file__).with_name('migrations').joinpath('001_engine.sql').read_text(encoding='utf-8'))


@contextmanager
def transaction(tenant, write=False):
    with connection() as conn:
        conn.execute('INSERT INTO nx_state(tenant,payload) VALUES(%s,%s) ON CONFLICT DO NOTHING', (tenant,Jsonb(empty())))
        row=conn.execute('SELECT payload FROM nx_state WHERE tenant=%s FOR UPDATE', (tenant,)).fetchone()
        state=row[0]
        old_events=len(state['events'])
        old_receipts={p['receipt_id'] for p in state['payments'].values()}
        yield state
        if write:
            state['version']+=1
            for e in state['events'][old_events:]:
                conn.execute('INSERT INTO nx_audit(tenant,sequence,event_id,event) VALUES(%s,%s,%s,%s)',
                             (tenant,e['sequence'],e['id'],Jsonb(e)))
            for p in state['payments'].values():
                if p['receipt_id'] not in old_receipts:
                    for item in p['items']:
                        conn.execute('INSERT INTO nx_payment_items(tenant,rebate_id,receipt_id) VALUES(%s,%s,%s)',(tenant,item,p['receipt_id']))
            conn.execute('UPDATE nx_state SET payload=%s,version=%s,updated_at=now() WHERE tenant=%s',
                         (Jsonb(state),state['version'],tenant))
