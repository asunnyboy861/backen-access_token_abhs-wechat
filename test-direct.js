/**
 * 直接测试 code2session 接口
 * 模拟 Vercel 环境下的接口调用
 */

const code2sessionHandler = require('./api/auth/code2session');

// 模拟请求和响应对象
function createMockReq(method = 'POST', body = {}) {
  return {
    method,
    body,
    headers: {
      'content-type': 'application/json'
    }
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    
    setHeader(name, value) {
      this.headers[name] = value;
    },
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.body = data;
      console.log(`\n📋 响应状态: ${this.statusCode}`);
      console.log('📋 响应头:', this.headers);
      console.log('📋 响应体:', JSON.stringify(data, null, 2));
      return this;
    },
    
    end() {
      console.log(`\n✅ 请求结束，状态码: ${this.statusCode}`);
      return this;
    }
  };
  
  return res;
}

// 测试函数
async function testCode2Session() {
  console.log('🚀 开始测试 code2session 接口...');
  
  // 测试1: 正常POST请求但缺少code参数
  console.log('\n📝 测试1: 缺少code参数');
  const req1 = createMockReq('POST', {});
  const res1 = createMockRes();
  await code2sessionHandler(req1, res1);
  
  // 测试2: 正常POST请求但code为空
  console.log('\n📝 测试2: code参数为空');
  const req2 = createMockReq('POST', { code: '' });
  const res2 = createMockRes();
  await code2sessionHandler(req2, res2);
  
  // 测试3: 正常POST请求但code无效（会调用微信API）
  console.log('\n📝 测试3: 无效的code（会调用微信API）');
  const req3 = createMockReq('POST', { code: 'invalid_test_code_123' });
  const res3 = createMockRes();
  await code2sessionHandler(req3, res3);
  
  // 测试4: OPTIONS请求
  console.log('\n📝 测试4: OPTIONS请求（CORS预检）');
  const req4 = createMockReq('OPTIONS', {});
  const res4 = createMockRes();
  await code2sessionHandler(req4, res4);
  
  // 测试5: 不支持的请求方法
  console.log('\n📝 测试5: GET请求（不支持的方法）');
  const req5 = createMockReq('GET', {});
  const res5 = createMockRes();
  await code2sessionHandler(req5, res5);
  
  console.log('\n🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  // 设置环境变量（如果没有的话）
  if (!process.env.WECHAT_APP_ID) {
    console.log('⚠️  未检测到环境变量，使用测试值...');
    process.env.WECHAT_APP_ID = 'test_app_id';
    process.env.WECHAT_APP_SECRET = 'test_app_secret';
  }
  
  testCode2Session().catch(error => {
    console.error('❌ 测试过程中出现错误:', error);
  });
}

module.exports = { testCode2Session };