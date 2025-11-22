import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePassword } from '../utils/passwordValidator.js';

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  avatar?: string;
  addresses: IAddress[];
  defaultAddress?: string;
  wishlist: mongoose.Types.ObjectId[];
  paymentMethods?: IPaymentMethod[];
  isActive: boolean;
  accountStatus?: 'active' | 'suspended' | 'deleted';
  deletedAt?: Date;
  deletionReason?: string;
  lastLoginAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  googleId?: string;
  facebookId?: string;
  loginAttempts?: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
  incLoginAttempts(): Promise<IUser>;
  resetLoginAttempts(): Promise<IUser>;
  isLocked: boolean;
}

export interface IAddress {
  _id?: string;
  type: 'home' | 'work' | 'other';
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile?: string;
  isDefault: boolean;
}

export interface IPaymentMethod {
  _id?: string;
  type: 'card' | 'upi' | 'netbanking';
  card?: {
    last4: string;
    brand: string;
    cardHolder: string;
    expiryMonth: number;
    expiryYear: number;
  };
  upi?: {
    vpa: string;
  };
  netbanking?: {
    bank: string;
  };
  isDefault: boolean;
  addedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    default: 'India',
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const paymentMethodSchema = new Schema<IPaymentMethod>({
  type: {
    type: String,
    enum: ['card', 'upi', 'netbanking'],
    required: true
  },
  card: {
    last4: String,
    brand: String,
    cardHolder: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  upi: {
    vpa: String
  },
  netbanking: {
    bank: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 8,
    select: false
  },
  mobile: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String
  },
  addresses: [addressSchema],
  defaultAddress: {
    type: String
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  paymentMethods: [paymentMethodSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  deletedAt: {
    type: Date
  },
  deletionReason: {
    type: String
  },
  lastLoginAt: {
    type: Date
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  googleId: String,
  facebookId: String,
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Validate password complexity and hash before saving
userSchema.pre('save', async function(next) {
  // Skip validation if password hasn't been modified
  if (!this.isModified('password')) return next();

  // Skip validation for social login users (no password)
  if (!this.password) return next();

  try {
    // Validate password complexity with user information to prevent using personal data
    const userInfo = [this.firstName, this.lastName, this.email.split('@')[0]];
    const validationResult = validatePassword(this.password, {}, userInfo);

    if (!validationResult.isValid) {
      const error = new Error(validationResult.errors.join('. '));
      error.name = 'ValidationError';
      return next(error);
    }

    // Hash password only after validation passes
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Create email verification token
userSchema.methods.createEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Constants for account lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Virtual property to check if account is locked
userSchema.virtual('isLocked').get(function(this: IUser) {
  // Check if lockUntil exists and is in the future
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function(this: IUser) {
  // If lock has expired, restart count at 1
  if (this.lockUntil && this.lockUntil.getTime() < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Otherwise, increment attempts
  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock account if max attempts reached and not already locked
  const attemptsCount = (this.loginAttempts || 0) + 1;
  if (attemptsCount >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function(this: IUser) {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

export default mongoose.model<IUser>('User', userSchema);