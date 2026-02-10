// src/modules/notifications/services/email-template.service.ts
import { Injectable } from '@nestjs/common';
import { Language } from '../../../config/constants';
import { DonationReceiptData } from '../interfaces/donation-receipt.interface';
import { EmailConfigService } from './email-config.service';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailTemplateService {
  constructor(private configService: EmailConfigService) {}

  generateVerificationEmail(token: string): EmailTemplate {
    const frontendUrl = this.configService.getFrontendUrl();
    const verificationLink = `${frontendUrl}/verify-account?token=${token}`;
    
    return {
      subject: 'Verify Your LCEO Account',
      html: `
        <h1>Verify Your LCEO Account</h1>
        <p>Click the link below to verify your account:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Or use this verification code: ${token}</p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Verify your LCEO account: ${verificationLink}\nOr use this code: ${token}`
    };
  }

  generatePasswordResetEmail(token: string): EmailTemplate {
    const frontendUrl = this.configService.getFrontendUrl();
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    return {
      subject: 'Reset Your LCEO Password',
      html: `
        <h1>Reset Your LCEO Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Or use this reset code: ${token}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your LCEO password: ${resetLink}\nOr use this code: ${token}\nExpires in 1 hour.`
    };
  }

  generateWelcomeEmail(name: string): EmailTemplate {
    return {
      subject: 'Welcome to LCEO!',
      html: `
        <h1>Welcome to LCEO, ${name}!</h1>
        <p>Thank you for joining the Life Changing Economic Opportunities platform.</p>
        <p>We're excited to have you on board and look forward to helping you achieve your goals.</p>
        <p>You can now:</p>
        <ul>
          <li>Access your dashboard</li>
          <li>Update your profile</li>
          <li>Track your progress</li>
          <li>Connect with other beneficiaries</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The LCEO Team</p>
      `,
      text: `Welcome to LCEO, ${name}!\n\nThank you for joining the Life Changing Economic Opportunities platform.\n\nYou can now access your dashboard, update your profile, track your progress, and connect with other beneficiaries.\n\nBest regards,\nThe LCEO Team`
    };
  }

  generateAdminAlertEmail(subject: string, message: string): EmailTemplate {
    return {
      subject: `LCEO Admin Alert: ${subject}`,
      html: `
        <h1>Admin Alert: ${subject}</h1>
        <p>${message}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `Admin Alert: ${subject}\n\n${message}\n\nTimestamp: ${new Date().toISOString()}`
    };
  }

  generateDonationReceiptEmail(data: DonationReceiptData): EmailTemplate {
    const subject = data.language === Language.RW
      ? `Inyemezabuguzi Yawe - ${data.receiptNumber}`
      : `Your Donation Receipt - ${data.receiptNumber}`;

    const { html, text } = this.generateDonationReceiptContent(data);
    
    return { subject, html, text };
  }

  generateRecurringDonationFailedEmail(
    donorName: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): EmailTemplate {
    const subject = language === Language.RW
      ? 'Ibikenewe: Donation Yawe Ntiyashoboye Gusohora'
      : 'Important: Your Recurring Donation Could Not Be Processed';

    const { html, text } = this.generateRecurringDonationFailedContent(
      donorName,
      amount,
      currency,
      frequency,
      language
    );

    return { subject, html, text };
  }

  private generateDonationReceiptContent(data: DonationReceiptData): { html: string; text: string } {
    const isKinyarwanda = data.language === Language.RW;
    const frontendUrl = this.configService.getFrontendUrl();

     // HTML Content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4c9789; color: white; padding: 20px; text-align: center; }
          .receipt-header { text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f7f5; border-left: 4px solid #4c9789; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .receipt-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .receipt-details td { padding: 10px; border-bottom: 1px solid #ddd; }
          .receipt-details td:first-child { font-weight: bold; width: 40%; }
          .amount { font-size: 24px; font-weight: bold; color: #4c9789; margin: 20px 0; }
          .impact-statement { background-color: #e8f4f1; padding: 20px; border-radius: 5px; margin: 30px 0; }
          .thank-you { font-size: 18px; color: #4c9789; margin: 30px 0; }
          .button { background-color: #4c9789; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isKinyarwanda ? 'LCEO' : 'LCEO'}</h1>
            <p>${isKinyarwanda ? 'Inyemezabuguzi Yemewe' : 'Official Donation Receipt'}</p>
          </div>
          
          <div class="receipt-header">
            <h2>${isKinyarwanda ? 'Murakoze Donation Yawe!' : 'Thank You for Your Generous Donation!'}</h2>
            <div class="amount">
              ${data.amount} ${data.currency}
              ${data.localCurrency !== data.currency ? `<br><small>(${data.localAmount} ${data.localCurrency})</small>` : ''}
            </div>
            <p><strong>${isKinyarwanda ? 'Inyemezabuguzi #:' : 'Receipt #:'}</strong> ${data.receiptNumber}</p>
          </div>
          
          <div class="content">
            <table class="receipt-details">
              <tr>
                <td>${isKinyarwanda ? 'Izina rya donor:' : 'Donor Name:'}</td>
                <td>${data.isAnonymous ? (isKinyarwanda ? 'Donor idasobanuye' : 'Anonymous Donor') : data.donorName}</td>
              </tr>
              <tr>
                <td>${isKinyarwanda ? 'Itariki ya donation:' : 'Donation Date:'}</td>
                <td>${data.donationDate}</td>
              </tr>
              <tr>
                <td>${isKinyarwanda ? 'Uburyo bwo kwishyura:' : 'Payment Method:'}</td>
                <td>${data.paymentMethod}</td>
              </tr>
              <tr>
                <td>${isKinyarwanda ? 'Numero y\'ubukwe:' : 'Transaction ID:'}</td>
                <td>${data.transactionId}</td>
              </tr>
            </table>
            
            <p><strong>${isKinyarwanda ? 'Umushinga:' : 'Project:'}</strong> ${data.projectName}</p>
            ${data.donorMessage ? `<p><strong>${isKinyarwanda ? 'Ubutumwa bwawe:' : 'Your Message:'}</strong> "${data.donorMessage}"</p>` : ''}
            
            <div class="impact-statement">
              <h3>${isKinyarwanda ? 'Ingaruka Yawe' : 'Your Impact'}</h3>
              <p>${
                isKinyarwanda 
                  ? 'Donation yawe ishigiye umushinga wa LCEO wo gutanga amahirwe yo kwiga no gukora ubucuruzi ku batishoboye mu Rwanda.'
                  : 'Your donation supports LCEO\'s mission to provide education and entrepreneurship opportunities to underserved communities in Rwanda.'
              }</p>
              <p>${
                isKinyarwanda
                  ? 'Ushobora gukomeza gufatanya natwe:'
                  : 'You can continue to partner with us:'
              }</p>
              <ul>
                <li>${
                  isKinyarwanda
                    ? 'Reba ingaruka ya donation yawe'
                    : 'Track the impact of your donation'
                }</li>
                <li>${
                  isKinyarwanda
                    ? 'Shyiramo muri programu nshya'
                    : 'Enroll in new programs'
                }</li>
                <li>${
                  isKinyarwanda
                    ? 'Sangira ubutumwa bwawe'
                    : 'Share your story'
                }</li>
              </ul>
              <p style="text-align: center; margin: 20px 0;">
                <a href="${frontendUrl}/donor/dashboard" class="button">
                  ${isKinyarwanda ? 'Reba Dashboard Yawe' : 'View Your Dashboard'}
                </a>
              </p>
            </div>
            
            <div class="thank-you">
              <p><strong>${
                isKinyarwanda
                  ? 'Murakoze kuba umwe mu baharanira impinduka!'
                  : 'Thank you for being part of our mission to change lives!'
              }</strong></p>
            </div>
            
            ${
              data.taxReceiptEligible
                ? `<p><strong>${
                    isKinyarwanda
                      ? 'Amakuru ya tax:'
                      : 'Tax Information:'
                  }</strong> ${
                    isKinyarwanda
                      ? 'Iyi nyemezabuguzi ishobora gukoreshwa mu kugabanya impande z\'amafaranga mu mategeko y\'igihugu.'
                      : 'This receipt may be used for tax deduction purposes in accordance with local laws.'
                  }</p>`
                : ''
            }
            
            <p><strong>${
              isKinyarwanda ? 'Amakuru yo kuvugana:' : 'Contact Information:'
            }</strong></p>
            <p>LCEO<br>
            Email: donations@lceo.org<br>
            Phone: +250 788 000 000<br>
            Website: www.lceo.org</p>
          </div>
          
          <div class="footer">
            <p>${
              isKinyarwanda
                ? 'Iyi ni nyemezabuguzi yemewe yo gukoresha mu mategeko y\'amafaranga. Bikore neza muhunike.'
                : 'This is an official receipt for tax purposes. Please retain for your records.'
            }</p>
            <p>${
              isKinyarwanda
                ? 'LCEO ni itsinda ryemewe ridafite inyungu.'
                : 'LCEO is a registered non-profit organization.'
            }</p>
            <p>© ${new Date().getFullYear()} LCEO. ${
              isKinyarwanda ? 'Amahoro yose yaraziguye.' : 'All rights reserved.'
            }</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text Content
    const text = `
      ${isKinyarwanda ? 'INYEMEZABUGUZI YEMEWE' : 'OFFICIAL DONATION RECEIPT'}
      =========================

      LCEO
      ${isKinyarwanda ? 'Inyemezabuguzi #:' : 'Receipt #:'} ${data.receiptNumber}

      ${isKinyarwanda ? 'Murakoze Donation Yawe!' : 'Thank You for Your Generous Donation!'}
      -------------------------------------

      ${isKinyarwanda ? 'Umubare:' : 'Amount:'} ${data.amount} ${data.currency}
      ${data.localCurrency !== data.currency ? `(${data.localAmount} ${data.localCurrency})` : ''}

      ${isKinyarwanda ? 'Ibyatanzwe:' : 'Donation Details:'}
      -----------------
      ${isKinyarwanda ? 'Izina rya donor:' : 'Donor Name:'} ${data.isAnonymous ? (isKinyarwanda ? 'Donor idasobanuye' : 'Anonymous Donor') : data.donorName}
      ${isKinyarwanda ? 'Itariki ya donation:' : 'Donation Date:'} ${data.donationDate}
      ${isKinyarwanda ? 'Uburyo bwo kwishyura:' : 'Payment Method:'} ${data.paymentMethod}
      ${isKinyarwanda ? 'Numero y\'ubukwe:' : 'Transaction ID:'} ${data.transactionId}
      
      ${isKinyarwanda ? 'Umushinga:' : 'Project:'} ${data.projectName}
      
      ${data.donorMessage ? `${isKinyarwanda ? 'Ubutumwa bwawe:' : 'Your Message:'} "${data.donorMessage}"` : ''}

      ${isKinyarwanda ? 'Ingaruka Yawe:' : 'Your Impact:'}
      ------------
      ${
        isKinyarwanda 
          ? 'Donation yawe ishigiye umushinga wa LCEO wo gutanga amahirwe yo kwiga no gukora ubucuruzi ku batishoboye mu Rwanda.'
          : 'Your donation supports LCEO\'s mission to provide education and entrepreneurship opportunities to underserved communities in Rwanda.'
      }

      ${
        isKinyarwanda
          ? 'Ushobora gukomeza gufatanya natwe:'
          : 'You can continue to partner with us:'
      }
      • ${
        isKinyarwanda
          ? 'Reba ingaruka ya donation yawe ku: ${frontendUrl}/donor/dashboard'
          : 'Track the impact of your donation at: ${frontendUrl}/donor/dashboard'
      }
      • ${
        isKinyarwanda
          ? 'Shyiramo muri programu nshya'
          : 'Enroll in new programs'
      }
      • ${
        isKinyarwanda
          ? 'Sangira ubutumwa bwawe'
          : 'Share your story'
      }

      ${
        isKinyarwanda
          ? 'Murakoze kuba umwe mu baharanira impinduka!'
          : 'Thank you for being part of our mission to change lives!'
      }

      ${
        data.taxReceiptEligible
          ? `${
              isKinyarwanda
                ? 'Amakuru ya tax: Iyi nyemezabuguzi ishobora gukoreshwa mu kugabanya impande z\'amafaranga mu mategeko y\'igihugu.'
                : 'Tax Information: This receipt may be used for tax deduction purposes in accordance with local laws.'
            }`
          : ''
      }

      ${
        isKinyarwanda ? 'Amakuru yo kuvugana:' : 'Contact Information:'
      }
      --------------------
      LCEO
      Email: donations@lceo.org
      Phone: +250 788 000 000
      Website: www.lceo.org

      ----------------------------------------
      ${
        isKinyarwanda
          ? 'Iyi ni nyemezabuguzi yemewe yo gukoresha mu mategeko y\'amafaranga. Bikore neza muhunike.'
          : 'This is an official receipt for tax purposes. Please retain for your records.'
      }
      ${
        isKinyarwanda
          ? 'LCEO ni itsinda ryemewe ridafite inyungu.'
          : 'LCEO is a registered non-profit organization.'
      }
      © ${new Date().getFullYear()} LCEO. ${
        isKinyarwanda ? 'Amahoro yose yaraziguye.' : 'All rights reserved.'
      }
    `;
    return {
      html: html,
      text: text
    };
  }

  private generateRecurringDonationFailedContent(
    donorName: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language
  ): { html: string; text: string } {
    // Return your full HTML and text templates here
    // Copy from your existing generateRecurringDonationFailedContent method
    const isKinyarwanda = language === Language.RW;
    const frontendUrl = this.configService.getFrontendUrl();

    // HTML Content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6b6b; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { background-color: #4c9789; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LCEO</h1>
            <p>${isKinyarwanda ? 'Ikibazo mu Kwishyura' : 'Payment Processing Alert'}</p>
          </div>
          
          <div class="content">
            <h2>${
              isKinyarwanda
                ? 'Ikibazo: Donation Yawe Ntiyashoboye Gusohora'
                : 'Important: Your Recurring Donation Could Not Be Processed'
            }</h2>
            <p>${
              isKinyarwanda ? 'Mwaduhaye' : 'Dear'
            } ${donorName},</p>
            <p>${
              isKinyarwanda
                ? 'Ntidushoboye gusohora donation yawe ya buri ${frequency} yoheje ${amount} ${currency}.'
                : 'We were unable to process your recurring ${frequency} donation of ${amount} ${currency}.'
            }</p>
            <p>${
              isKinyarwanda
                ? 'Nyamuneka, hindura amakuru yawe yo kwishyura kugirango ukomeze kudushigikira.'
                : 'Please update your payment information to continue supporting our mission.'
            }</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/donor/dashboard/payment" class="button">
                ${isKinyarwanda ? 'Hindura Amakuru Yo Kwishyura' : 'Update Payment Information'}
              </a>
            </p>
            
            <p>${
              isKinyarwanda
                ? 'Niba ufite ibibazo, nyamuneka hamagara itsinda ry\'abafasha.'
                : 'If you have any questions, please contact our support team.'
            }</p>
            <p>${
              isKinyarwanda
                ? 'Murakoze kudushigikira!'
                : 'Thank you for your continued support!'
            }</p>
          </div>
          
          <div class="footer">
            <p>LCEO | ${
              isKinyarwanda
                ? 'Guhindura Ubuzima Binyuze Mu Kwiga No Gutanga Amahirwe'
                : 'Changing Lives Through Education and Opportunity'
            }</p>
            <p>Contact: support@lceo.org | Phone: +250 788 000 000</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text Content
    const text = `
      LCEO
      ${isKinyarwanda ? 'Ikibazo mu Kwishyura' : 'Payment Processing Alert'}
      
      ${
        isKinyarwanda
          ? 'Ikibazo: Donation Yawe Ntiyashoboye Gusohora'
          : 'Important: Your Recurring Donation Could Not Be Processed'
      }
      
      ${
        isKinyarwanda ? 'Mwaduhaye' : 'Dear'
      } ${donorName},
      
      ${
        isKinyarwanda
          ? 'Ntidushoboye gusohora donation yawe ya buri ${frequency} yoheje ${amount} ${currency}.'
          : 'We were unable to process your recurring ${frequency} donation of ${amount} ${currency}.'
      }
      
      ${
        isKinyarwanda
          ? 'Nyamuneka, hindura amakuru yawe yo kwishyura ku: ${frontendUrl}/donor/dashboard/payment'
          : 'Please update your payment information at: ${frontendUrl}/donor/dashboard/payment'
      }
      
      ${
        isKinyarwanda
          ? 'Niba ufite ibibazo, nyamuneka hamagara itsinda ry\'abafasha.'
          : 'If you have any questions, please contact our support team.'
      }
      
      ${
        isKinyarwanda
          ? 'Murakoze kudushigikira!'
          : 'Thank you for your continued support!'
      }
      
      LCEO
      ${
        isKinyarwanda
          ? 'Guhindura Ubuzima Binyuze Mu Kwiga No Gutanga Amahirwe'
          : 'Changing Lives Through Education and Opportunity'
      }
      Contact: support@lceo.org | Phone: +250 788 000 000
    `;

    return {html, text};
  }
}