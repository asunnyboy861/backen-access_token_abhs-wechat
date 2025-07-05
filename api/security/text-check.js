// 微信小程序文本内容安全检测API (msgSecCheck 2.0)
const axios = require('axios');

// 缓存Access Token
let cachedToken = null;
let tokenExpireTime = 0;

// 获取Access Token
async function getAccessToken() {
  // 检查缓存是否有效（提前5分钟刷新）
  const now = Date.now();
  if (cachedToken && now < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_APP_SECRET
      },
      timeout: 10000
    });

    if (response.data.access_token) {
      cachedToken = response.data.access_token;
      // expires_in 单位是秒，转换为毫秒
      tokenExpireTime = now + (response.data.expires_in * 1000);
      return cachedToken;
    } else {
      throw new Error(`获取Access Token失败: ${response.data.errmsg || '未知错误'}`);
    }
  } catch (error) {
    console.error('获取Access Token错误:', error.message);
    throw new Error('获取Access Token失败');
  }
}

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '只支持POST请求',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // 验证请求参数
    const { content, openid, scene = 2, title, nickname, signature } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: '缺少content参数或参数类型错误',
        code: 'INVALID_PARAMS'
      });
    }

    if (!openid || typeof openid !== 'string') {
      return res.status(400).json({
        success: false,
        error: '缺少openid参数，msgSecCheck 2.0版本必需此参数',
        code: 'MISSING_OPENID'
      });
    }

    if (content.length > 2500) {
      return res.status(400).json({
        success: false,
        error: '文本内容超过2500字符限制',
        code: 'CONTENT_TOO_LONG'
      });
    }

    // 验证scene参数
    if (![1, 2, 3, 4].includes(scene)) {
      return res.status(400).json({
        success: false,
        error: 'scene参数错误，支持值：1(资料)、2(评论)、3(论坛)、4(社交日志)',
        code: 'INVALID_SCENE'
      });
    }

    // 获取Access Token
    const accessToken = await getAccessToken();

    // 构建请求体（按照msgSecCheck 2.0规范）
    const requestBody = {
      version: 2,
      openid: openid,
      scene: scene,
      content: content
    };

    // 添加可选参数
    if (title) requestBody.title = title;
    if (nickname) requestBody.nickname = nickname;
    if (signature && scene === 1) requestBody.signature = signature; // signature仅在资料场景有效

    // 调用微信内容安全检测API (msgSecCheck 2.0)
    const checkResponse = await axios.post(
      `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const result = checkResponse.data;

    // 处理微信API返回结果（msgSecCheck 2.0格式）
    if (result.errcode === 0) {
      // 检测成功，分析结果
      const { result: checkResult, detail, trace_id } = result;
      
      return res.status(200).json({
        success: true,
        safe: checkResult.suggest === 'pass',
        suggest: checkResult.suggest, // pass, review, risky
        label: checkResult.label,
        message: getSuggestMessage(checkResult.suggest),
        data: {
          errcode: result.errcode,
          errmsg: result.errmsg || 'ok',
          trace_id: trace_id,
          result: checkResult,
          detail: detail
        }
      });
    } else {
      // 处理各种错误码
      const errorMessage = getErrorMessage(result.errcode, result.errmsg);
      console.error('微信API返回错误:', result);
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        code: 'WECHAT_API_ERROR',
        data: {
          errcode: result.errcode,
          errmsg: result.errmsg
        }
      });
    }

  } catch (error) {
    console.error('文本安全检测错误:', error.message);
    
    // 处理不同类型的错误
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: '请求超时，请稍后重试',
        code: 'TIMEOUT'
      });
    }
    
    if (error.response) {
      return res.status(500).json({
        success: false,
        error: `微信API请求失败: ${error.response.status}`,
        code: 'API_REQUEST_FAILED'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
};

// 获取建议信息
function getSuggestMessage(suggest) {
  switch (suggest) {
    case 'pass':
      return '内容安全，可以发布';
    case 'review':
      return '内容需要人工审核';
    case 'risky':
      return '内容包含违规信息，不建议发布';
    default:
      return '未知状态';
  }
}

// 获取错误信息
function getErrorMessage(errcode, errmsg) {
  const errorMap = {
    '-1': '系统繁忙，请稍后重试',
    '40001': 'access_token无效或已过期',
    '40003': 'openid无效',
    '40129': '场景值错误（支持1-4）',
    '43104': 'appid与openid不匹配',
    '43002': '请使用POST方法调用',
    '44002': '请求参数为空',
    '47001': '参数格式错误',
    '61010': '用户访问记录超时（用户需在近两小时内访问过小程序）',
    '44991': '超出接口每分钟调用限制',
    '45009': '超出接口每日调用限制'
  };
  
  return errorMap[errcode] || `微信API错误: ${errmsg || '未知错误'}`;
}