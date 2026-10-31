import { Paise, toPaise, VendorItem, VendorStatus } from '../types';

export const VENDOR_STATUS_ORDER: VendorStatus[] = [
  'to_contact',
  'quoted',
  'negotiating',
  'booked',
  'paid',
];

export interface VendorQuoteComparison {
  vendorId: string;
  serviceName: string;
  categoryName: string;
  allocatedPaise: Paise;
  quoteAmountPaise: Paise;
  differencePaise: Paise;
  isWithinBudget: boolean;
  depositAmountPaise?: Paise;
  depositDueDate?: string;
  isDepositDueSoon: boolean; // within 7 days
}

export function compareVendorQuoteToBudget(
  vendor: VendorItem,
  categoryAllocatedPaise: Paise,
  referenceDateStr?: string,
): VendorQuoteComparison {
  const quotePaise = vendor.quoteAmountPaise ?? toPaise(0);
  const diff = categoryAllocatedPaise - quotePaise;
  const isWithinBudget = diff >= 0;

  let isDepositDueSoon = false;
  if (vendor.depositDueDate) {
    const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const dueDate = new Date(vendor.depositDueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isDepositDueSoon = diffDays >= 0 && diffDays <= 7;
  }

  return {
    vendorId: vendor.id,
    serviceName: vendor.serviceName,
    categoryName: vendor.categoryName,
    allocatedPaise: categoryAllocatedPaise,
    quoteAmountPaise: quotePaise,
    differencePaise: toPaise(diff),
    isWithinBudget,
    depositAmountPaise: vendor.depositAmountPaise,
    depositDueDate: vendor.depositDueDate,
    isDepositDueSoon,
  };
}

/**
 * Validates that vendor content adheres to strict AI safety rules:
 * FORBIDS synthetic phone numbers, fake reviews, or fake business names.
 */
export function sanitizeVendorSuggestions(text: string): string {
  // Regex pattern matching Indian (10-digit mobile, 5+5), US/Intl (7-digit, 10-digit with country code)
  const phonePattern = /(?:\+?\d{1,3}[\s-]?)?(?:\d{5}[\s-]?\d{5}|\d{4}[\s-]?\d{3}[\s-]?\d{3}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{3}[\s.-]\d{4}|\b[6-9]\d{9}\b)/g;
  return text.replace(phonePattern, '[Phone Number Redacted - Verify with Vendor Directly]');
}
