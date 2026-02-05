// scripts/test-email.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/modules/notifications/services/email.service';

async function testEmail() {
  console.log('📧 Testing Email Service...');
  console.log('==============================\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);
  
  // Check if email is enabled
  const isEnabled = emailService.isEmailEnabled();
  console.log(`Email service enabled: ${isEnabled ? '✅ YES' : '❌ NO'}`);
  
  if (!isEnabled) {
    console.log('\n⚠️  Email service is not enabled. Check:');
    console.log('1. SENDGRID_API_KEY in .env file');
    console.log('2. API key should start with "SG."');
    console.log('3. SendGrid package is installed (@sendgrid/mail)');
    console.log('\nRunning in simulation mode for development...\n');
  }

  try {
    // Test email - use a default or from environment
    const testEmail = process.env.TEST_EMAIL || 'josephusmupanda48@gmail.com';
    const token = 'TEST123456';
    
    console.log(`Using test email: ${testEmail}\n`);
    
    // Test 1: Send verification email
    console.log('🚀 Test 1: Verification Email');
    console.log('Sending verification email...');
    const success1 = await emailService.sendVerificationEmail(testEmail, token);
    console.log(`Result: ${success1 ? '✅ Sent successfully' : '❌ Failed'}`);
    
    // Test 2: Send password reset email
    console.log('\n🚀 Test 2: Password Reset Email');
    console.log('Sending password reset email...');
    const success2 = await emailService.sendPasswordResetEmail(testEmail, token);
    console.log(`Result: ${success2 ? '✅ Sent successfully' : '❌ Failed'}`);
    
    // Test 3: Send welcome email
    console.log('\n🚀 Test 3: Welcome Email');
    console.log('Sending welcome email...');
    const success3 = await emailService.sendWelcomeEmail(testEmail, 'Test User');
    console.log(`Result: ${success3 ? '✅ Sent successfully' : '❌ Failed'}`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`Verification Email: ${success1 ? '✅' : '❌'}`);
    console.log(`Password Reset Email: ${success2 ? '✅' : '❌'}`);
    console.log(`Welcome Email: ${success3 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await app.close();
    process.exit(0);
  }
}

// Handle promise rejection
testEmail().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});