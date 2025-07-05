# 🚀 微信内容安全API - 部署指南

## 📋 项目概述

这是一个基于Vercel的微信小程序内容安全检测API，符合2025年最新技术标准。

### ✅ 项目特点
- **现代化架构**: Node.js 22.x + ES2023
- **微信官方API**: 完全符合msgSecCheck 2.0规范
- **生产就绪**: 完整的错误处理和安全机制
- **高性能**: 优化的Serverless Functions配置

## 🗂️ 项目结构

```
├── api/                    # Vercel Serverless Functions
│   ├── auth/
│   │   └── token.js       # 获取微信Access Token
│   ├── health.js          # 健康检查接口
│   └── security/
│       └── text-check.js  # 文本内容安全检测
├── public/
│   └── index.html         # API文档页面
├── .env.example           # 环境变量模板
├── .gitignore            # Git忽略文件
├── .nvmrc                # Node.js版本指定
├── .vercelignore         # Vercel部署忽略文件
├── package.json          # 项目依赖和配置
├── tsconfig.json         # TypeScript配置
├── vercel.json           # Vercel部署配置
└── README.md             # 项目说明
```

## 🔧 部署前准备

### 1. 微信小程序配置

在[微信公众平台](https://mp.weixin.qq.com/)获取：
- **AppID**: 小程序唯一标识
- **AppSecret**: 小程序密钥

### 2. 环境变量配置

复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret
```

## 📤 GitHub部署步骤

### 1. 创建GitHub仓库

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "🎉 Initial commit: WeChat Content Security API"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/wechat-content-security-api.git

# 推送到GitHub
git push -u origin main
```

### 2. 重要提醒

⚠️ **不要上传 `.env` 文件到GitHub**
- `.env` 文件已在 `.gitignore` 中被忽略
- 环境变量将在Vercel中单独配置

## 🌐 Vercel部署步骤

### 1. 连接GitHub

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的GitHub仓库
4. 点击 "Import"

### 2. 配置环境变量

在Vercel项目设置中添加环境变量：

| 变量名 | 值 | 说明 |
|--------|----|---------|
| `WECHAT_APP_ID` | `wxxxxxxxxxxx` | 微信小程序AppID |
| `WECHAT_APP_SECRET` | `xxxxxxxxxxxxxxxx` | 微信小程序AppSecret |

### 3. 部署配置

Vercel会自动检测到 `vercel.json` 配置文件，包含：
- **Node.js 22.x** 运行时
- **1024MB** 内存配置
- **10秒** 最大执行时间
- **CORS** 跨域支持

### 4. 部署完成

部署成功后，你将获得：
- **生产域名**: `https://your-project.vercel.app`
- **API端点**:
  - 健康检查: `/api/health`
  - 获取Token: `/api/auth/token`
  - 内容检测: `/api/security/text-check`

## 🧪 API测试

### 健康检查
```bash
curl https://your-project.vercel.app/api/health
```

### 获取Access Token
```bash
curl https://your-project.vercel.app/api/auth/token
```

### 内容安全检测
```bash
curl -X POST https://your-project.vercel.app/api/security/text-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "测试内容",
    "openid": "用户的真实openid",
    "scene": 2
  }'
```

## 📱 小程序集成示例

### 1. 获取用户OpenID

```javascript
// 小程序登录获取OpenID
wx.login({
  success: (res) => {
    wx.request({
      url: 'https://your-project.vercel.app/api/auth/login',
      method: 'POST',
      data: { code: res.code },
      success: (result) => {
        const openid = result.data.openid;
        wx.setStorageSync('openid', openid);
      }
    });
  }
});
```

### 2. 内容安全检测

```javascript
// 检测用户输入内容
function checkContent(content) {
  const openid = wx.getStorageSync('openid');
  
  wx.request({
    url: 'https://your-project.vercel.app/api/security/text-check',
    method: 'POST',
    data: {
      content: content,
      openid: openid,
      scene: 2,  // 评论场景
      title: '用户评论',
      nickname: '用户昵称'
    },
    success: (res) => {
      if (res.data.success) {
        console.log('内容检测通过');
      } else {
        console.log('内容包含敏感信息');
      }
    }
  });
}
```

## 🔍 监控和维护

### Vercel Analytics
- 访问 Vercel Dashboard 查看API调用统计
- 监控响应时间和错误率
- 查看函数执行日志

### 微信API配额
- 内容安全检测：每日100万次免费调用
- Access Token：每日2000次获取限制
- 建议实现Token缓存机制

## 🚨 常见问题

### Q: OpenID错误怎么办？
A: 确保使用真实的小程序用户OpenID，不能使用模拟数据。

### Q: Access Token获取失败？
A: 检查AppID和AppSecret是否正确，确认IP地址在微信白名单中。

### Q: API调用超限？
A: 实现Token缓存，避免频繁获取Access Token。

### Q: 部署后无法访问？
A: 检查Vercel环境变量配置，确认域名解析正常。

## 📞 技术支持

- **微信开放文档**: https://developers.weixin.qq.com/
- **Vercel文档**: https://vercel.com/docs
- **项目Issues**: 在GitHub仓库中提交问题

---

🎉 **恭喜！你的微信内容安全API已准备就绪！**

立即部署到Vercel，开始使用强大的内容安全检测功能！