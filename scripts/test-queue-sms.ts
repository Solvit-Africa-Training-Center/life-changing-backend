import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SMSNotificationService } from '../src/modules/notifications/services/sms-notification.service';

async function testQueueSMS() {
  console.log('📨 Testing SMS Queue Flow...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const smsNotificationService = app.get(SMSNotificationService);
  
  // Test verification SMS via queue
  console.log('1. Queueing verification SMS:');
  const testPhone = '+250786287625';
  const testToken = '123456';
  
  try {
    await smsNotificationService.sendSMSVerification(testPhone, testToken);
    console.log(`   ✅ SMS verification queued for ${testPhone}`);
    console.log(`   Token: ${testToken}`);
    console.log('   ⏳ Queue will process in background');
    console.log('   👀 Check simulator in 5-10 seconds');
  } catch (error) {
    console.log(`   ❌ Failed to queue: ${error.message}`);
  }
  
  // Wait a bit for queue processing
  console.log('\n2. Waiting for queue processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n3. Check logs for:');
  console.log('   - "Processing job" (queue started)');
  console.log('   - "Verification SMS sent" (success)');
  console.log('   - OR error messages');
  
  await app.close();
  console.log('\n✅ Queue SMS test completed!');
}

testQueueSMS().catch(console.error);