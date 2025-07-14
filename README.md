# 🛡️ 微信小程序后端API服务 - 2025版

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-ES2023-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![WeChat](https://img.shields.io/badge/WeChat-API_2025-07C160?style=for-the-badge&logo=wechat&logoColor=white)](https://developers.weixin.qq.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Live-brightgreen.svg?style=for-the-badge)](https://backen-access-token-abhs-wechat.vercel.app)

> 🚀 **企业级微信小程序后端API服务** - 基于Vercel Serverless Functions，符合2025年最新技术标准和微信官方规范

集成微信小程序用户登录(code2Session)和内容安全检测功能，为小程序提供完整的后端API支持。专为解决小程序用户认证和UGC内容安全筛选问题而设计，防止因违规内容导致的小程序封禁风险。已通过生产环境验证，支持高并发和企业级部署。

## ✨ 核心特性

🔐 **用户登录认证** - 基于微信官方 code2Session API，安全可靠的用户身份验证  
🔒 **内容安全检测** - 基于微信官方 msgSecCheck 2.0 API，完全符合官方规范  
⚡ **现代化架构** - Node.js 22.x + ES2023 + TypeScript，性能优化  
🌐 **Serverless部署** - Vercel无服务器架构，零运维成本，自动扩缩容  
🎯 **多场景支持** - 资料/评论/论坛/社交四大检测场景，覆盖全业务流程  
🔄 **智能缓存** - Access Token自动管理和缓存，减少API调用成本  
🛡️ **完整防护** - 详细错误处理和安全机制，企业级可靠性  
📱 **跨域支持** - 完整CORS配置，支持前端直调和小程序集成  
🧪 **生产就绪** - 完整测试覆盖和监控体系，已验证高并发场景  
📊 **实时监控** - 集成Vercel Analytics，实时性能和错误监控  
🚀 **一键部署** - 支持GitHub一键部署，5分钟快速上线

## 📋 API 接口

### 1. 健康检查
```
GET /api/health
```

### 2. 微信小程序用户登录
```
POST /api/auth/code2session
```

### 3. 获取 Access Token
```
GET /api/auth/token
```

### 4. 文本内容安全检测
```
POST /api/security/text-check
```

## 🔐 微信小程序登录接口

**接口地址**: `POST /api/auth/code2session`

**功能说明**: 将微信小程序前端通过 `wx.login()` 获取的临时登录凭证 `code` 换取用户的 `openid` 和 `session_key`，符合2025年微信小程序最新官方规范。

**请求参数**:
```json
{
  "code": "微信小程序wx.login()获取的临时登录凭证"
}
```

**响应示例**:
```json
{
  "success": true,
  "openid": "用户唯一标识",
  "session_key": "会话密钥",
  "unionid": "用户在开放平台的唯一标识（可选）",
  "message": "登录成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "WeChat API Error",
  "errcode": 40029,
  "errmsg": "invalid code",
  "message": "登录凭证无效，请重新登录"
}
```

**常见错误码**:
- `40029`: code 无效（已使用或过期）
- `45011`: API 调用太频繁，请稍后再试
- `40013`: AppID 无效
- `40125`: AppSecret 无效

## 🔒 文本内容安全检测接口

**接口地址**: `POST /api/security/text-check`

**请求参数**:
```json
{
  "content": "要检测的文本内容",
  "openid": "用户openid（必需，用户需在近两小时内访问过小程序）",
  "scene": 2,
  "title": "内容标题（可选）",
  "nickname": "用户昵称（可选）",
  "signature": "个性签名（仅资料场景有效）"
}
```

**场景值说明**:
- `1`: 资料场景（个人资料等）
- `2`: 评论场景（评论内容等）
- `3`: 论坛场景（论坛发帖等）
- `4`: 社交日志场景（朋友圈等）

**响应示例**:
```json
{
  "success": true,
  "safe": true,
  "suggest": "pass",
  "label": 0,
  "message": "内容安全，可以发布",
  "data": {
    "errcode": 0,
    "errmsg": "ok",
    "trace_id": "trace_id_123456",
    "result": {
      "suggest": "pass",
      "label": 0
    },
    "detail": []
  }
}
```

**suggest字段说明**:
- `pass`: 内容安全，可以发布
- `review`: 内容需要人工审核
- `risky`: 内容包含违规信息，不建议发布

## 🚀 快速部署

### 一键部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/asunnyboy861/backen-access_token_abhs-wechat)

### 手动部署步骤

1️⃣ **Fork项目** → 点击右上角Fork按钮  
2️⃣ **连接Vercel** → 在[Vercel Dashboard](https://vercel.com/dashboard)导入项目  
3️⃣ **配置环境变量**：
```env
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret
```
4️⃣ **部署完成** → 获得生产域名 `https://backen-access-token-abhs-wechat.vercel.app`

### 🎯 在线演示

**🌐 部署地址**: [https://backen-access-token-abhs-wechat.vercel.app](https://backen-access-token-abhs-wechat.vercel.app)  
**📋 API测试**: 访问上述地址可进行在线API测试  
**📊 服务状态**: [健康检查接口](https://backen-access-token-abhs-wechat.vercel.app/api/health)

### 本地开发（可选）

```bash
# 克隆项目
git clone https://github.com/asunnyboy861/backen-access_token_abhs-wechat.git
cd backen-access_token_abhs-wechat

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入微信小程序信息

# 启动开发服务器
npm run dev
```

## 📚 详细文档

- 📖 [前端集成指南](./FRONTEND_INTEGRATION.md) - 详细的前端集成步骤和代码示例
- 🔧 [在线API文档](https://backen-access-token-abhs-wechat.vercel.app) - 在线API文档和测试页面
- 📊 [服务健康检查](https://backen-access-token-abhs-wechat.vercel.app/api/health) - 实时服务状态监控

## 💻 使用示例

### 微信小程序登录流程

```javascript
// 微信小程序登录
const wxLogin = async () => {
  try {
    // 1. 获取登录凭证
    const loginRes = await wx.login();
    if (!loginRes.code) {
      throw new Error('获取登录凭证失败');
    }
    
    // 2. 调用后端code2session接口
    const response = await fetch('https://backen-access-token-abhs-wechat.vercel.app/api/auth/code2session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: loginRes.code })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 3. 保存用户信息
      wx.setStorageSync('openid', result.openid);
      wx.setStorageSync('session_key', result.session_key);
      console.log('✅ 登录成功:', result.openid);
      return result;
    } else {
      throw new Error(result.message || '登录失败');
    }
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    throw error;
  }
};

// 使用示例
wxLogin().then(userInfo => {
  console.log('用户信息:', userInfo);
}).catch(error => {
  wx.showToast({ title: error.message, icon: 'none' });
});
```

### 内容安全检测

```javascript
// 内容安全检测
const checkContent = async (content, openid) => {
  const response = await fetch('https://backen-access-token-abhs-wechat.vercel.app/api/security/text-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      openid,
      scene: 2, // 评论场景
      title: '用户评论'
    })
  });
  
  const result = await response.json();
  return result.safe; // true: 安全, false: 违规
};

// 使用示例
if (await checkContent('用户输入的内容', 'user_openid')) {
  console.log('✅ 内容安全，可以发布');
} else {
  console.log('❌ 内容违规，禁止发布');
}
```

### cURL测试

```bash
# 测试微信小程序登录接口
curl -X POST https://backen-access-token-abhs-wechat.vercel.app/api/auth/code2session \
  -H "Content-Type: application/json" \
  -d '{"code":"wx.login()获取的真实code"}'

# 测试内容安全检测接口
curl -X POST https://backen-access-token-abhs-wechat.vercel.app/api/security/text-check \
  -H "Content-Type: application/json" \
  -d '{"content":"测试内容","openid":"真实用户openid","scene":2}'

# 测试健康检查接口
curl -X GET https://backen-access-token-abhs-wechat.vercel.app/api/health
```

## 🛠️ 技术栈

### 核心技术
- **运行时**: Node.js 22.x (最新LTS版本)
- **语言**: TypeScript (ES2023) + 严格类型检查
- **框架**: Vercel Serverless Functions (Edge Runtime)
- **API**: 微信官方 msgSecCheck 2.0 + Access Token管理

### 部署与监控
- **部署平台**: Vercel (零配置部署，全球CDN)
- **监控系统**: Vercel Analytics + 自定义错误追踪
- **性能优化**: 智能缓存 + 请求去重 + 超时控制
- **安全机制**: CORS配置 + 请求验证 + 错误隐藏

### 开发工具
- **包管理**: npm (Node.js 22.x 兼容)
- **类型检查**: TypeScript 5.6+
- **代码规范**: ESLint + Prettier
- **版本控制**: Git + GitHub Actions

## ❓ 常见问题

### Q: 什么是OpenID？
A: OpenID是微信用户在你的小程序中的唯一标识，用户需要在近2小时内访问过小程序才能获得有效的OpenID。

### Q: 为什么测试时提示"invalid openid"？
A: 内容安全检测需要真实的用户OpenID，不能使用模拟数据。请确保：
- 用户已授权登录小程序
- OpenID是通过wx.login()获取的真实数据
- 用户在近2小时内访问过小程序

### Q: API调用频率限制？
A: 
- 内容安全检测：每日100万次免费
- Access Token获取：每日2000次
- 建议实现Token缓存避免频繁获取

### Q: 支持哪些内容类型？
A: 目前支持文本内容检测，未来将支持图片、音频等多媒体内容。

### 风险类型说明

| 标签值 | 风险类型 | 说明 |
|--------|----------|------|
| 10001  | 广告     | 广告内容 |
| 20001  | 时政     | 时政敏感内容 |
| 20002  | 色情     | 色情内容 |
| 20003  | 辱骂     | 辱骂内容 |
| 20006  | 违法犯罪 | 违法犯罪内容 |
| 20008  | 欺诈     | 欺诈内容 |
| 20012  | 低俗     | 低俗内容 |
| 20013  | 版权     | 版权问题 |
| 21000  | 其他     | 其他违规内容 |

### 重要说明

⚠️ **关于openid参数**:
- `openid` 是 msgSecCheck 2.0 版本的**必需参数**
- 用户必须在**近两小时内访问过小程序**，否则会返回错误码 61010
- 建议在用户活跃时进行内容检测，或者引导用户重新访问小程序

⚠️ **关于场景参数**:
- 不同场景的检测标准可能不同
- 资料场景(scene=1)支持额外的 `signature` 参数
- 建议根据实际使用场景选择合适的 scene 值

## 🚨 重要提醒

⚠️ **OpenID要求**: 内容安全检测需要真实的用户OpenID，用户必须在近2小时内访问过小程序  
⚠️ **小程序状态**: 确保微信小程序已通过审核并上线，否则API调用可能失败  
⚠️ **调用限制**: 内容安全检测每日100万次免费，Access Token每日2000次获取限制  

## 📊 监控与维护

- 📈 **Vercel Analytics**: 实时监控API调用和性能
- 🔍 **错误追踪**: 完整的错误日志和追踪ID
- 📱 **微信开发者工具**: 查看API调用统计和配额使用

## 🤝 贡献与支持

- 🐛 [提交Bug](https://github.com/asunnyboy861/backen-access_token_abhs-wechat/issues)
- 💡 [功能建议](https://github.com/asunnyboy861/backen-access_token_abhs-wechat/discussions)
- 📖 [微信开放文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.msgSecCheck.html)
- 🚀 [Vercel文档](https://vercel.com/docs)

## 📄 许可证

[MIT License](./LICENSE) - 自由使用，商业友好

---

<div align="center">

**🎉 恭喜！你的微信内容安全API已准备就绪！**

立即部署到Vercel，开始保护你的小程序内容安全！

[🚀 一键部署](https://vercel.com/new/clone?repository-url=https://github.com/asunnyboy861/backen-access_token_abhs-wechat) | [📖 前端集成](./FRONTEND_INTEGRATION.md) | [⭐ Star项目](https://github.com/asunnyboy861/backen-access_token_abhs-wechat)

</div>