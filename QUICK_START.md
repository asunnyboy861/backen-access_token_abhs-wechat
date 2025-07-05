# 🚀 快速开始指南

这是一个5分钟快速部署指南，帮助您快速解决微信小程序因UGC内容未做安全筛选而被封的问题。

## 📋 准备工作

### 1. 获取微信小程序配置
- **App ID**: 在微信公众平台 > 开发 > 开发设置中获取
- **App Secret**: 在微信公众平台 > 开发 > 开发设置中获取

### 2. 确保环境
- ✅ Node.js 18+ 已安装
- ✅ 有 Vercel 账户（免费）
- ✅ 微信小程序已上线（重要！）

## ⚡ 5分钟部署

### 步骤 1: 配置环境变量
```bash
# 复制环境变量模板
copy .env.example .env.local
```

编辑 `.env.local` 文件：
```env
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret_here
```

### 步骤 2: 安装依赖
```bash
npm install
```

### 步骤 3: 本地测试
```bash
# 启动本地开发服务器
npm run dev

# 在新终端运行测试
npm run test
```

### 步骤 4: 部署到 Vercel

**方法一：使用批处理脚本（推荐）**
```bash
# Windows用户
deploy.bat

# Linux/Mac用户
./deploy.sh
```

**方法二：手动部署**
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
vercel --prod
```

### 步骤 5: 配置 Vercel 环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 Settings > Environment Variables
4. 添加以下变量：
   - `WECHAT_APP_ID`: 您的微信小程序App ID
   - `WECHAT_APP_SECRET`: 您的微信小程序App Secret

## 🧪 验证部署

### 1. 检查服务状态
访问：`https://your-domain.vercel.app/api/health`

期望响应：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "config": {
      "app_id_configured": true,
      "app_secret_configured": true
    }
  }
}
```

### 2. 测试文本安全检测
```bash
curl -X POST https://your-domain.vercel.app/api/security/text-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一段测试文本",
    "version": 2,
    "scene": 1
  }'
```

## 🔧 前端集成

### React/Vue 示例
```javascript
// 文本安全检测函数
async function checkContent(text) {
  const response = await fetch('https://your-domain.vercel.app/api/security/text-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: text,
      version: 2,
      scene: 1
    })
  });
  
  const result = await response.json();
  return result.data.is_secure;
}

// 在表单提交前使用
async function handleSubmit(formData) {
  const isSecure = await checkContent(formData.content);
  if (isSecure) {
    // 内容安全，可以提交
    submitForm(formData);
  } else {
    // 内容不安全，显示错误
    alert('内容不符合规范，请修改后重试');
  }
}
```

### 微信小程序示例
```javascript
// 在小程序中调用
wx.request({
  url: 'https://your-domain.vercel.app/api/security/text-check',
  method: 'POST',
  data: {
    content: '用户输入的内容',
    version: 2,
    scene: 1,
    openid: 'user_openid'
  },
  success: function(res) {
    if (res.data.success && res.data.data.is_secure) {
      // 内容安全
      console.log('内容检测通过');
    } else {
      // 内容不安全
      wx.showToast({
        title: '内容不符合规范',
        icon: 'none'
      });
    }
  }
});
```

## 🚨 常见问题解决

### Q: 部署后提示配置缺失
**A**: 检查 Vercel 环境变量是否正确设置

### Q: 获取 Access Token 失败
**A**: 
1. 确认 App ID 和 App Secret 正确
2. 确认小程序已发布上线
3. 检查网络连接

### Q: 文本检测总是失败
**A**:
1. 检查文本长度（最大5000字符）
2. 确认 Access Token 有效
3. 查看具体错误信息

### Q: CORS 错误
**A**: 项目已配置 CORS，如仍有问题请检查域名配置

## 📞 获取帮助

- 📖 查看完整文档：`README.md`
- 🧪 运行测试：`npm run test`
- 🌐 访问测试页面：`https://your-domain.vercel.app/`
- 📝 查看 API 文档：项目中的接口注释

## 🎯 下一步

1. **集成到您的前端应用**：使用上面的示例代码
2. **设置监控**：在 Vercel 中查看函数日志
3. **优化性能**：根据使用情况调整缓存策略
4. **扩展功能**：添加图片、音频等其他内容检测

---

**🎉 恭喜！您的微信小程序内容安全API已经部署完成！**

现在您可以在小程序中集成这个API，确保用户生成的内容符合微信平台规范，避免因内容问题导致小程序被封。