#!/usr/bin/env node

/**
 * Integration Test Script
 * Tüm servislerin birlikte çalıştığını test eder
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const AI_URL = process.env.AI_URL || 'http://localhost:8001';

async function testAIService() {
  console.log('🤖 AI Service testi başlatılıyor...');
  
  try {
    // Health check
    const healthResponse = await axios.get(`${AI_URL}/health`);
    console.log('✅ AI Service health check:', healthResponse.data);
    
    // Sentiment analysis test
    const testMessages = [
      'Bu harika bir gün!',
      'Çok kötü bir deneyim yaşadım.',
      'Normal bir durum, pek bir şey yok.',
      'Mükemmel! Kesinlikle tavsiye ederim.',
      'Berbat, hiç beğenmedim.'
    ];
    
    for (const message of testMessages) {
      const response = await axios.post(`${AI_URL}/analyze`, { message });
      console.log(`📝 "${message}" -> ${response.data.sentiment} (${response.data.score})`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ AI Service testi başarısız:', error.message);
    return false;
  }
}

async function testBackend() {
  console.log('\n🔧 Backend testi başlatılıyor...');
  
  try {
    // Swagger endpoint test
    const swaggerResponse = await axios.get(`${BACKEND_URL}/swagger`);
    console.log('✅ Swagger endpoint erişilebilir');
    
    // User registration test
    const testUser = { nickname: `test_user_${Date.now()}` };
    const registerResponse = await axios.post(`${BACKEND_URL}/register`, testUser);
    console.log('✅ Kullanıcı kaydı başarılı:', registerResponse.data);
    
    // Message sending test
    const testMessage = { nickname: testUser.nickname, text: 'Test mesajı - harika bir gün!' };
    const messageResponse = await axios.post(`${BACKEND_URL}/message`, testMessage);
    console.log('✅ Mesaj gönderimi başarılı:', messageResponse.data);
    
    // Messages list test
    const messagesResponse = await axios.get(`${BACKEND_URL}/messages`);
    console.log('✅ Mesaj listesi alındı, toplam mesaj:', messagesResponse.data.length);
    
    return true;
  } catch (error) {
    console.error('❌ Backend testi başarısız:', error.message);
    return false;
  }
}

async function runIntegrationTest() {
  console.log('🚀 Integration test başlatılıyor...\n');
  
  const aiServiceOk = await testAIService();
  const backendOk = await testBackend();
  
  console.log('\n📊 Test Sonuçları:');
  console.log(`AI Service: ${aiServiceOk ? '✅ Başarılı' : '❌ Başarısız'}`);
  console.log(`Backend: ${backendOk ? '✅ Başarılı' : '❌ Başarısız'}`);
  
  if (aiServiceOk && backendOk) {
    console.log('\n🎉 Tüm testler başarılı! Sistem hazır.');
    process.exit(0);
  } else {
    console.log('\n💥 Bazı testler başarısız. Lütfen logları kontrol edin.');
    process.exit(1);
  }
}

// Test çalıştır
runIntegrationTest().catch(error => {
  console.error('Test çalıştırma hatası:', error);
  process.exit(1);
});
