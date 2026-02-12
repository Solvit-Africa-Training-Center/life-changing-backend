// src/modules/notifications/controllers/sms-test.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SMSService } from './services/sms.service';
import { Helpers } from 'src/shared/utils/helpers';

// DTOs for Swagger documentation
export class SendSMSDto {
  @ApiProperty({ 
    example: '+250780000000', 
    description: 'Phone number in international format (e.g., +254700000000 for Kenya, +250780000000 for Rwanda)',
    required: true 
  })
  phone: string;

  @ApiProperty({ 
    example: 'Test SMS message', 
    description: 'Message content to send',
    required: true 
  })
  message: string;
}

export class SMSStatusResponse {
  @ApiProperty({ example: true, description: 'Service initialization status' })
  serviceInitialized: boolean;

  @ApiProperty({ example: 1, description: 'Number of active SMS providers' })
  providers: number;

  @ApiProperty({ example: true, description: 'SMS service availability' })
  available: boolean;

  @ApiProperty({ example: '2026-02-11T12:52:49.916Z', description: 'Timestamp' })
  timestamp: string;
}

export class SMSResponse {
  @ApiProperty({ example: true, description: 'Success status of SMS send' })
  success: boolean;

  @ApiProperty({ example: '+250780000000', description: 'Formatted phone number' })
  phone: string;

  @ApiProperty({ example: 'Test SMS message', description: 'Sent message' })
  message: string;

  @ApiProperty({ example: '2026-02-11T12:52:49.916Z', description: 'Timestamp' })
  timestamp: string;
}

@ApiTags('SMS Test (Public)')
@Controller('test/sms')
export class SMSTestController {
  constructor(
    private smsService: SMSService,
    private helpers: Helpers
  ) {}

  @Get('status')
  @ApiOperation({ 
    summary: 'Get SMS service status', 
    description: 'Check if SMS service is initialized and available (public endpoint)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'SMS service status retrieved successfully',
    type: SMSStatusResponse 
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatus(): Promise<SMSStatusResponse> {
    const status = {
      serviceInitialized: true,
      providers: this.smsService.getActiveProviderCount(),
      available: this.smsService.isSMSAvailable(),
      timestamp: new Date().toISOString()
    };

    // Log status for debugging
    console.log('📊 SMS Service Status:', status);
    
    return status;
  }

  @Post('direct')
  @ApiOperation({ 
    summary: 'Send direct SMS', 
    description: 'Send an SMS directly to any phone number (uses Africa\'s Talking sandbox - free/test mode)' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'SMS sent successfully',
    type: SMSResponse 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid phone number or message' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Failed to send SMS' 
  })
  async sendDirectSMS(@Body() body: SendSMSDto): Promise<SMSResponse> {
    console.log('\n📨 ===== DIRECT SMS TEST =====');
    console.log('📱 Phone:', body.phone);
    console.log('💬 Message:', body.message);
    console.log('📨 ===========================\n');
    
    const formattedPhone = this.helpers.formatPhoneNumber(body.phone);
    const success = await this.smsService.sendSMS(formattedPhone, body.message);
    
    const response = {
      success,
      phone: formattedPhone,
      message: body.message,
      timestamp: new Date().toISOString()
    };

    if (success) {
      console.log('✅ SMS sent successfully!');
      console.log('📱 Check Africa\'s Talking simulator for the message');
    } else {
      console.log('❌ SMS failed to send');
      console.log('🔍 Check logs for Africa\'s Talking errors');
    }

    return response;
  }

  @Post('test-sandbox')
  @ApiOperation({ 
    summary: 'Send test SMS to sandbox', 
    description: 'Send a test SMS to Africa\'s Talking sandbox test number (+254700000000). This will appear in the simulator.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Test SMS sent successfully',
    type: SMSResponse 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Failed to send test SMS' 
  })
  async testSandbox(): Promise<SMSResponse> {
    const testNumber = '+250780000000'; // Africa's Talking official test number for Rwanda
    const testMessage = `🧪 Test SMS from LCEO - ${new Date().toLocaleString()}`;
    
    console.log('\n🧪 ===== SANDBOX TEST =====');
    console.log('📱 Test Number:', testNumber);
    console.log('💬 Test Message:', testMessage);
    console.log('🧪 ========================\n');
    
    const formattedPhone = this.helpers.formatPhoneNumber(testNumber);
    const success = await this.smsService.sendSMS(formattedPhone, testMessage);
    
    const response = {
      success,
      phone: formattedPhone,
      message: testMessage,
      timestamp: new Date().toISOString()
    };

    if (success) {
      console.log('✅ Test SMS sent to sandbox!');
      console.log('🔗 Open simulator: https://simulator.africastalking.com:1517/');
      console.log('📱 Enter test number: +250780000000');
      console.log('💬 You should see the message appear in the simulator');
    }

    return response;
  }

  @Post('test-rwanda')
  @ApiOperation({ 
    summary: 'Send test SMS to Rwanda sandbox', 
    description: 'Send a test SMS to Rwanda sandbox test number (+250700000000). This will appear in the simulator.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Test SMS sent successfully',
    type: SMSResponse 
  })
  async testRwandaSandbox(): Promise<SMSResponse> {
    const testNumber = '+250700000000'; // Rwanda test number
    const testMessage = `🧪 Rwanda Test SMS from LCEO - ${new Date().toLocaleString()}`;
    
    const formattedPhone = this.helpers.formatPhoneNumber(testNumber);
    const success = await this.smsService.sendSMS(formattedPhone, testMessage);
    
    return {
      success,
      phone: formattedPhone,
      message: testMessage,
      timestamp: new Date().toISOString()
    };
  }

  @Post('verify')
  @ApiOperation({ 
    summary: 'Send verification SMS', 
    description: 'Send a verification code SMS to test phone number' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Verification SMS sent',
    type: SMSResponse 
  })
  async sendVerificationSMS(@Body() body: { phone: string; code?: string }): Promise<SMSResponse> {
    const code = body.code || Math.floor(100000 + Math.random() * 900000).toString();
    const message = `Welcome to LCEO! Your verification code is: ${code}. Use this to verify your account.`;
    
    console.log(`🔐 Verification code generated: ${code}`);
    
    return this.sendDirectSMS({
      phone: body.phone,
      message
    });
  }

  @Post('password-reset')
  @ApiOperation({ 
    summary: 'Send password reset SMS', 
    description: 'Send a password reset code SMS to test phone number' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Password reset SMS sent',
    type: SMSResponse 
  })
  async sendPasswordResetSMS(@Body() body: { phone: string; code?: string }): Promise<SMSResponse> {
    const code = body.code || Math.floor(100000 + Math.random() * 900000).toString();
    const message = `LCEO Password Reset: Use this code to reset your password: ${code}`;
    
    console.log(`🔑 Password reset code generated: ${code}`);
    
    return this.sendDirectSMS({
      phone: body.phone,
      message
    });
  }
}