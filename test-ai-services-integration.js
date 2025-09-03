#!/usr/bin/env node
/**
 * 🧪 Phoenix AI Services Integration Tests
 * Test complet du flow : Phoenix API → Luna Hub → IA Services
 * Valide l'architecture Hub-centrique complète
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration des endpoints selon l'environnement
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment ? 'http://localhost' : 'https://phoenix.ai';

const endpoints = {
  phoenixAPI: `${BASE_URL}${isDevelopment ? ':8000' : '/api'}`,
  lunaHub: `${BASE_URL}${isDevelopment ? ':8003' : '/hub'}`
};

console.log('🤖 Starting Phoenix AI Services Integration Tests...\n');
console.log('📍 Target endpoints:', endpoints);
console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('=' .repeat(80));

// Test data samples
const testData = {
  aubeChat: {
    message: "Je suis un jeune diplômé en informatique, j'aimerais trouver ma voie professionnelle",
    persona: "jeune_diplome"
  },
  cvAnalysis: {
    cv_content: `
    Jean Dupont - Développeur Full Stack
    
    EXPÉRIENCE:
    - Développeur Junior, TechCorp (2022-2024)
      * Développement d'applications React et Node.js
      * Gestion de bases de données PostgreSQL
      * Collaboration avec équipe agile (Scrum)
    
    COMPÉTENCES:
    - Languages: JavaScript, Python, SQL
    - Frameworks: React, Node.js, Express
    - Outils: Git, Docker, VS Code
    
    FORMATION:
    - Master Informatique, Université Paris (2020-2022)
    `,
    job_description: `
    Nous recherchons un Développeur Full Stack Senior pour rejoindre notre équipe.
    
    COMPÉTENCES REQUISES:
    - 3+ années d'expérience JavaScript/Node.js
    - Expérience React et TypeScript
    - Connaissance Docker et CI/CD
    - Expérience API REST et GraphQL
    - Maîtrise Git et méthodologies Agile
    
    RESPONSABILITÉS:
    - Développer des applications web modernes
    - Collaborer avec l'équipe produit
    - Participer aux code reviews
    - Mentorer les développeurs juniors
    `,
    job_title: "Développeur Full Stack Senior",
    company_name: "InnovateTech"
  },
  letterGeneration: {
    company_name: "InnovateTech",
    position_title: "Développeur Full Stack Senior", 
    job_description: "Nous recherchons un développeur full stack passionné pour rejoindre notre équipe innovante.",
    cv_content: "Développeur avec 3 ans d'expérience en React/Node.js",
    experience_level: "intermediate",
    letter_tone: "professional",
    key_achievements: [
      "Développé une application utilisée par 10K+ utilisateurs",
      "Réduit le temps de chargement de 40% grâce aux optimisations"
    ]
  }
};

async function testAIEndpoint(name, endpoint, method, data, expectedStatus = 200) {
  const start = performance.now();
  const fullUrl = `${endpoints.lunaHub}${endpoint}`;
  
  try {
    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-integration-tests', // Mock auth for testing
        'User-Agent': 'Phoenix-Integration-Tests/1.0'
      },
      timeout: 30000, // AI calls can take longer
      validateStatus: (status) => status < 500 // Accept 4xx as "working"
    };
    
    if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
      config.data = data;
    }
    
    const response = await axios(config);
    const duration = Math.round(performance.now() - start);
    const status = response.status === expectedStatus ? '✅' : '⚠️';
    
    console.log(`${status} ${name.padEnd(30)} | ${response.status} | ${duration}ms`);
    console.log(`   📊 Response size: ${JSON.stringify(response.data).length} bytes`);
    
    if (response.data && response.data.energy_consumed) {
      console.log(`   ⚡ Energy consumed: ${response.data.energy_consumed}`);
    }
    
    return {
      name,
      endpoint: fullUrl,
      status: response.status,
      duration,
      success: response.status === expectedStatus,
      data: response.data,
      dataSize: JSON.stringify(response.data).length
    };
    
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    let statusCode = 'ERR';
    let message = error.message;
    
    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.detail || error.message;
    }
    
    console.log(`❌ ${name.padEnd(30)} | ${statusCode} | ${duration}ms | ${message}`);
    
    return {
      name,
      endpoint: fullUrl,
      status: statusCode,
      duration,
      success: false,
      error: message
    };
  }
}

async function testPhoenixAPIToHub(name, phoenixEndpoint, expectedStatus = 200) {
  const start = performance.now();
  const fullUrl = `${endpoints.phoenixAPI}${phoenixEndpoint}`;
  
  try {
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });
    
    const duration = Math.round(performance.now() - start);
    const status = response.status === expectedStatus ? '✅' : '⚠️';
    
    console.log(`${status} ${name.padEnd(30)} | ${response.status} | ${duration}ms | Phoenix API Orchestration`);
    
    return {
      name,
      endpoint: fullUrl,
      status: response.status,
      duration,
      success: response.status === expectedStatus,
      data: response.data
    };
    
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    console.log(`❌ ${name.padEnd(30)} | ERR | ${duration}ms | ${error.message}`);
    
    return {
      name,
      endpoint: fullUrl,
      status: 'ERROR',
      duration,
      success: false,
      error: error.message
    };
  }
}

async function runAIServiceTests() {
  console.log('\n🤖 Testing AI Services in Luna Hub...');
  console.log('-'.repeat(80));
  
  const aiTests = [
    // Test direct Luna Hub AI endpoints
    ['Aube AI Chat', '/ai/aube/chat', 'POST', testData.aubeChat],
    ['CV Analysis', '/ai/cv/analyze', 'POST', testData.cvAnalysis],
    ['Letter Generation', '/ai/letters/generate', 'POST', testData.letterGeneration]
  ];
  
  const results = [];
  
  for (const [name, endpoint, method, data] of aiTests) {
    const result = await testAIEndpoint(name, endpoint, method, data);
    results.push(result);
    
    // Delay between AI calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function runPhoenixAPITests() {
  console.log('\n🎯 Testing Phoenix API Orchestration...');
  console.log('-'.repeat(80));
  
  const apiTests = [
    ['Phoenix API Health', '/health'],
    ['Phoenix Aube Root', '/v1/aube/', 405], // Should return 405 Method Not Allowed for GET
    ['Phoenix CV Root', '/v1/cv/', 405],
    ['Phoenix Letters Root', '/v1/letters/', 405]
  ];
  
  const results = [];
  
  for (const [name, endpoint, expectedStatus] of apiTests) {
    const result = await testPhoenixAPIToHub(name, endpoint, expectedStatus || 200);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

async function analyzeResults(aiResults, apiResults) {
  console.log('\n📊 AI Services Analysis');
  console.log('-'.repeat(80));
  
  const allResults = [...aiResults, ...apiResults];
  const successful = allResults.filter(r => r.success).length;
  const total = allResults.length;
  const successRate = Math.round((successful / total) * 100);
  
  console.log(`✅ Successful Tests: ${successful}/${total} (${successRate}%)`);
  console.log(`❌ Failed Tests: ${total - successful}/${total}`);
  
  // AI-specific metrics
  const aiSuccessful = aiResults.filter(r => r.success);
  const avgAIResponseTime = aiSuccessful.length > 0 
    ? Math.round(aiSuccessful.reduce((sum, r) => sum + r.duration, 0) / aiSuccessful.length)
    : 0;
  
  console.log(`⚡ Average AI Response Time: ${avgAIResponseTime}ms`);
  
  // Data size analysis
  const avgDataSize = aiSuccessful.length > 0
    ? Math.round(aiSuccessful.reduce((sum, r) => sum + (r.dataSize || 0), 0) / aiSuccessful.length)
    : 0;
  
  console.log(`📦 Average Response Size: ${avgDataSize} bytes`);
  
  // Architecture validation
  console.log('\n🏗️ Hub-Centric Architecture Validation');
  console.log('-'.repeat(80));
  
  const aubeAI = aiResults.find(r => r.name === 'Aube AI Chat')?.success;
  const cvAI = aiResults.find(r => r.name === 'CV Analysis')?.success;
  const letterAI = aiResults.find(r => r.name === 'Letter Generation')?.success;
  const phoenixAPI = apiResults.find(r => r.name === 'Phoenix API Health')?.success;
  
  console.log(`🌙 Aube AI Service: ${aubeAI ? '✅ Operational' : '❌ Down'}`);
  console.log(`🎯 CV AI Service: ${cvAI ? '✅ Operational' : '❌ Down'}`);
  console.log(`✉️ Letter AI Service: ${letterAI ? '✅ Operational' : '❌ Down'}`);
  console.log(`🚀 Phoenix API Gateway: ${phoenixAPI ? '✅ Operational' : '❌ Down'}`);
  
  // Hub-centric validation
  const hubCentricHealthy = aubeAI && cvAI && letterAI;
  const fullArchitectureHealthy = hubCentricHealthy && phoenixAPI;
  
  console.log(`\n🏆 Hub-Centric AI: ${hubCentricHealthy ? '✅ FULLY OPERATIONAL' : '❌ DEGRADED'}`);
  console.log(`🏆 Full Architecture: ${fullArchitectureHealthy ? '✅ PRODUCTION READY' : '❌ NEEDS ATTENTION'}`);
  
  // Quality metrics
  if (aubeAI || cvAI || letterAI) {
    console.log('\n🎨 AI Quality Validation');
    console.log('-'.repeat(80));
    
    for (const result of aiResults) {
      if (result.success && result.data) {
        const data = result.data;
        console.log(`📈 ${result.name}:`);
        
        if (data.energy_consumed) {
          console.log(`   ⚡ Energy Cost: ${data.energy_consumed} units`);
        }
        
        if (data.overall_compatibility) {
          console.log(`   🎯 Compatibility Score: ${data.overall_compatibility}%`);
        }
        
        if (data.quality_score) {
          console.log(`   🏆 Quality Score: ${data.quality_score}%`);
        }
        
        if (data.word_count) {
          console.log(`   📝 Generated Content: ${data.word_count} words`);
        }
      }
    }
  }
  
  return { successRate, hubCentricHealthy, fullArchitectureHealthy };
}

async function runCompleteTest() {
  try {
    const aiResults = await runAIServiceTests();
    const apiResults = await runPhoenixAPITests();
    
    const { successRate, hubCentricHealthy, fullArchitectureHealthy } = await analyzeResults(aiResults, apiResults);
    
    // Final verdict
    console.log('\n🎯 Integration Test Results');
    console.log('='.repeat(80));
    
    if (fullArchitectureHealthy && successRate >= 80) {
      console.log('🎉 AI SERVICES INTEGRATION: ✅ PASSED');
      console.log('🚀 Hub-centric architecture fully operational!');
      console.log('🤖 All AI services (Aube, CV, Letters) working perfectly!');
      console.log('🏗️ Phoenix API → Luna Hub delegation successful!');
      process.exit(0);
    } else if (hubCentricHealthy && successRate >= 60) {
      console.log('⚠️ AI SERVICES INTEGRATION: 🟡 PARTIAL SUCCESS');
      console.log('🤖 AI services working, but some orchestration issues detected.');
      process.exit(1);
    } else {
      console.log('❌ AI SERVICES INTEGRATION: ❌ FAILED');
      console.log('🚨 Critical AI services or architecture issues detected.');
      process.exit(2);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(3);
  }
}

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the complete test suite
runCompleteTest();