export const REGEX = {
  EMAIL: /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&+=!]{6,}$/,
  AMOUNT: /^\d+(\.\d{1,2})?$/,
  DESCRIPTION: /^(?!\s*$).+/,
  NAME: /^[A-Za-z ]{2,50}$/
};

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (trimmed.includes(' ')) return 'Email cannot contain spaces';
  if (!REGEX.EMAIL.test(trimmed)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  const trimmed = password.trim();
  if (!trimmed) return 'Password is required';
  if (trimmed.length < 6) return 'Password must be at least 6 characters';
  if (!REGEX.PASSWORD.test(trimmed)) return 'Password must contain at least 1 letter and 1 number';
  return null;
}

export function validateAmount(amount: string | number): string | null {
  const strAmount = String(amount).trim();
  if (!strAmount) return 'Amount is required';
  if (!REGEX.AMOUNT.test(strAmount)) return 'Please enter a valid amount (max 2 decimal places)';
  const num = parseFloat(strAmount);
  if (isNaN(num) || num <= 0) return 'Amount must be greater than zero';
  return null;
}

export function validateDescription(desc: string): string | null {
  const trimmed = desc.trim();
  if (!trimmed) return 'Description is required';
  if (!REGEX.DESCRIPTION.test(trimmed)) return 'Description cannot be empty';
  return null;
}

export function validateName(name: string, fieldName: string = 'Name'): string | null {
  const trimmed = name.trim();
  if (!trimmed) return `${fieldName} is required`;
  if (!REGEX.NAME.test(trimmed)) return `${fieldName} must be 2-50 characters and contain only letters`;
  return null;
}
