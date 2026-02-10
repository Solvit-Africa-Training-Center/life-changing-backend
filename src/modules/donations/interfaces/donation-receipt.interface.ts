import { Language } from "src/config/constants";

export interface DonationReceiptData {
  receiptNumber: string;
  donationDate: string;
  donorName: string;
  amount: number;
  currency: string;
  localAmount: number;
  localCurrency: string;
  paymentMethod: string;
  transactionId: string;
  projectName: string;
  programName: string;
  donorMessage?: string;
  isAnonymous: boolean;
  taxReceiptEligible: boolean;
  language: Language;
};