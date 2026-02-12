// scripts/test-sms-detailed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SMSService } from '../src/modules/notifications/services/sms.service';

async function testSMSDetailed() {
  console.log('🔍 Detailed SMS Test with Africa\'s Talking\n');
  console.log('='.repeat(50));
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['verbose', 'debug', 'log', 'warn', 'error']
  });
  
  const smsService = app.get(SMSService);
  
  console.log('\n📊 Testing with phone: +250786287625');
  console.log('📊 Sandbox API Key: atsk_422eb7261740f152b59f76db3f8a6ea12fda16eeb9fb9af348727772eef3c9ed89e9f930');
  
  const testMessage = 'Detailed test message to check Africa\'s Talking sandbox delivery';
  
  console.log('\n🚀 Sending SMS...');
  console.log('-'.repeat(30));
  
  const success = await smsService.sendSMS('+250786287625', testMessage);
  
  console.log('-'.repeat(30));
  console.log('\n📈 Result:', success ? '✅ SUCCESS' : '❌ FAILED');
  
  if (success) {
    console.log('\n💡 What this means:');
    console.log('1. Africa\'s Talking API accepted the request');
    console.log('2. Sandbox simulated sending the SMS');
    console.log('3. No real SMS was sent (Cost: KES 0)');
    console.log('4. Check Africa\'s Talking dashboard → SMS → Insights/Analytics');
  } else {
    console.log('\n🔍 Troubleshooting steps:');
    console.log('1. Check the error logs above');
    console.log('2. Verify API key is valid');
    console.log('3. Check if phone number needs whitelisting in sandbox');
  }
  
  await app.close();
  console.log('\n' + '='.repeat(50));
}

testSMSDetailed().catch(console.error);