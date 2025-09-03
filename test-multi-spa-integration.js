#!/usr/bin/env node
/**
 * 🧪 Phoenix Multi-SPA Integration Tests
 * Test complet de l'architecture JAMstack unifiée
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration des endpoints selon l'environnement
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost' : 'https://phoenix.ai';

const endpoints = {
  frontend: `${BASE_URL}${isDevelopment ? ':3000' : ''}`,
  api: `${BASE_URL}${isDevelopment ? ':8000' : '/api'}`,
  hub: `${BASE_URL}${isDevelopment ? ':8003' : '/hub'}`
};

console.log('🚀 Starting Phoenix Multi-SPA Integration Tests...\n');
console.log('📍 Target endpoints:', endpoints);
console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('=' .repeat(60));

async function testEndpoint(name, url, expectedStatus = 200) {
  const start = performance.now();
  
  try {
    const response = await axios.get(url, { 
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept 4xx as "working"
    });
    
    const duration = Math.round(performance.now() - start);
    const status = response.status === expectedStatus ? '✅' : '⚠️';
    
    console.log(`${status} ${name.padEnd(25)} | ${response.status} | ${duration}ms | ${url}`);
    
    return {
      name,
      url,
      status: response.status,
      duration,
      success: response.status === expectedStatus,
      data: response.data
    };
    
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    console.log(`❌ ${name.padEnd(25)} | ERR | ${duration}ms | ${url} | ${error.message}`);
    
    return {
      name,
      url,
      status: 'ERROR',
      duration,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('\n🧪 Testing Service Availability...');
  console.log('-'.repeat(60));
  
  const tests = [
    // Frontend SPA Tests
    ['Frontend Root', `${endpoints.frontend}/`],
    ['Frontend Health', `${endpoints.frontend}/health`],
    ['SPA Route (Aube)', `${endpoints.frontend}/aube`],
    ['SPA Route (CV)', `${endpoints.frontend}/cv`], 
    ['SPA Route (Letters)', `${endpoints.frontend}/letters`],
    
    // API Gateway Tests
    ['API Gateway Root', `${endpoints.api}/`],
    ['API Health Check', `${endpoints.api}/health`],
    ['API Aube Endpoint', `${endpoints.api}/v1/aube/`, 405], // Should return 405 Method Not Allowed for GET
    
    // Luna Hub Tests  
    ['Luna Hub Root', `${endpoints.hub}/`],
    ['Luna Hub Health', `${endpoints.hub}/health`],
    ['Luna Hub Auth', `${endpoints.hub}/auth/me`, 401], // Should return 401 Unauthorized without token
    ['Luna Hub AI Endpoints', `${endpoints.hub}/ai/aube/chat`, 405] // Should return 405 for GET
  ];
  
  const results = [];
  
  for (const [name, url, expectedStatus] of tests) {
    const result = await testEndpoint(name, url, expectedStatus || 200);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Summary');
  console.log('-'.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = Math.round((successful / total) * 100);
  
  console.log(`✅ Successful: ${successful}/${total} (${successRate}%)`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  const avgDuration = Math.round(
    results.filter(r => typeof r.duration === 'number')
           .reduce((sum, r) => sum + r.duration, 0) / results.length
  );
  console.log(`⚡ Average Response Time: ${avgDuration}ms`);
  
  // Architecture validation
  console.log('\n🏗️ Architecture Validation');
  console.log('-'.repeat(60));
  
  const frontendWorking = results.find(r => r.name === 'Frontend Root')?.success;
  const apiWorking = results.find(r => r.name === 'API Gateway Root')?.success;
  const hubWorking = results.find(r => r.name === 'Luna Hub Root')?.success;
  
  console.log(`🚀 Frontend SPA: ${frontendWorking ? '✅ Operational' : '❌ Down'}`);
  console.log(`🎯 API Gateway: ${apiWorking ? '✅ Operational' : '❌ Down'}`);
  console.log(`🌙 Luna Hub: ${hubWorking ? '✅ Operational' : '❌ Down'}`);
  
  const architectureHealthy = frontendWorking && apiWorking && hubWorking;
  console.log(`\n🏆 Multi-SPA Architecture: ${architectureHealthy ? '✅ HEALTHY' : '❌ DEGRADED'}`);
  
  // Success criteria
  if (successRate >= 70 && architectureHealthy) {
    console.log('\n🎉 Integration tests PASSED! Multi-SPA architecture is ready for production.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Integration tests FAILED. Please check service configurations.');
    process.exit(1);
  }
}

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});