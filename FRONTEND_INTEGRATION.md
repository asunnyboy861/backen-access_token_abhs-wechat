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

> 📖 **登录流程说明**：根据微信官方文档，小程序登录需要前端获取临时登录凭证code，然后由后端调用微信接口换取用户信息 <mcreference link="https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html" index="1">1</mcreference> <mcreference link="https://blog.csdn.net/UchihaItachi1/article/details/105574452" index="2">2</mcreference>

**🔄 完整登录流程**：
1. **检查登录态** → `wx.checkSession()` 检查当前登录是否有效
2. **获取登录凭证** → `wx.login()` 获取临时登录凭证code（5分钟有效，仅用一次）
3. **后端验证** → 调用后端 `/api/auth/code2session` 接口
4. **获取用户信息** → 后端调用微信官方API换取openid和session_key
5. **缓存用户信息** → 将openid等信息存储到本地

```javascript
// 🎯 推荐的登录实现（完全符合微信官方规范）
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    // 第一步：检查当前登录态
    wx.checkSession({
      success: () => {
        // 登录态有效，检查本地是否有用户信息
        const openid = wx.getStorageSync('openid');
        const loginTime = wx.getStorageSync('loginTime');
        
        // 检查本地缓存是否有效（建议24小时内有效）
        if (openid && loginTime && (Date.now() - loginTime < 24 * 60 * 60 * 1000)) {
          console.log('✅ 登录态有效，使用缓存信息');
          resolve({ 
            openid, 
            unionid: wx.getStorageSync('unionid'),
            fromCache: true 
          });
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
                data: { code: loginRes.code },
                timeout: 10000 // 设置10秒超时
              })
              .then(res => {
                console.log('🔍 后端响应:', res.statusCode, res.data);
                
                if (res.statusCode === 200 && res.data.success && res.data.data.openid) {
                  // 登录成功，保存用户信息
                  const { openid, unionid } = res.data.data;
                  const loginTime = Date.now();
                  
                  // 安全存储用户信息
                  wx.setStorageSync('openid', openid);
                  wx.setStorageSync('loginTime', loginTime);
                  if (unionid) {
                    wx.setStorageSync('unionid', unionid);
                  }
                  
                  console.log('✅ 登录成功，openid:', openid.substring(0, 8) + '***');
                  resolve({ openid, unionid, fromCache: false });
                  
                } else {
                  // 处理业务错误
                  const errorMsg = res.data.message || '登录失败';
                  const errcode = res.data.errcode;
                  
                  console.error('❌ 登录失败:', errorMsg, 'errcode:', errcode);
                  
                  // 根据错误码提供具体的错误处理
                  let userFriendlyMsg = errorMsg;
                  switch(errcode) {
                    case 40029:
                      userFriendlyMsg = '登录凭证已失效，请重新尝试';
                      break;
                    case 45011:
                      userFriendlyMsg = '登录请求过于频繁，请稍后再试';
                      break;
                    case 40226:
                      userFriendlyMsg = '账号存在风险，请联系客服';
                      break;
                    case -1:
                      userFriendlyMsg = '微信服务繁忙，请稍后重试';
                      break;
                  }
                  
                  reject(new Error(userFriendlyMsg));
                }
              })
              .catch(err => {
                console.error('❌ 登录请求失败:', err);
                
                // 网络错误处理
                let errorMessage = '登录服务异常，请稍后重试';
                if (err.errMsg) {
                  if (err.errMsg.includes('timeout')) {
                    errorMessage = '网络超时，请检查网络连接后重试';
                  } else if (err.errMsg.includes('fail')) {
                    errorMessage = '网络连接失败，请检查网络设置';
                  }
                }
                
                reject(new Error(errorMessage));
              });
            } else {
              console.error('❌ 获取登录凭证失败:', loginRes.errMsg);
              reject(new Error('获取登录凭证失败，请重试'));
            }
          },
          fail: (error) => {
            console.error('❌ wx.login调用失败:', error);
            reject(new Error('微信登录服务异常，请检查小程序权限'));
          }
        });
      }
    });
  });
};

// 🛡️ 带重试机制的安全登录函数
const safeWxLogin = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await wxLogin();
      return result;
    } catch (error) {
      console.log(`🔄 登录重试 ${i + 1}/${maxRetries}:`, error.message);
      
      // 某些错误不需要重试
      if (error.message.includes('账号存在风险') || 
          error.message.includes('登录凭证已失效')) {
        throw error;
      }
      
      // 最后一次重试失败
      if (i === maxRetries - 1) {
        throw new Error(`登录失败，已重试${maxRetries}次: ${error.message}`);
      }
      
      // 延迟重试（递增延迟）
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// 🎯 在app.js中使用（企业级登录态管理）
App({
  onLaunch() {
    console.log('🚀 小程序启动，开始初始化登录');
    this.initLogin();
  },
  
  onShow() {
    // 小程序从后台进入前台时，检查登录态
    this.checkAndRefreshLogin();
  },
  
  // 🔄 初始化登录（静默登录，不显示loading）
  async initLogin() {
    try {
      const userInfo = await safeWxLogin();
      this.globalData.userInfo = userInfo;
      
      if (userInfo.fromCache) {
        console.log('✅ 使用缓存登录信息，应用启动完成');
      } else {
        console.log('🎉 新登录成功，应用启动完成');
      }
      
      // 触发登录成功事件
      this.triggerLoginSuccess(userInfo);
      
    } catch (error) {
      console.error('❌ 应用启动登录失败:', error.message);
      this.handleLoginError(error, false); // 静默处理错误
    }
  },
  
  // 🔍 检查并刷新登录态（从后台切换到前台时）
  async checkAndRefreshLogin() {
    const lastCheckTime = this.globalData.lastLoginCheck || 0;
    const now = Date.now();
    
    // 5分钟内检查过就不重复检查
    if (now - lastCheckTime < 5 * 60 * 1000) {
      return;
    }
    
    this.globalData.lastLoginCheck = now;
    
    try {
      await this.ensureLogin();
    } catch (error) {
      console.log('⚠️ 后台切换时登录检查失败:', error.message);
    }
  },
  
  // 🛡️ 确保登录态有效（供页面调用）
  async ensureLogin(showLoading = true) {
    if (showLoading) {
      wx.showLoading({ title: '验证登录中...', mask: true });
    }
    
    try {
      const userInfo = await safeWxLogin();
      this.globalData.userInfo = userInfo;
      
      if (showLoading) {
        wx.hideLoading();
      }
      
      return userInfo;
      
    } catch (error) {
      if (showLoading) {
        wx.hideLoading();
      }
      
      this.handleLoginError(error, showLoading);
      throw error;
    }
  },
  
  // 🚨 统一的登录错误处理
  handleLoginError(error, showToast = true) {
    console.error('登录错误详情:', error);
    
    if (!showToast) return;
    
    // 根据错误类型显示不同提示
    let title = '登录失败';
    let icon = 'none';
    let duration = 3000;
    
    if (error.message.includes('网络')) {
      title = '网络异常，请检查网络连接';
      icon = 'none';
    } else if (error.message.includes('频繁')) {
      title = '请求过于频繁，请稍后重试';
      icon = 'none';
      duration = 5000;
    } else if (error.message.includes('风险')) {
      title = '账号存在风险，请联系客服';
      icon = 'none';
      duration = 5000;
    } else if (error.message.includes('权限')) {
      title = '请检查小程序权限设置';
      icon = 'none';
    }
    
    wx.showToast({ title, icon, duration });
  },
  
  // 🎉 登录成功事件处理
  triggerLoginSuccess(userInfo) {
    // 可以在这里添加登录成功后的业务逻辑
    // 例如：上报用户行为、初始化用户数据等
    
    // 发送自定义事件通知页面
    if (typeof this.onLoginSuccess === 'function') {
      this.onLoginSuccess(userInfo);
    }
  },
  
  // 🔄 手动重新登录（供页面调用）
  async forceLogin() {
    // 清除本地缓存
    wx.removeStorageSync('openid');
    wx.removeStorageSync('unionid');
    wx.removeStorageSync('loginTime');
    
    // 重新登录
    return this.ensureLogin(true);
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

  globalData: {
    userInfo: null,
    lastLoginCheck: 0
  }
});

// 🎯 页面中使用登录态（完整示例）
// pages/index/index.js
Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    loginLoading: false
  },
  
  onLoad() {
    console.log('📄 页面加载，检查登录态');
    this.initPageLogin();
  },
  
  onShow() {
    // 页面显示时检查登录态变化
    this.checkLoginChange();
  },
  
  // 🔄 页面初始化登录检查
  async initPageLogin() {
    try {
      // 先检查全局登录状态
      const app = getApp();
      if (app.globalData.userInfo && app.globalData.userInfo.openid) {
        this.setData({
          userInfo: app.globalData.userInfo,
          isLoggedIn: true
        });
        console.log('✅ 使用全局登录信息');
        return;
      }
      
      // 确保登录态有效
      await this.ensureLogin();
      
    } catch (error) {
      console.error('页面登录初始化失败:', error.message);
      this.handlePageLoginError(error);
    }
  },
  
  // 🛡️ 确保页面登录态
  async ensureLogin(showLoading = false) {
    if (showLoading) {
      this.setData({ loginLoading: true });
    }
    
    try {
      const app = getApp();
      const userInfo = await app.ensureLogin(showLoading);
      
      this.setData({
        userInfo,
        isLoggedIn: true,
        loginLoading: false
      });
      
      console.log('✅ 页面登录态确认有效');
      return userInfo;
      
    } catch (error) {
      this.setData({
        userInfo: null,
        isLoggedIn: false,
        loginLoading: false
      });
      
      throw error;
    }
  },
  
  // 🔍 检查登录态变化
  checkLoginChange() {
    const app = getApp();
    const globalUserInfo = app.globalData.userInfo;
    const currentUserInfo = this.data.userInfo;
    
    // 检查登录状态是否发生变化
    if (globalUserInfo && globalUserInfo.openid !== (currentUserInfo && currentUserInfo.openid)) {
      console.log('🔄 检测到登录态变化，更新页面状态');
      this.setData({
        userInfo: globalUserInfo,
        isLoggedIn: true
      });
    } else if (!globalUserInfo && currentUserInfo) {
      console.log('⚠️ 检测到登录态失效，清除页面状态');
      this.setData({
        userInfo: null,
        isLoggedIn: false
      });
    }
  },
  
  // 🚨 页面登录错误处理
  handlePageLoginError(error) {
    console.error('页面登录错误:', error.message);
    
    // 显示错误提示
    wx.showModal({
      title: '登录提示',
      content: error.message || '登录失败，请重试',
      showCancel: true,
      cancelText: '稍后再试',
      confirmText: '重新登录',
      success: (res) => {
        if (res.confirm) {
          this.handleRetryLogin();
        }
      }
    });
  },
  
  // 🔄 重试登录
  async handleRetryLogin() {
    try {
      await this.ensureLogin(true);
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    } catch (error) {
      this.handlePageLoginError(error);
    }
  },
  
  // 🎯 需要登录的业务操作示例
  async doSomethingNeedLogin() {
    try {
      // 确保登录态有效
      await this.ensureLogin();
      
      // 执行需要登录的业务逻辑
      const { apiRequest, API_CONFIG } = require('../../utils/api');
      
      const result = await apiRequest('/api/some-business-api', {
        method: 'POST',
        data: {
          openid: this.data.userInfo.openid,
          // 其他业务参数
        }
      });
      
      console.log('✅ 业务操作成功:', result.data);
      
    } catch (error) {
      console.error('❌ 业务操作失败:', error.message);
      
      if (error.message.includes('登录')) {
        this.handlePageLoginError(error);
      } else {
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        });
      }
    }
  },
  
  // 📱 用户手动登录按钮
  onLoginTap() {
    this.handleRetryLogin();
  },
  
  // 🚪 用户登出
  async onLogoutTap() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          // 清除登录信息
          const app = getApp();
          app.globalData.userInfo = null;
          
          wx.removeStorageSync('openid');
          wx.removeStorageSync('unionid');
          wx.removeStorageSync('loginTime');
          
          this.setData({
            userInfo: null,
            isLoggedIn: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});

// 🎯 页面WXML模板示例
/*
<view class="container">
  <!-- 登录状态显示 -->
  <view wx:if="{{isLoggedIn}}" class="user-info">
    <text>✅ 已登录</text>
    <text>OpenID: {{userInfo.openid}}</text>
    <button bindtap="onLogoutTap" size="mini">退出登录</button>
  </view>
  
  <!-- 未登录状态 -->
  <view wx:else class="login-prompt">
    <text>⚠️ 未登录</text>
    <button bindtap="onLoginTap" loading="{{loginLoading}}" disabled="{{loginLoading}}">
      {{loginLoading ? '登录中...' : '立即登录'}}
    </button>
  </view>
  
  <!-- 需要登录的功能按钮 -->
  <button bindtap="doSomethingNeedLogin" disabled="{{!isLoggedIn}}">
    执行需要登录的操作
  </button>
</view>
*/
```

#### 3. 获取微信Access Token（智能缓存）
```javascript
// 获取微信访问令牌（服务器自动处理缓存和刷新）
apiRequest(API_CONFIG.ENDPOINTS.TOKEN)
.then(res => {
  if (res.data.success) {
    const { access_token, expires_in, from_cache } = res.data.data;
    console.log('Token获取成功:', access_token.substring(0, 20) + '***');
    console.log('剩余有效时间:', expires_in, '秒');
    console.log('来源:', from_cache ? '服务器缓存' : '微信API新获取');
    
    // ⚠️ 注意：前端通常不需要存储access_token
    // 因为内容安全检测等接口会自动获取最新的token
    // 如果确实需要存储，建议存储到全局变量而非本地存储
    getApp().globalData.access_token = access_token;
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
- **URL**: `GET /api/auth/token`
- **功能**: 获取微信小程序access_token
- **缓存机制**: ⚡ **智能缓存** - 2小时有效期，提前5分钟自动刷新
- **调用频率**: 微信官方限制每日2000次，本服务已实现缓存优化
- **返回**: access_token和过期时间

#### 🔄 缓存策略详情
- **缓存时长**: Access Token有效期2小时（7200秒）
- **提前刷新**: 提前5分钟（300秒）自动获取新token
- **智能判断**: 服务器自动判断是否需要刷新，前端无需关心
- **成本优化**: 大幅减少对微信API的调用次数，避免频率限制

#### 请求示例
```javascript
// 获取Access Token（服务器会自动处理缓存）
apiRequest(API_CONFIG.ENDPOINTS.TOKEN)
.then(res => {
  if (res.data.success) {
    const { access_token, expires_in, from_cache } = res.data.data;
    console.log('Token获取成功:', access_token.substring(0, 20) + '***');
    console.log('剩余有效时间:', expires_in, '秒');
    console.log('来源:', from_cache ? '缓存' : '新获取');
    
    // 注意：前端通常不需要存储access_token
    // 内容安全检测等接口会自动获取最新token
  }
})
.catch(err => {
  console.error('Token获取失败:', err);
});
```

#### 返回参数
```json
{
  "success": true,
  "data": {
    "access_token": "微信访问令牌",
    "expires_in": 7200,
    "from_cache": true
  }
}
```

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

# 3. 获取Access Token（智能缓存）
curl https://backend-abhs.zzoutuo.com/api/auth/token

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