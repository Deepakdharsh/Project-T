export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const luhnCheck = (val: string) => {
  let checksum = 0; 
  let j = 1; 
  for (let i = val.length - 1; i >= 0; i--) {
    let calc = 0;
    calc = Number(val.charAt(i)) * j;
    if (calc > 9) {
      checksum = checksum + 1;
      calc = calc - 10;
    }
    checksum = checksum + calc;
    if (j === 1) j = 2; else j = 1;
  }
  return (checksum % 10) === 0;
};

// Detect card type from number
export const detectCardType = (number: string): string | null => {
  const cleanNum = number.replace(/\s+/g, '');
  if (!/^\d+$/.test(cleanNum)) return null;
  
  if (/^4/.test(cleanNum)) return 'visa';
  if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
  if (/^3[47]/.test(cleanNum)) return 'amex';
  if (/^6(?:011|5)/.test(cleanNum)) return 'discover';
  return null;
};

// Format card number with spaces
export const formatCardNumber = (value: string): string => {
  const cleanValue = value.replace(/\s+/g, '');
  const cardType = detectCardType(cleanValue);
  
  // Amex has 15 digits, formatted as 4-6-5
  if (cardType === 'amex') {
    return cleanValue
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})\s(\d{6})(\d)/, '$1 $2 $3')
      .substring(0, 17); // Max length for formatted Amex
  }
  
  // Other cards: 4 digits per group
  return cleanValue
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .substring(0, 19); // Max length for formatted card
};

// Format expiry date
export const formatExpiry = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length >= 2) {
    return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
  }
  return cleanValue;
};

// Get CVV length based on card type
export const getCVVLength = (cardNumber: string): number => {
  const cardType = detectCardType(cardNumber);
  return cardType === 'amex' ? 4 : 3;
};

export const validateCard = (number: string) => {
  const cleanNum = number.replace(/\s+/g, '');
  
  if (!cleanNum) return "Card number is required";
  if (!/^\d+$/.test(cleanNum)) return "Card number must contain only digits";
  if (cleanNum.length < 13) return "Card number is too short";
  if (cleanNum.length > 19) return "Card number is too long";
  
  const cardType = detectCardType(cleanNum);
  if (cardType === 'amex' && cleanNum.length !== 15) {
    return "American Express cards must have 15 digits";
  }
  if (cardType && cardType !== 'amex' && cleanNum.length !== 16) {
    return "Card number must have 16 digits";
  }
  
  if (!luhnCheck(cleanNum)) return "Invalid card number (checksum failed)";
  return null;
};

export const validateExpiry = (expiry: string) => {
  if (!expiry) return "Expiry date is required";
  
  const cleanExpiry = expiry.replace(/\D/g, '');
  if (cleanExpiry.length < 4) return "Please enter MM/YY";
  
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    return "Format must be MM/YY (e.g. 12/25)";
  }
  
  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const currentYear = parseInt(now.getFullYear().toString().slice(-2));
  const currentMonth = now.getMonth() + 1;
  
  if (month < 1 || month > 12) {
    return "Month must be between 01 and 12";
  }
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "Card has expired";
  }
  
  // Check if expiry is too far in the future (optional, but good practice)
  if (year > currentYear + 20) {
    return "Expiry date seems invalid";
  }
  
  return null;
};

export const validateCVV = (cvv: string, cardNumber: string) => {
  if (!cvv) return "CVV is required";
  if (!/^\d+$/.test(cvv)) return "CVV must contain only digits";
  
  const expectedLength = getCVVLength(cardNumber);
  if (cvv.length !== expectedLength) {
    return `CVV must be ${expectedLength} digits`;
  }
  
  return null;
};

export const validateCardholderName = (name: string) => {
  if (!name.trim()) return "Cardholder name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (name.trim().length > 50) return "Name is too long";
  
  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(name)) {
    return "Name must contain at least one letter";
  }
  
  return null;
};

