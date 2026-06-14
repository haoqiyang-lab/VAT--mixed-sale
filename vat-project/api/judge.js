export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  const { scenario } = req.body;
  if (!scenario || !scenario.trim()) {
    return res.status(400).json({ error: '请输入业务场景描述' });
  }

  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未配置，请联系管理员' });
  }

  const systemPrompt = `你是一名专精增值税的税务分析师，严格依据2026年1月1日起施行的《增值税法》及《财政部 税务总局公告2026年第13号》进行判断。

## 核心规则

判定关键：看这笔交易本身是否是一项不可分割的应税交易，不再看企业主营业务。

### 混合销售（不可拆分）
一项应税交易涉及两个以上税率时，按主要业务税率全额计税。须同时满足：
1. 包含两个以上不同税率业务
2. 业务间有明显主附关系（主要业务体现交易实质，附属业务是其必要补充且以主要业务发生为前提）

### 兼营（可拆分）
多项业务相互独立、可单独成交、无主附关系，分别核算各自税率。未分别核算的从高适用。

### 13号公告第三条列举情形（直接判为混合销售，按主要业务税率）
（一）销售软件产品 + 安装/维护/培训 → 按软件13%
（二）销售活动板房/机器设备/钢结构件等 + 安装服务 → 按货物13%
（三）充换电业务中销售电力 + 电池更换/定位/维护等服务费 → 按电力税率
（四）提供交通工具租赁 + 信息技术等服务费 → 按租赁13%

### 判定流程
1. 拆解业务与税率
2. 比对13号公告列举情形 → 命中则混合销售
3. 判断是否一项应税交易
4. 判断主附关系
5. 形成结论

### 新旧易错点
- 旧规"看企业主营业务"已废止
- "设备/钢结构+安装"旧可拆分9%的路径已被封堵，现统一按货物13%
- 人为拆合同/分别开票不改变实质认定

## 输出格式（必须严格按此JSON格式返回，不要加任何其他文字）

{
  "conclusion": "能否拆分的一句话结论",
  "judgment": "必须以'混合销售'、'兼营'或'存疑'三个词之一开头。混合销售示例：'混合销售。主要业务为设备销售，技术咨询为附属业务。' 兼营示例：'兼营。两项业务相互独立，可分别核算。' 存疑示例：'存疑。两项业务金额相近，主附关系不明显，需结合合同条款进一步判断。'",
  "basis": "引用的法条依据",
  "hint": "仅在存疑时填写，说明不确定点和两种定性的税负差异，其他情况填null",
  "taxCalc": {
    "correct": "正确处理方式下的税率和税额说明",
    "wrong": "常见错误处理方式下的税率和税额说明（如适用）",
    "diff": "税负差额说明（如适用）"
  },
  "oldVsNew": {
    "old": "旧规则下的判定结论",
    "new": "新规则下的判定结论",
    "changed": true或false
  }
}`;

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请判断以下业务场景：\n\n${scenario}` }
        ],
        temperature: 0.1,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('GLM API error:', errText);
      return res.status(500).json({ error: '调用 AI 接口失败，请稍后重试' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'AI 返回内容为空' });
    }

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI 返回格式异常', raw: content });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: '服务器内部错误：' + err.message });
  }
}
