/**
 * Password Validation Utility
 * Enforces strong password requirements for enhanced security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number; // 0-100
}

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minUppercase?: number;
  minLowercase?: number;
  minNumbers?: number;
  minSpecialChars?: number;
  forbidCommonPasswords?: boolean;
  forbidUserInfo?: string[]; // email, name, etc.
}

// Default password requirements
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUppercase: 1,
  minLowercase: 1,
  minNumbers: 1,
  minSpecialChars: 1,
  forbidCommonPasswords: true,
};

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', '123456789', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
  'football', 'admin', 'admin123', 'root', 'toor', 'pass', 'test',
  'guest', 'welcome', 'hello', 'login', 'starwars', 'whatever',
  'Password', 'Password1', 'Password123', 'P@ssw0rd', 'P@ssword',
  'Admin@123', 'Welcome123', 'Qwerty123', 'Abc@1234'
];

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: Partial<PasswordRequirements> = {},
  userInfo: string[] = []
): PasswordValidationResult {
  const reqs: PasswordRequirements = { ...DEFAULT_PASSWORD_REQUIREMENTS, ...requirements };
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < reqs.minLength) {
    errors.push(`Password must be at least ${reqs.minLength} characters long`);
  } else {
    score += Math.min((password.length / reqs.minLength) * 20, 30);
  }

  if (password.length > reqs.maxLength) {
    errors.push(`Password must not exceed ${reqs.maxLength} characters`);
  }

  // Check uppercase letters
  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  if (reqs.requireUppercase && uppercaseCount < (reqs.minUppercase || 1)) {
    errors.push(`Password must contain at least ${reqs.minUppercase || 1} uppercase letter(s)`);
  } else if (uppercaseCount > 0) {
    score += Math.min(uppercaseCount * 5, 15);
  }

  // Check lowercase letters
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  if (reqs.requireLowercase && lowercaseCount < (reqs.minLowercase || 1)) {
    errors.push(`Password must contain at least ${reqs.minLowercase || 1} lowercase letter(s)`);
  } else if (lowercaseCount > 0) {
    score += Math.min(lowercaseCount * 2, 10);
  }

  // Check numbers
  const numberCount = (password.match(/[0-9]/g) || []).length;
  if (reqs.requireNumbers && numberCount < (reqs.minNumbers || 1)) {
    errors.push(`Password must contain at least ${reqs.minNumbers || 1} number(s)`);
  } else if (numberCount > 0) {
    score += Math.min(numberCount * 5, 15);
  }

  // Check special characters
  const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  if (reqs.requireSpecialChars && specialCharCount < (reqs.minSpecialChars || 1)) {
    errors.push(`Password must contain at least ${reqs.minSpecialChars || 1} special character(s) (!@#$%^&* etc.)`);
  } else if (specialCharCount > 0) {
    score += Math.min(specialCharCount * 5, 20);
  }

  // Check for common passwords
  if (reqs.forbidCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common.toLowerCase()))) {
      errors.push('Password is too common. Please choose a more unique password');
      score = Math.max(score - 30, 0);
    }
  }

  // Check for user information in password
  if (reqs.forbidUserInfo && userInfo.length > 0) {
    const lowerPassword = password.toLowerCase();
    for (const info of userInfo) {
      if (info && info.length > 2 && lowerPassword.includes(info.toLowerCase())) {
        errors.push('Password should not contain your personal information');
        score = Math.max(score - 20, 0);
        break;
      }
    }
  }

  // Check for sequential characters
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
  if (hasSequential) {
    score = Math.max(score - 10, 0);
  }

  // Check for repeated characters
  const hasRepeated = /(.)\1{2,}/.test(password);
  if (hasRepeated) {
    score = Math.max(score - 10, 0);
  }

  // Add bonus for length over minimum
  if (password.length > reqs.minLength) {
    score += Math.min((password.length - reqs.minLength) * 2, 10);
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 30) {
    strength = 'weak';
  } else if (score < 60) {
    strength = 'medium';
  } else if (score < 80) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(Math.max(score, 0), 100)
  };
}

/**
 * Generate password strength feedback
 */
export function getPasswordStrengthFeedback(result: PasswordValidationResult): string {
  if (!result.isValid) {
    return result.errors.join('. ');
  }

  switch (result.strength) {
    case 'weak':
      return 'Weak password. Consider adding more characters and variety.';
    case 'medium':
      return 'Medium strength password. Could be stronger with more variety.';
    case 'strong':
      return 'Strong password. Good job!';
    case 'very-strong':
      return 'Very strong password. Excellent!';
    default:
      return '';
  }
}

/**
 * Validate password and throw error if invalid
 */
export function assertPasswordValid(
  password: string,
  requirements?: Partial<PasswordRequirements>,
  userInfo?: string[]
): void {
  const result = validatePassword(password, requirements, userInfo);
  if (!result.isValid) {
    throw new Error(result.errors.join('. '));
  }
}

/**
 * Export for use in validators
 */
export default {
  validate: validatePassword,
  assertValid: assertPasswordValid,
  getFeedback: getPasswordStrengthFeedback,
  DEFAULT_REQUIREMENTS: DEFAULT_PASSWORD_REQUIREMENTS
};
