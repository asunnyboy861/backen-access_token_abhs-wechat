/**
 * API 健康检查接口
 * 路径: /api/health
 * 方法: GET
 */

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    
    const configStatus = {
      app_id_configured: !!WECHAT_APP_ID,
      app_secret_configured: !!WECHAT_APP_SECRET
    };

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        config: configStatus,
        endpoints: {
          health_check: '/api/health',
          get_token: '/api/auth/token',
          text_security_check: '/api/security/text-check'
        }
      },
      message: '微信小程序内容安全API服务运行正常'
    });

  } catch (error) {
    console.error('健康检查错误:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '服务健康检查失败'
    });
  }
};