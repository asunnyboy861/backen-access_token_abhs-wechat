# 前端集成指南

## 🚀 API 部署信息

**生产环境地址：** `https://backen-access-token-abhs-wechat.vercel.app`

## 📋 API 接口文档

### 1. 获取微信访问令牌

**接口地址：** `GET /api/get-access-token`

**功能：** 获取微信小程序的access_token，用于调用微信API

**请求示例：**
```javascript
// 使用 fetch
const response = await fetch('https://backen-access-token-abhs-wechat.vercel.app/api/get-access-token');
const data = await response.json();
console.log(data);

// 使用 axios
import axios from 'axios';
const { data } = await axios.get('https://backen-access-token-abhs-wechat.vercel.app/api/get-access-token');
console.log(data);
```

**成功响应：**
```json
{
  "success": true,
  "access_token": "your_access_token_here",
  "expires_in": 7200,
  "message": "Access token retrieved successfully"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Failed to get access token"
}
```

### 2. 内容安全检测

**接口地址：** `POST /api/msg-sec-check`

**功能：** 检测文本内容是否违规

**请求参数：**
```json
{
  "content": "要检测的文本内容"
}
```

**请求示例：**
```javascript
// 使用 fetch
const response = await fetch('https://backen-access-token-abhs-wechat.vercel.app/api/msg-sec-check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: '要检测的文本内容'
  })
});
const data = await response.json();

// 使用 axios
const { data } = await axios.post('https://backen-access-token-abhs-wechat.vercel.app/api/msg-sec-check', {
  content: '要检测的文本内容'
});
```

**成功响应：**
```json
{
  "success": true,
  "result": {
    "suggest": "pass",
    "label": 20000
  },
  "message": "Content check completed"
}
```

**响应说明：**
- `suggest`: 建议值
  - `pass`: 内容正常
  - `review`: 需要人工审核
  - `risky`: 内容违规
- `label`: 命中标签枚举值，仅当suggest为risky时返回

## 🔧 前端配置建议

### 1. 环境变量配置

在你的前端项目中创建环境变量文件：

**.env.local** (本地开发)
```env
NEXT_PUBLIC_API_BASE_URL=https://backen-access-token-abhs-wechat.vercel.app
```

**.env.production** (生产环境)
```env
NEXT_PUBLIC_API_BASE_URL=https://backen-access-token-abhs-wechat.vercel.app
```

### 2. API 工具函数

创建一个API工具文件 `utils/api.js`：

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backen-access-token-abhs-wechat.vercel.app';

// 获取访问令牌
export const getAccessToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-access-token`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get access token');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// 内容安全检测
export const checkContentSecurity = async (content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/msg-sec-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Content check failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error checking content security:', error);
    throw error;
  }
};
```

### 3. React Hook 示例

创建自定义Hook `hooks/useWechatAPI.js`：

```javascript
import { useState, useCallback } from 'react';
import { getAccessToken, checkContentSecurity } from '../utils/api';

export const useWechatAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccessToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAccessToken();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkContent = useCallback(async (content) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkContentSecurity(content);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchAccessToken,
    checkContent,
  };
};
```

### 4. 使用示例

```javascript
import React, { useState } from 'react';
import { useWechatAPI } from '../hooks/useWechatAPI';

const ContentChecker = () => {
  const [content, setContent] = useState('');
  const [result, setResult] = useState(null);
  const { loading, error, checkContent } = useWechatAPI();

  const handleCheck = async () => {
    try {
      const result = await checkContent(content);
      setResult(result);
    } catch (err) {
      console.error('检测失败:', err);
    }
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="输入要检测的内容"
      />
      <button onClick={handleCheck} disabled={loading}>
        {loading ? '检测中...' : '检测内容'}
      </button>
      
      {error && <div style={{color: 'red'}}>错误: {error}</div>}
      
      {result && (
        <div>
          <h3>检测结果:</h3>
          <p>建议: {result.result.suggest}</p>
          <p>状态: {result.result.suggest === 'pass' ? '✅ 内容安全' : '❌ 内容可能违规'}</p>
        </div>
      )}
    </div>
  );
};

export default ContentChecker;
```

## 🔒 安全注意事项

1. **CORS配置**：API已配置CORS，支持跨域请求
2. **错误处理**：请务必在前端添加适当的错误处理
3. **频率限制**：请合理控制API调用频率，避免过度请求
4. **敏感信息**：不要在前端代码中暴露任何敏感信息

## 📞 技术支持

如果在集成过程中遇到问题，请检查：

1. 网络连接是否正常
2. API地址是否正确
3. 请求格式是否符合要求
4. 浏览器控制台是否有错误信息

---

**部署状态：** ✅ 已成功部署到 Vercel  
**最后更新：** 2024年1月