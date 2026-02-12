// src/modules/notifications/services/sms.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<boolean>;
  sendBulkSMS(phones: string[], message: string): Promise<boolean>;
  isAvailable(): boolean;
}

@Injectable()
export class SMSService implements OnModuleInit {
  private providers: SMSProvider[] = [];
  private readonly logger = new Logger(SMSService.name);
  private initialized = false;

  // Africa's Talking HTTP Configuration
  private readonly baseUrl = 'https://api.sandbox.africastalking.com/version1/messaging';
  private apiKey: string;
  private username: string;
  private senderId: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeProviders();
  }

  private async initializeProviders() {
    if (this.initialized) return;
    
    this.logger.log('🚀 Initializing SMS providers...');
    
    // Load configuration
    this.apiKey = this.configService.getOrThrow<string>('config.africasTalking.apiKey');
    this.username = this.configService.getOrThrow<string>('config.africasTalking.username');
    this.senderId = this.configService.get<string>('config.africasTalking.senderId') || 'LCEO';

    // Try to initialize Africa's Talking HTTP provider
    const africastalkingProvider = this.initializeAfricasTalkingHttp();
    if (africastalkingProvider) {
      this.providers.push(africastalkingProvider);
      this.logger.log('✅ Africa\'s Talking HTTP provider initialized');
    } else {
      this.logger.warn('❌ Africa\'s Talking HTTP provider failed to initialize');
    }

    if (this.providers.length === 0) {
      this.logger.warn('⚠️ No SMS providers available. Using mock provider.');
      this.providers.push(this.createMockProvider());
    }
    
    this.initialized = true;
  }

  /**
   * Africa's Talking HTTP Provider using Axios
   * Direct API calls exactly like your working Postman request
   */
  private initializeAfricasTalkingHttp(): SMSProvider | null {
    try {
      // Debug configuration
      console.log('\n🔍🔍🔍 AFRICA\'S TALKING HTTP INITIALIZATION 🔍🔍🔍');
      console.log(`Base URL: ${this.baseUrl}`);
      console.log(`API Key present: ${!!this.apiKey}`);
      console.log(`Username present: ${!!this.username}`);
      console.log(`API Key: ${this.apiKey ? this.apiKey.substring(0, 15) + '...' : 'MISSING'}`);
      console.log(`Username: ${this.username || 'MISSING'}`);
      console.log(`Sender ID: ${this.senderId}`);
      console.log('🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍\n');

      if (!this.apiKey || !this.username) {
        this.logger.error('❌ Africa\'s Talking credentials missing! Check .env file');
        return null;
      }

      return {
        sendSMS: async (phone: string, message: string) => {
          try {
            
    
    this.logger.log(`📤 Sending SMS via HTTP to ${phone}`);
    this.logger.debug(`Message: ${message.substring(0, 50)}...`);

            // Prepare request body exactly like Postman
            const requestBody = new URLSearchParams({
              username: this.username,
              to: phone,
              message: message,
            }).toString();

            // Make the HTTP request
            const response = await axios({
              method: 'post',
              url: this.baseUrl,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': this.apiKey,
              },
              data: requestBody,
              timeout: 10000, // 10 seconds timeout
            });

            // Log success
            this.logger.log(`✅ SMS sent successfully to ${phone}`);
            
            // Log response for debugging
            if (response.data) {
              this.logger.debug(`Response: ${JSON.stringify(response.data)}`);
              
              // Check if it's sandbox mode
              if (response.data?.SMSMessageData?.Message?.includes('KES 0')) {
                this.logger.warn('⚠️ Sandbox mode - No real SMS sent. Check simulator!');
              }
            }

            return true;
          } catch (error) {
            // Detailed error logging
            this.logger.error(`❌ Failed to send SMS to ${phone}:`);
            
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              this.logger.error(`Status: ${error.response.status}`);
              this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
              this.logger.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
            } else if (error.request) {
              // The request was made but no response was received
              this.logger.error(`No response received: ${error.request}`);
            } else {
              // Something happened in setting up the request that triggered an Error
              this.logger.error(`Request error: ${error.message}`);
            }

            return false;
          }
        },

        sendBulkSMS: async (phones: string[], message: string) => {
          try {
            
    const recipients = phones.join(',');
            
            this.logger.log(`📤 Sending bulk SMS to ${phones.length} numbers`);
            this.logger.debug(`Recipients: ${recipients}`);

            const requestBody = new URLSearchParams({
              username: this.username,
              to: recipients,
              message: message,
            }).toString();

            const response = await axios({
              method: 'post',
              url: this.baseUrl,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': this.apiKey,
              },
              data: requestBody,
              timeout: 15000,
            });

            this.logger.log(`✅ Bulk SMS sent to ${phones.length} numbers`);
            return true;
          } catch (error) {
            this.logger.error(`❌ Failed to send bulk SMS: ${error.message}`);
            return false;
          }
        },

        isAvailable: () => true,
      };
    } catch (error) {
      this.logger.error('❌ Failed to initialize Africa\'s Talking HTTP provider:', error.message);
      return null;
    }
  }

  /**
   * Mock provider for development when no real provider is available
   */
  private createMockProvider(): SMSProvider {
    return {
      sendSMS: async (phone: string, message: string) => {
        this.logger.warn(`[MOCK MODE] SMS to ${phone}: ${message}`);
        this.logger.warn(`📱 Check simulator with test number: +254700000000`);
        return true;
      },
      sendBulkSMS: async (phones: string[], message: string) => {
        this.logger.warn(`[MOCK MODE] Bulk SMS to ${phones.length} numbers: ${message}`);
        return true;
      },
      isAvailable: () => true,
    };
  }

  /**
   * Public method to send a single SMS
   */
  async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initializeProviders();
    }

    if (!phone || !message) {
      this.logger.warn('❌ Cannot send SMS: phone or message is empty');
      return false;
    }

    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          const success = await provider.sendSMS(phone, message);
          if (success) {
            return true;
          }
        } catch (error) {
          this.logger.error(`Provider failed:`, error.message);
        }
      }
    }

    this.logger.error(`❌ All SMS providers failed for ${phone}`);
    return false;
  }

  /**
   * Public method to send bulk SMS
   */
  async sendBulkSMS(phones: string[], message: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initializeProviders();
    }

    if (!phones.length || !message) {
      this.logger.warn('❌ Cannot send bulk SMS: no phones or empty message');
      return false;
    }

    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          const success = await provider.sendBulkSMS(phones, message);
          if (success) {
            return true;
          }
        } catch (error) {
          this.logger.error(`Provider failed for bulk SMS:`, error.message);
        }
      }
    }

    this.logger.error(`❌ All SMS providers failed for bulk SMS`);
    return false;
  }

  /**
   * Check if SMS service is available
   */
  isSMSAvailable(): boolean {
    return this.providers.length > 0 && this.providers.some(p => p.isAvailable());
  }

  /**
   * Get number of active providers
   */
  getActiveProviderCount(): number {
    return this.providers.length;
  }
}

// // src/modules/notifications/services/sms.service.ts
// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

// export interface SMSProvider {
//   sendSMS(phone: string, message: string): Promise<boolean>;
//   sendBulkSMS(phones: string[], message: string): Promise<boolean>;
//   isAvailable(): boolean;
// }

// @Injectable()
// export class SMSService implements OnModuleInit {  // Add OnModuleInit
//   private providers: SMSProvider[] = [];
//   private readonly logger = new Logger(SMSService.name);
//   private initialized = false;

//   constructor(private configService: ConfigService) {}

//   // Use onModuleInit instead of constructor
//   async onModuleInit() {
//     await this.initializeProviders();
//   }

//   private async initializeProviders() {
//     if (this.initialized) return;
    
//     this.logger.log('🚀 Initializing SMS providers...');
    
//     // Try to initialize Africa's Talking
//     const africastalkingProvider = await this.initializeAfricasTalking();
//     if (africastalkingProvider) {
//       this.providers.push(africastalkingProvider);
//       this.logger.log('✅ Africa\'s Talking SMS provider initialized');
//     } else {
//       this.logger.warn('❌ Africa\'s Talking SMS provider failed to initialize');
//     }

//     if (this.providers.length === 0) {
//       this.logger.warn('⚠️ No SMS providers available. Using mock provider.');
//       this.providers.push(this.createMockProvider());
//     }
    
//     this.initialized = true;
//   }

//   private async initializeAfricasTalking(): Promise<SMSProvider | null> {
//     try {
//       const apiKey = this.configService.get<string>('africasTalking.apiKey');
//       const username = this.configService.get<string>('africasTalking.username');
      
//       // DEBUG LOGS
//       console.log('\n🔍🔍🔍 AFRICA\'S TALKING INITIALIZATION 🔍🔍🔍');
//       console.log(`Config path: config.africasTalking.apiKey`);
//       console.log(`API Key present: ${!!apiKey}`);
//       console.log(`Username present: ${!!username}`);
//       console.log(`API Key value: ${apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING'}`);
//       console.log(`Username value: ${username || 'MISSING'}`);
//       console.log('🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍\n');

//       if (!apiKey || !username) {
//         this.logger.error('❌ Africa\'s Talking credentials missing! Check .env file');
//         return null;
//       }

//       // Try to import africastalking
//       let africastalking;
//       try {
//         africastalking = await import('africastalking');
//         this.logger.log('📦 Africa\'s Talking SDK loaded successfully');
//       } catch (e) {
//         this.logger.error('❌ Failed to load africastalking package. Run: npm install africastalking');
//         return null;
//       }

//       // Initialize the client
//       let client;
//       if (typeof africastalking === 'function') {
//         client = africastalking({ apiKey, username });
//       } else if (africastalking.default && typeof africastalking.default === 'function') {
//         client = africastalking.default({ apiKey, username });
//       } else {
//         this.logger.error('❌ Unexpected Africa\'s Talking SDK format');
//         return null;
//       }

//       const smsClient = client.SMS;
//       const senderId = this.configService.get<string>('africasTalking.senderId') || 'LCEO';

//       if (!smsClient) {
//         this.logger.error('❌ Failed to get SMS client');
//         return null;
//       }

//       this.logger.log('✅ Africa\'s Talking client created successfully');

//       return {
//         sendSMS: async (phone: string, message: string) => {
//           try {
//             this.logger.log(`📤 Sending SMS to ${phone}`);
            
//             const response = await smsClient.send({
//               to: phone,
//               message,
//               from: senderId,
//             });

//             this.logger.log(`✅ SMS sent successfully to ${phone}`);
//             this.logger.debug(`Response: ${JSON.stringify(response)}`);
//             return true;
//           } catch (error) {
//             this.logger.error(`❌ Failed to send SMS to ${phone}:`, error.message);
//             if (error.response) {
//               this.logger.error(`API Response:`, error.response.data);
//             }
//             return false;
//           }
//         },
//         sendBulkSMS: async (phones: string[], message: string) => {
//           try {
//             this.logger.log(`📤 Sending bulk SMS to ${phones.length} numbers`);
            
//             const response = await smsClient.send({
//               to: phones,
//               message,
//               from: senderId,
//             });

//             this.logger.log(`✅ Bulk SMS sent to ${phones.length} numbers`);
//             return true;
//           } catch (error) {
//             this.logger.error(`❌ Failed to send bulk SMS:`, error.message);
//             return false;
//           }
//         },
//         isAvailable: () => true,
//       };
//     } catch (error) {
//       this.logger.error('❌ Failed to initialize Africa\'s Talking:', error.message);
//       return null;
//     }
//   }

//   private createMockProvider(): SMSProvider {
//     return {
//       sendSMS: async (phone: string, message: string) => {
//         this.logger.warn(`[MOCK MODE] SMS to ${phone}: ${message}`);
//         return true;
//       },
//       sendBulkSMS: async (phones: string[], message: string) => {
//         this.logger.warn(`[MOCK MODE] Bulk SMS to ${phones.length} numbers: ${message}`);
//         return true;
//       },
//       isAvailable: () => true,
//     };
//   }

//   async sendSMS(phone: string, message: string): Promise<boolean> {
//     if (!this.initialized) {
//       await this.initializeProviders();
//     }

//     if (!phone || !message) {
//       this.logger.warn('❌ Cannot send SMS: phone or message is empty');
//       return false;
//     }

//     for (const provider of this.providers) {
//       if (provider.isAvailable()) {
//         try {
//           const success = await provider.sendSMS(phone, message);
//           if (success) {
//             return true;
//           }
//         } catch (error) {
//           this.logger.error(`Provider failed:`, error.message);
//         }
//       }
//     }

//     this.logger.error(`❌ All SMS providers failed for ${phone}`);
//     return false;
//   }

//   async sendBulkSMS(phones: string[], message: string): Promise<boolean> {
//     if (!this.initialized) {
//       await this.initializeProviders();
//     }

//     if (!phones.length || !message) {
//       this.logger.warn('❌ Cannot send bulk SMS: no phones or empty message');
//       return false;
//     }

//     for (const provider of this.providers) {
//       if (provider.isAvailable()) {
//         try {
//           const success = await provider.sendBulkSMS(phones, message);
//           if (success) {
//             return true;
//           }
//         } catch (error) {
//           this.logger.error(`Provider failed for bulk SMS:`, error.message);
//         }
//       }
//     }

//     this.logger.error(`❌ All SMS providers failed for bulk SMS`);
//     return false;
//   }

//   isSMSAvailable(): boolean {
//     return this.providers.length > 0 && this.providers.some(p => p.isAvailable());
//   }

//   getActiveProviderCount(): number {
//     return this.providers.length;
//   }
// }