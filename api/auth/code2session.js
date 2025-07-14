/**
 * 微信小程序 code2Session 接口
 * 路径: /api/auth/code2session
 * 方法: POST
 * 功能: 登录凭证校验，将临时登录凭证code换取用户唯一标识openid和会话密钥session_key
 * 官方文档: https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
 */

const axios = require('axios');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: '只支持 POST 请求'
    });
  }

  try {
    const { code } = req.body;

    // 验证必需参数
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: '缺少必需参数: code'
      });
    }

    // 验证环境变量
    const { WECHAT_APP_ID, WECHAT_APP_SECRET } = process.env;
    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Missing configuration',
        message: '缺少微信小程序配置信息'
      });
    }

    // 调用微信 code2Session 接口
    const sessionUrl = 'https://api.weixin.qq.com/sns/jscode2session';
    const response = await axios.get(sessionUrl, {
      params: {
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      },
      timeout: 10000
    });

    const { openid, session_key, unionid, errcode, errmsg } = response.data;

    // 处理微信API错误
    if (errcode) {
      // 根据错误码返回友好的错误信息
      let friendlyMessage = '登录失败';
      switch (errcode) {
        case 40029:
          friendlyMessage = '登录凭证无效，请重新登录';
          break;
        case 45011:
          friendlyMessage = 'API调用太频繁，请稍后再试';
          break;
        case 40226:
          friendlyMessage = '高风险等级用户，登录被拦截';
          break;
        case -1:
          friendlyMessage = '系统繁忙，请稍后再试';
          break;
        default:
          friendlyMessage = errmsg || '登录失败';
      }

      return res.status(400).json({
        success: false,
        error: 'WeChat API Error',
        errcode,
        errmsg,
        message: friendlyMessage
      });
    }

    // 验证返回数据
    if (!openid) {
      return res.status(500).json({
        success: false,
        error: 'Invalid response',
        message: '微信接口返回数据异常'
      });
    }

    // 构建返回数据（严格按照微信官方文档规范）
    const responseData = {
      openid,
      // 注意：session_key 不返回给前端，仅在后端使用以确保安全性
      // 如需使用session_key进行数据解密，应在后端处理
    };

    // 如果有unionid则包含（仅在小程序绑定到微信开放平台时返回）
    if (unionid) {
      responseData.unionid = unionid;
    }

    // 记录登录日志（生产环境建议使用专业日志系统）
    console.log(`[LOGIN] 用户登录成功: openid=${openid.substring(0,8)}***, unionid=${unionid ? unionid.substring(0,8) + '***' : 'N/A'}`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: '登录成功'
    });

  } catch (error) {
    console.error('code2Session 接口错误:', error.message);
    
    // 处理网络错误
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({
        success: false,
        error: 'Network timeout',
        message: '网络超时，请稍后重试'
      });
    }

    // 处理其他错误
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || '服务器内部错误'
    });
  }
};