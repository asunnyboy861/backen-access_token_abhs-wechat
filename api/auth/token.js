/**
 * 微信小程序 Access Token 获取接口
 * 路径: /api/auth/token
 * 方法: GET
 */

const axios = require('axios');

// Access Token 缓存
let tokenCache = {
  access_token: null,
  expires_time: 0
};

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: '只支持 GET 请求'
    });
  }

  try {
    const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;

    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Missing configuration',
        message: '缺少微信小程序配置信息'
      });
    }

    // 检查缓存是否有效（提前5分钟刷新）
    const now = Date.now();
    if (tokenCache.access_token && now < tokenCache.expires_time - 300000) {
      return res.status(200).json({
        success: true,
        data: {
          access_token: tokenCache.access_token,
          expires_in: Math.floor((tokenCache.expires_time - now) / 1000),
          from_cache: true
        }
      });
    }

    // 获取新的 Access Token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`;
    
    const response = await axios.get(tokenUrl, {
      timeout: 10000
    });

    const { access_token, expires_in, errcode, errmsg } = response.data;

    if (errcode) {
      return res.status(400).json({
        success: false,
        error: 'WeChat API Error',
        errcode,
        errmsg,
        message: '获取 Access Token 失败'
      });
    }

    // 更新缓存
    tokenCache = {
      access_token,
      expires_time: now + (expires_in * 1000)
    };

    res.status(200).json({
      success: true,
      data: {
        access_token,
        expires_in,
        from_cache: false
      }
    });

  } catch (error) {
    console.error('获取 Access Token 错误:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || '服务器内部错误'
    });
  }
};