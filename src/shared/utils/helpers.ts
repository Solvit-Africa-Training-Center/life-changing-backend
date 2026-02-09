import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Helpers {
  constructor(private configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get('config.security.bcryptSaltRounds');
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateRandomToken(length: number = 5): string {

    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    
    // Generate random integer in range
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    
    return otp.toString().padStart(length, '0');
  }

  formatPhoneNumber(phone: string): string {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');

    // Format for Rwanda
    if (digits.startsWith('250')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      return `+250${digits.substring(1)}`;
    } else if (digits.length === 9) {
      return `+250${digits}`;
    }

    return `+${digits}`;
  }

  formatCurrency(amount: number, currency: string = 'RWF'): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  generateTrackingCode(type: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${type.toUpperCase()}-${timestamp}-${random}`.toUpperCase();
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const rwandaRegex = /^(\+250|250|0)[78]\d{8}$/;
    return rwandaRegex.test(phone.replace(/\s/g, ''));
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
