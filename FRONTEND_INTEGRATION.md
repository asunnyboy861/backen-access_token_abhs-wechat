# 🔌 前端API使用指南

> ⚠️ **重要说明**: 这是一个API使用指南，用于连接已部署的后端服务
> 🚫 **不要重新生成后端**: 后端服务已完成并部署在生产环境
> 🎯 **目标**: 帮助前端开发者快速集成现有API

---

## 📡 已部署的API服务

**生产环境地址**: `https://backend-abhs.zzoutuo.com`

**服务状态**: ✅ 已成功部署并运行中

**GitHub仓库**: https://github.com/asunnyboy861/backen-access_token_abhs-wechat

---

## 🚀 微信小程序快速接入

### 第一步：配置服务器域名

在微信公众平台 > 开发管理 > 开发设置 > 服务器域名中添加：

```
request合法域名: https://backend-abhs.zzoutuo.com
```

### 第二步：在小程序中创建API配置文件

创建 `utils/api.js` 文件：

```javascript
// utils/api.js - API配置文件
const API_CONFIG = {
  BASE_URL: 'https://backend-abhs.zzoutuo.com',
  ENDPOINTS: {
    HEALTH: '/api/health',
    TOKEN: '/api/auth/token', 
    TEXT_CHECK: '/api/security/text-check',
    CODE2SESSION: '/api/auth/code2session' // 用户登录接口
  }
};

// 封装请求方法
const apiRequest = (endpoint, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_CONFIG.BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...options.header
      },
      success: resolve,
      fail: reject
    });
  });
};

module.exports = {
  API_CONFIG,
  apiRequest
};
```

### 第三步：使用API服务

#### 1. 健康检查
```javascript
const { apiRequest, API_CONFIG } = require('../utils/api');

// 检查API服务状态
apiRequest(API_CONFIG.ENDPOINTS.HEALTH)
  .then(res => {
    console.log('API服务正常:', res.data);
  })
  .catch(err => {
    console.error('API服务异常:', err);
  });
```

#### 2. 微信小程序用户登录（code2Session）

> 📖 **登录流程说明**：根据微信官方文档，小程序登录需要前端获取临时登录凭证code，然后由后端调用微信接口换取用户信息

```javascript
// 微信小程序登录流程（符合官方规范）
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    // 第一步：检查当前登录态
    wx.checkSession({
      success: () => {
        // 登录态有效，检查本地是否有用户信息
        const openid = wx.getStorageSync('openid');
        if (openid) {
          console.log('✅ 登录态有效，使用缓存信息');
          resolve({ openid, unionid: wx.getStorageSync('unionid') });
          return;
        }
      },
      fail: () => {
        console.log('⚠️ 登录态已过期，需要重新登录');
      },
      complete: () => {
        // 第二步：获取新的登录凭证
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              console.log('📱 获取到登录凭证:', loginRes.code.substring(0, 10) + '***');
              
              // 第三步：调用后端code2Session接口
              apiRequest(API_CONFIG.ENDPOINTS.CODE2SESSION, {
                method: 'POST',
                data: { code: loginRes.code }
              })
              .then(res => {
                if (res.data.success && res.data.data.openid) {
                  // 登录成功，保存用户信息
                  const { openid, unionid } = res.data.data;
                  wx.setStorageSync('openid', openid);
                  if (unionid) {
                    wx.setStorageSync('unionid', unionid);
                  }
                  console.log('✅ 登录成功，openid:', openid.substring(0, 8) + '***');
                  resolve(res.data.data);
                } else {
                  console.error('❌ 登录失败:', res.data.message);
                  reject(new Error(res.data.message || '登录失败'));
                }
              })
              .catch(err => {
                console.error('❌ 登录请求失败:', err);
                // 根据错误类型提供不同的处理建议
                if (err.errMsg && err.errMsg.includes('timeout')) {
                  reject(new Error('网络超时，请检查网络连接'));
                } else {
                  reject(new Error('登录服务异常，请稍后重试'));
                }
              });
            } else {
              console.error('❌ 获取登录凭证失败:', loginRes.errMsg);
              reject(new Error('获取登录凭证失败'));
            }
          },
          fail: (error) => {
            console.error('❌ wx.login调用失败:', error);
            reject(new Error('微信登录服务异常'));
          }
        });
      }
    });
  });
};

// 在app.js中使用（完整的登录态管理）
App({
  onLaunch() {
    this.doLogin();
  },
  
  async doLogin() {
    try {
      wx.showLoading({ title: '登录中...' });
      const userInfo = await wxLogin();
      this.globalData.userInfo = userInfo;
      
      // 登录成功后的处理
      console.log('🎉 应用启动登录成功');
      wx.hideLoading();
      
    } catch (error) {
      wx.hideLoading();
      console.error('应用启动登录失败:', error.message);
      
      // 根据错误类型显示不同提示
      let title = '登录失败';
      if (error.message.includes('网络')) {
        title = '网络异常，请检查网络连接';
      } else if (error.message.includes('频繁')) {
        title = '请求过于频繁，请稍后重试';
      }
      
      wx.showToast({
        title,
        icon: 'none',
        duration: 3000
      });
      
      // 可以设置重试机制
      setTimeout(() => {
        this.doLogin();
      }, 5000);
    }
  },
  
  // 检查登录态的工具方法
  checkLoginStatus() {
    return new Promise((resolve, reject) => {
      const openid = wx.getStorageSync('openid');
      if (!openid) {
        reject(new Error('未登录'));
        return;
      }
      
      wx.checkSession({
        success: () => resolve(true),
        fail: () => reject(new Error('登录态已过期'))
      });
    });
  },
  
  globalData: {
    userInfo: null
  }
});

// 页面中使用登录态检查
// pages/index/index.js
Page({
  onLoad() {
    this.ensureLogin();
  },
  
  async ensureLogin() {
    try {
      await getApp().checkLoginStatus();
      console.log('✅ 登录态有效');
    } catch (error) {
      console.log('⚠️ 需要重新登录:', error.message);
      await getApp().doLogin();
    }
  }
});
```

#### 3. 获取微信Access Token
```javascript
// 获取微信访问令牌
apiRequest(API_CONFIG.ENDPOINTS.TOKEN, {
  method: 'POST',
  data: {
    appid: 'your_wechat_appid',
    secret: 'your_wechat_secret'
  }
})
.then(res => {
  if (res.data.errcode === 0) {
    console.log('Token获取成功:', res.data.access_token);
    // 存储token
    wx.setStorageSync('access_token', res.data.access_token);
  }
})
.catch(err => {
  console.error('Token获取失败:', err);
});
```

#### 4. 文本内容安全检测
```javascript
// 检测文本内容是否违规
const checkTextSafety = (content, openid) => {
  return apiRequest(API_CONFIG.ENDPOINTS.TEXT_CHECK, {
    method: 'POST',
    data: {
      content: content,
      openid: openid,
      scene: 2, // 1-资料, 2-评论, 3-论坛, 4-社交日志
      version: 2 // 固定值，使用2.0版本
    }
  });
};

// 使用示例
wx.login({
  success(loginRes) {
    // 获取用户openid（需要通过后端服务获取）
    const openid = 'user_openid';
    
    checkTextSafety('要检测的文本内容', openid)
      .then(res => {
        if (res.data.errcode === 0) {
          const result = res.data.result.suggest;
          switch(result) {
            case 'pass':
              console.log('✅ 内容安全，可以发布');
              break;
            case 'review':
              console.log('⚠️ 内容疑似违规，需要人工审核');
              break;
            case 'risky':
              console.log('❌ 内容违规，不能发布');
              break;
          }
        }
      })
      .catch(err => {
        console.error('检测失败:', err);
      });
  }
});
```

---

## 📋 API接口详情

### 1. 健康检查接口
- **URL**: `GET /api/health`
- **功能**: 检查API服务运行状态
- **返回**: 服务健康信息

### 2. 用户登录接口（code2Session）
- **URL**: `POST /api/auth/code2session`
- **状态**: ✅ **已实现并符合微信官方规范**
- **功能**: 登录凭证校验，将临时登录凭证code换取用户唯一标识openid
- **官方文档**: https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
- **重要说明**: <mcreference link="https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html" index="1">1</mcreference> <mcreference link="https://developers.weixin.qq.com/minigame/dev/api-backend/open-api/login/auth.code2Session.html" index="2">2</mcreference>
  - 本接口在服务器端调用微信官方API，确保appid和secret安全性
  - code有效期5分钟且只能使用一次
  - session_key不会返回给前端，仅在后端使用
  - 支持频率限制：每用户每分钟100次

#### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 通过wx.login获取的临时登录凭证 |

#### 返回参数（成功时）
```json
{
  "success": true,
  "data": {
    "openid": "用户唯一标识",
    "unionid": "用户在开放平台的唯一标识符（可选）"
  },
  "message": "登录成功"
}
```

#### 返回参数（失败时）
```json
{
  "success": false,
  "error": "错误类型",
  "errcode": 40029,
  "errmsg": "微信返回的错误信息",
  "message": "用户友好的错误提示"
}
```

#### 错误码说明 <mcreference link="https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html" index="1">1</mcreference>
| 错误码 | 说明 | 前端处理建议 |
|--------|------|-------------|
| 40029 | code无效 | 提示用户重新登录 |
| 45011 | API调用太频繁 | 提示稍后重试 |
| 40226 | 高风险用户被拦截 | 提示联系客服 |
| -1 | 系统繁忙 | 提示稍后重试 |

### 3. 获取访问令牌接口
- **URL**: `POST /api/auth/token`
- **功能**: 获取微信小程序access_token
- **参数**: `appid`, `secret`
- **返回**: access_token和过期时间

### 4. 文本内容安全检测接口
- **URL**: `POST /api/security/text-check`
- **功能**: 检测文本内容是否违规
- **版本**: msgSecCheck 2.0
- **必需参数**:
  - `content`: 检测文本（最大2500字）
  - `openid`: 用户openid（需在2小时内访问过小程序）
  - `scene`: 场景值（1-4）
  - `version`: 固定值2
- **返回**: 检测结果（pass/review/risky）

---

## 🧪 API测试命令

```bash
# 1. 健康检查
curl https://backend-abhs.zzoutuo.com/api/health

# 2. 用户登录（code2Session）
curl -X POST https://backend-abhs.zzoutuo.com/api/auth/code2session \
  -H "Content-Type: application/json" \
  -d '{"code": "wx_login_code"}'

# 3. 获取Token
curl -X POST https://backend-abhs.zzoutuo.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"appid":"your_appid","secret":"your_secret"}'

# 4. 内容检测
curl -X POST https://backend-abhs.zzoutuo.com/api/security/text-check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "测试内容",
    "openid": "用户openid",
    "scene": 2,
    "version": 2
  }'
```

---

## ⚠️ 重要注意事项

### ✅ code2Session接口核心要点

#### 🔒 安全性要求 <mcreference link="https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html" index="1">1</mcreference>
- **✅ 服务器端调用**: 本接口严格在服务器端调用微信官方API，确保appid和secret安全性
- **❌ 禁止前端直接调用**: 绝不在前端直接调用微信官方接口，避免泄露敏感信息
- **🔐 session_key保护**: 会话密钥仅在后端存储和使用，不会下发到前端
- **📝 日志脱敏**: 生产环境日志已对敏感信息进行脱敏处理

#### ⏰ 时效性管理
- **⏱️ code有效期**: 临时登录凭证code有效期5分钟且只能使用一次
- **🔄 登录态检查**: 使用wx.checkSession()检查登录态有效性
- **💾 本地缓存**: 合理使用本地存储缓存用户信息，减少重复登录
- **🔁 自动重试**: 登录失败时实现智能重试机制

#### 📊 频率控制 <mcreference link="https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html" index="1">1</mcreference>
- **⚡ 官方限制**: 每个用户每分钟最多100次调用
- **🎯 最佳实践**: 避免频繁调用，优先使用缓存的登录信息
- **⏳ 错误重试**: API调用频繁时(45011)，延迟重试

#### 🛡️ 错误处理
- **📋 完整错误码**: 已实现微信官方所有错误码的处理
- **👥 用户友好**: 提供清晰易懂的错误提示信息
- **🔍 问题追踪**: 详细的错误日志便于问题定位
- **🚨 风险用户**: 对高风险用户(40226)提供特殊处理流程

### 微信API规范
- 使用msgSecCheck 2.0版本（1.0版本已停止维护）
- 必须设置 `version: 2`
- openid要求用户在近2小时内访问过小程序
- 文本内容最大2500字，使用UTF-8编码
- 频率限制：4000次/分钟，200万次/天

### 🎯 前端开发最佳实践

#### 📱 登录流程优化
```javascript
// 推荐的登录管理工具类
class LoginManager {
  constructor() {
    this.isLogging = false;
    this.loginPromise = null;
  }
  
  // 防止重复登录
  async ensureLogin() {
    if (this.isLogging && this.loginPromise) {
      return this.loginPromise;
    }
    
    const openid = wx.getStorageSync('openid');
    if (openid) {
      try {
        await this.checkSession();
        return { openid, unionid: wx.getStorageSync('unionid') };
      } catch (error) {
        console.log('登录态已过期，需要重新登录');
      }
    }
    
    return this.doLogin();
  }
  
  async checkSession() {
    return new Promise((resolve, reject) => {
      wx.checkSession({
        success: resolve,
        fail: reject
      });
    });
  }
  
  async doLogin() {
    if (this.isLogging) {
      return this.loginPromise;
    }
    
    this.isLogging = true;
    this.loginPromise = this._performLogin();
    
    try {
      const result = await this.loginPromise;
      return result;
    } finally {
      this.isLogging = false;
      this.loginPromise = null;
    }
  }
  
  async _performLogin() {
    // 实现具体的登录逻辑
    return wxLogin();
  }
}

// 全局使用
const loginManager = new LoginManager();
getApp().loginManager = loginManager;
```

#### 🔄 错误重试策略
```javascript
// 智能重试机制
const retryLogin = async (maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await wxLogin();
    } catch (error) {
      console.log(`登录重试 ${i + 1}/${maxRetries}:`, error.message);
      
      // 根据错误类型决定是否重试
      if (error.message.includes('40029')) {
        // code无效，不重试
        throw error;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw new Error('登录重试次数已达上限');
};
```

#### 📊 性能监控
```javascript
// 登录性能监控
const monitorLogin = async () => {
  const startTime = Date.now();
  try {
    const result = await wxLogin();
    const duration = Date.now() - startTime;
    console.log(`✅ 登录成功，耗时: ${duration}ms`);
    
    // 上报性能数据（可选）
    wx.reportAnalytics('login_success', {
      duration,
      openid_length: result.openid ? result.openid.length : 0
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ 登录失败，耗时: ${duration}ms, 错误: ${error.message}`);
    
    // 上报错误数据
    wx.reportAnalytics('login_error', {
      duration,
      error_message: error.message
    });
    
    throw error;
  }
};
```

#### 🛡️ 安全建议
- **✅ 数据验证**: 始终验证从后端返回的数据格式和内容
- **✅ 敏感信息**: 不在前端存储session_key等敏感信息
- **✅ 网络安全**: 使用HTTPS确保数据传输安全
- **✅ 错误处理**: 不向用户暴露技术细节，提供友好的错误提示
- **✅ 日志安全**: 避免在前端日志中输出完整的openid等敏感信息

---

## 🔗 相关资源

- **API服务地址**: https://backend-abhs.zzoutuo.com
- **健康检查**: https://backend-abhs.zzoutuo.com/api/health
- **GitHub仓库**: https://github.com/asunnyboy861/backen-access_token_abhs-wechat
- **微信小程序登录官方文档**: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- **code2Session接口文档**: https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
- **code2Session接口流程文档**:https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- **内容安全检测文档**: https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/sec-center/sec-check/msgSecCheck.html
- **UnionID机制说明**: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/union-id.html

---

## ❌ 重要提醒

**🚫 请勿重新生成后端代码**

- 后端服务已完成开发并部署
- 所有API接口已测试通过
- 直接使用本指南连接现有API即可
- 如有问题请检查网络连接或API调用参数

---

*本文档最后更新：2025年7月*