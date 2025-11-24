/**
 * Global type declarations for Vardhman Mills Frontend
 * Consolidates window interface extensions to avoid type conflicts
 */

// Google Analytics gtag function type
export interface GtagFunction {
  (command: 'config' | 'set' | 'event' | 'js', targetId: string | Date, config?: Record<string, unknown>): void;
  (...args: unknown[]): void;
}

// Google Analytics DataLayer item type
export interface DataLayerItem extends Record<string, unknown> {
  event?: string;
  [key: string]: unknown;
}

// Razorpay types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: unknown) => void;
  method?: {
    netbanking?: boolean;
    card?: boolean;
    upi?: boolean;
    wallet?: boolean;
    emi?: boolean;
  };
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: string, handler: (response: unknown) => void): void;
}

// Window interface extensions
declare global {
  interface Window {
    // Google Analytics gtag - supports multiple call signatures
    gtag?: GtagFunction & ((command: string, targetId: string, config?: Record<string, unknown>) => void);

    // Google Analytics dataLayer - supports both unknown[] and structured items
    dataLayer?: (unknown | DataLayerItem)[];

    // Razorpay constructor
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};
