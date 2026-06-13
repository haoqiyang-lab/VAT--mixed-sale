import React, { useState, useEffect, useRef } from 'react';

const DEMO_CASES = [
  {
    id: 'A',
    label: '案例A · 钢结构+安装',
    tag: '新旧冲突',
    scenario: '我们厂自己生产钢结构件，与客户签一份总包合同：钢结构件 800 万元，安装服务 200 万元，合同总价 1000 万元。会计按旧办法把安装 200 万拆出来按 9% 申报，货物 800 万按 13%，请问这样对吗？'
  },
  {
    id: 'B',
    label: '案例B · 软件+安装维护',
    tag: '命中列举',
    scenario: '软件企业向客户销售企业管理软件 500 万元，同时合同约定提供软件安装、培训和一年运维服务共 100 万元。财务想把安装运维 100 万按 6% 或 9% 拆分计税，可以吗？'
  },
  {
    id: 'C',
    label: '案例C · 家电+独立装修',
    tag: '兼营可拆',
    scenario: '我们是家电卖场，一方面零售家电产品（13%），另一方面承接与家电销售完全无关的独立家庭装修工程（建筑服务 9%），两块业务分别签合同、分别结算。能分开按两个税率计税吗？家电收入 80 万，装修收入 60 万。'
  },
  {
    id: 'D',
    label: '案例D · 设备+技术服务',
    tag: '主附存疑',
    scenario: '我司与客户签一份合同，销售定制生产设备 450 万元，同时提供配套技术咨询服务 400 万元，两项分别报价但在同一份合同内。高管对税率有分歧，请问按几个税率计税？'
  },
  {
    id: 'E',
    label: '案例E · 外购设备+安装',
    tag: '新旧冲突',
    scenario: '我们是设备代理商，外购发动机 90 万卖给客户，同时提供安装服务 10 万，以前一直整单按 9% 申报。新法实施后这样还对吗？'
  }
];

const TAG_COLORS = {
  '新旧冲突': { bg: '#fff1f0', color: '#cf1322', border: '#ffa39e' },
  '命中列举': { bg: '#e6f7ff', color: '#0958d9', border: '#91caff' },
  '兼营可拆': { bg: '#f6ffed', color: '#389e0d', border: '#b7eb8f' },
  '主附存疑': { bg: '#fffbe6', color: '#d46b08', border: '#ffe58f' }
};

function CountUp({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!value) return;
    const num = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    start.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(ease * num));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span>{display}</span>;
}

function StepIndicator({ steps, active }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          opacity: i <= active ? 1 : 0.3,
          transition: `opacity 0.4s ease ${i * 0.15}s`
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: i <= active ? '#1677ff' : '#d9d9d9',
            color: '#fff', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: `background 0.4s ease ${i * 0.15}s`
          }}>{i + 1}</div>
          <span style={{ fontSize: 11, color: i <= active ? '#1677ff' : '#999' }}>{s}</span>
          {i < steps.length - 1 && <span style={{ color: '#d9d9d9', fontSize: 10 }}>›</span>}
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result, visible }) {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!visible) { setStep(-1); return; }
    const timers = [0, 400, 800, 1200].map((delay, i) =>
      setTimeout(() => setStep(i), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible, result]);

  if (!result) return null;

  const isJiying = result.judgment?.startsWith('兼营') || (result.judgment?.includes('兼营') && !result.judgment?.includes('混合销售'));
  const isMixed = result.judgment?.startsWith('混合销售') || result.conclusion?.includes('不能拆') || result.conclusion?.includes('不可拆');
  const isUncertain = result.judgment?.startsWith('存疑') || (!isJiying && !isMixed);
  const verdictColor = isUncertain ? '#d46b08' : isJiying ? '#389e0d' : '#cf1322';
  const verdictBg = isUncertain ? '#fffbe6' : isJiying ? '#f6ffed' : '#fff1f0';
  const verdictLabel = isUncertain ? '⚠ 存疑' : isJiying ? '✓ 兼营·可拆分' : '✗ 混合销售·不可拆';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 16, marginTop: 24,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease'
    }}>
      {/* 第一栏：判定结论 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, color: '#999', fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>① 判定结论</div>
        <StepIndicator steps={['拆解业务', '比对公告', '判断交易', '形成结论']} active={step} />
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 10,
          background: verdictBg, border: `1.5px solid ${verdictColor}`,
          transition: 'all 0.5s ease 0.5s', opacity: step >= 2 ? 1 : 0
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: verdictColor, marginBottom: 6 }}>
            {verdictLabel}
          </div>
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>{result.conclusion}</div>
        </div>
        <div style={{
          marginTop: 12, fontSize: 12, color: '#666', lineHeight: 1.8,
          opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.4s ease 1s'
        }}>
          <strong>判定：</strong>{result.judgment}
        </div>
        {result.hint && result.hint !== 'null' && (
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 8,
            background: '#fffbe6', border: '1px solid #ffe58f',
            fontSize: 12, color: '#614700', lineHeight: 1.7,
            opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.4s ease 1.2s'
          }}>
            <strong>⚠ 提示：</strong>{result.hint}
          </div>
        )}
      </div>

      {/* 第二栏：税负测算 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, color: '#999', fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>② 税负测算</div>
        {result.taxCalc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div style={{ fontSize: 11, color: '#389e0d', fontWeight: 600, marginBottom: 4 }}>✓ 正确处理</div>
              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>{result.taxCalc.correct}</div>
            </div>
            {result.taxCalc.wrong && result.taxCalc.wrong !== 'null' && (
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#fff1f0', border: '1px solid #ffa39e' }}>
                <div style={{ fontSize: 11, color: '#cf1322', fontWeight: 600, marginBottom: 4 }}>✗ 常见错误</div>
                <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>{result.taxCalc.wrong}</div>
              </div>
            )}
            {result.taxCalc.diff && result.taxCalc.diff !== 'null' && (
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'linear-gradient(135deg, #fff7e6, #fff1f0)',
                border: '1px solid #ffd591'
              }}>
                <div style={{ fontSize: 11, color: '#d46b08', fontWeight: 600, marginBottom: 4 }}>💰 税负差额</div>
                <div style={{ fontSize: 14, color: '#d46b08', fontWeight: 700, lineHeight: 1.7 }}>
                  {result.taxCalc.diff}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 第三栏：法条依据 + 新旧对比 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, color: '#999', fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>③ 法条依据 · 新旧对比</div>
        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f0f5ff', border: '1px solid #adc6ff', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#1d39c4', fontWeight: 600, marginBottom: 4 }}>📋 法条依据</div>
          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.8 }}>{result.basis}</div>
        </div>
        {result.oldVsNew && (
          <div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, padding: '10px 12px', borderRadius: 8,
                background: '#fafafa', border: '1px solid #d9d9d9', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 4 }}>旧规则</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>{result.oldVsNew.old}</div>
                {result.oldVsNew.changed && (
                  <div style={{
                    position: 'absolute', top: 6, right: -18,
                    background: '#ff4d4f', color: '#fff', fontSize: 9, fontWeight: 700,
                    padding: '2px 20px', transform: 'rotate(45deg)', letterSpacing: 0.5
                  }}>已失效</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: result.oldVsNew.changed ? '#cf1322' : '#52c41a', fontSize: 18 }}>
                {result.oldVsNew.changed ? '≠' : '='}
              </div>
              <div style={{
                flex: 1, padding: '10px 12px', borderRadius: 8,
                background: '#f6ffed', border: '1.5px solid #b7eb8f'
              }}>
                <div style={{ fontSize: 11, color: '#389e0d', fontWeight: 600, marginBottom: 4 }}>2026新规</div>
                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7 }}>{result.oldVsNew.new}</div>
              </div>
            </div>
            {result.oldVsNew.changed && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#cf1322', textAlign: 'center' }}>
                ⚠ 新旧规则结论不同，注意更新判断依据
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 11, color: '#bbb', lineHeight: 1.6, borderTop: '1px solid #f5f5f5', paddingTop: 10 }}>
          本结论为税务逻辑分析，非正式税务意见，具体以主管税务机关认定为准。
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const loadingTexts = ['正在翻阅 13 号公告…', '比对列举情形…', '推理主附关系…', '生成判定结论…'];
  const loadingRef = useRef(null);

  useEffect(() => {
    if (loading) {
      let i = 0;
      setLoadingText(loadingTexts[0]);
      loadingRef.current = setInterval(() => {
        i = (i + 1) % loadingTexts.length;
        setLoadingText(loadingTexts[i]);
      }, 900);
    } else {
      clearInterval(loadingRef.current);
    }
    return () => clearInterval(loadingRef.current);
  }, [loading]);

  const handleSubmit = async (text) => {
    const input = text || scenario;
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShowResult(false);

    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: input })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');
      setResult(data);
      setTimeout(() => setShowResult(true), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (demo) => {
    setScenario(demo.scenario);
    setTimeout(() => handleSubmit(demo.scenario), 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0fff4 100%)',
      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #1677ff 0%, #0958d9 100%)',
        padding: '20px 24px', color: '#fff',
        boxShadow: '0 2px 12px rgba(22,119,255,0.3)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20
            }}>⚖</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>
                增值税混合销售智能判定
              </h1>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                基于 2026 新《增值税法》及财政部 税务总局公告 2026 年第 13 号
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* 输入区 */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
            描述您的业务场景（包含哪些业务、金额、合同方式），AI 将判断能否按不同税率拆分计税：
          </div>
          <textarea
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            placeholder="例如：我们厂自产钢结构件 800 万，同时提供安装服务 200 万，签了一份合同，能不能把安装部分拆出来按 9% 申报？"
            style={{
              width: '100%', minHeight: 100, padding: '12px 14px',
              border: '1.5px solid #e6f0ff', borderRadius: 10,
              fontSize: 14, lineHeight: 1.7, color: '#333',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', background: '#fafcff',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#1677ff'}
            onBlur={e => e.target.style.borderColor = '#e6f0ff'}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !scenario.trim()}
              style={{
                padding: '10px 28px', borderRadius: 8, border: 'none',
                background: loading || !scenario.trim() ? '#d9d9d9' : 'linear-gradient(90deg, #1677ff, #0958d9)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading || !scenario.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 2px 8px rgba(22,119,255,0.35)'
              }}
            >
              {loading ? loadingText : '开始判定 →'}
            </button>
          </div>
        </div>

        {/* 演示案例 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 600 }}>
            ⚡ 一键演示案例（点击即跑）
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DEMO_CASES.map(demo => {
              const tc = TAG_COLORS[demo.tag] || TAG_COLORS['命中列举'];
              return (
                <button
                  key={demo.id}
                  onClick={() => handleDemo(demo)}
                  disabled={loading}
                  style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: `1.5px solid ${tc.border}`,
                    background: tc.bg, color: tc.color,
                    fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {demo.label}
                  <span style={{
                    marginLeft: 5, fontSize: 10, padding: '1px 5px',
                    borderRadius: 8, background: 'rgba(0,0,0,0.06)'
                  }}>{demo.tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, background: '#fff1f0',
            border: '1px solid #ffa39e', color: '#cf1322', fontSize: 13, marginBottom: 16
          }}>
            ❌ {error}
          </div>
        )}

        {/* 结果展示 */}
        <ResultCard result={result} visible={showResult} />
      </div>
    </div>
  );
}
