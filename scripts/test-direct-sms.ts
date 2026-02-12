import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SMSService } from '../src/modules/notifications/services/sms.service';

async function testDirectSMS() {
  console.log('📱 Testing Direct SMS Service...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const smsService = app.get(SMSService);
  
  // Test 1: Check initialization
  console.log('1. Service Status:');
  console.log(`   Active providers: ${smsService.getActiveProviderCount()}`);
  console.log(`   SMS Available: ${smsService.isSMSAvailable() ? '✅ Yes' : '❌ No'}`);
  
  // Test 2: Send direct SMS
  console.log('\n2. Sending Direct SMS to simulator:');
  const testPhone = '+250786287625';
  const testMessage = 'Direct test from SMSService - Check simulator!';
  
  try {
    const success = await smsService.sendSMS(testPhone, testMessage);
    
    if (success) {
      console.log(`   ✅ SMS sent to ${testPhone}`);
      console.log('   👀 Check Africa\'s Talking simulator now!');
    } else {
      console.log(`   ❌ SMS failed for ${testPhone}`);
      console.log('   🔍 Check NestJS logs for errors');
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
  
  await app.close();
  console.log('\n✅ Direct SMS test completed!');
}

testDirectSMS().catch(console.error);