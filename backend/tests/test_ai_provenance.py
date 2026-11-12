"""Isolated adapter tests. Mock HTTP success is NOT actual Gemini-call evidence."""
import json
import httpx
import pytest
from backend import analysis as AI, domain as D
from backend.tests.test_engine import state, SUPPORT
from backend.tests.test_submission import model_output


@pytest.fixture
def isolated_settings(monkeypatch):
    for key in ['LLM_API_KEY','LLM_BASE_URL','LLM_MODEL','GEMINI_API_KEY','GEMINI_MODEL']:
        monkeypatch.delenv(key,raising=False)
    return monkeypatch


def test_configured_key_does_not_assert_success(isolated_settings):
    m=isolated_settings
    assert not AI.configuration()['configured']
    m.setenv('GEMINI_API_KEY','synthetic-test-key')
    config=AI.configuration()
    assert config['configured'] and not config['connection_verified']
    assert config['provider']=='gemini'
    m.setenv('LLM_MODEL','existing-provider-model')
    assert not AI.configuration()['configured']  # Never mix partial existing config with Gemini.


def test_missing_key_cannot_generate_completion(isolated_settings):
    with pytest.raises(D.RuleError) as error:
        AI.generate({})
    assert error.value.code=='AI_NOT_CONFIGURED'


@pytest.mark.parametrize('failure',['timeout','shape','evidence'])
def test_provider_failure_never_returns_success(isolated_settings,failure):
    m=isolated_settings;m.setenv('GEMINI_API_KEY','synthetic-test-key')
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06');before=D.digest(s)
    def post(*args,**kwargs):
        if failure=='timeout': raise httpx.ReadTimeout('test')
        output={} if failure=='shape' else model_output()
        if failure=='evidence': output['facts'][0]['evidence_refs']=['invented']
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(output)}}]},request=httpx.Request('POST',args[0]))
    m.setattr(httpx,'post',post)
    with pytest.raises(D.RuleError): AI.generate(AI.prepare(s,c))
    assert before==D.digest(s)


def test_mock_gemini_provenance_and_real_rule_snapshot(isolated_settings):
    m=isolated_settings;m.setenv('GEMINI_API_KEY','synthetic-test-key')
    s=state();c=D.create_case(s,SUPPORT,'A','2026-06');before=D.digest(s)
    def post(url,**kwargs):
        assert url=='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
        assert kwargs['json']['model']=='gemini-3.8-flash'
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(model_output())}}],
            'usage':{'prompt_tokens':120,'completion_tokens':40,'total_tokens':160}},request=httpx.Request('POST',url))
    m.setattr(httpx,'post',post)
    result=AI.generate(AI.prepare(s,c))
    assert result['execution']['provider']=='gemini' and result['execution']['provider_called']
    assert result['execution']['usage']['total_tokens']==160
    assert result['rule_result']['group_month_exposure_krw']==2400000
    assert before==D.digest(s)


@pytest.mark.parametrize('amount,executive',[(2000000,False),(2000001,True)])
def test_original_threshold_is_strictly_greater(amount,executive):
    s=state();s['rebates']['R4']['amount']=amount
    c=D.create_case(s,SUPPORT,'Z','2026-06')
    assert D.context(s,c)['executive'] is executive
