/**
 * Cart API Route - Vardhman Mills Frontend
 * 
 * Handles cart operations: get cart, create cart, clear cart
 * 
 * @route GET /api/cart - Get user's cart
 * @route POST /api/cart - Create new cart
 * @route DELETE /api/cart - Clear cart
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Cart, CartItem, CartSummary } from '@/types/cart.types';
import type { Price } from '@/types/common.types';

// Import types for validation
import type { Product } from '@/types/product.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
const CART_COOKIE_NAME = 'vardhman_cart_id';
const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const CACHE_TIME = 0; // No cache for cart data

// ============================================================================
// TYPES
// ============================================================================

interface CreateCartRequest {
  userId?: string;
  items?: CartItem[];
  currency?: string;
}

interface CartResponse {
  cart: Cart;
  summary: CartSummary;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get cart ID from cookies or header
 */
async function getCartId(request: NextRequest): Promise<string | null> {
  // Check header first (for authenticated requests)
  const headerCartId = request.headers.get('x-cart-id');
  if (headerCartId) return headerCartId;

  // Check cookies
  const cookieStore = await cookies();
  const cartIdCookie = cookieStore.get(CART_COOKIE_NAME);
  return cartIdCookie?.value || null;
}

/**
 * Set cart ID in cookies
 */
async function setCartIdCookie(cartId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear cart ID from cookies
 */
async function clearCartIdCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE_NAME);
}

/**
 * Calculate cart summary
 */
function calculateCartSummary(cart: Cart): CartSummary {
  const subtotalAmount = cart.items.reduce((sum, item) => {
    return sum + item.totalPrice.amount;
  }, 0);

  const discountAmount = cart.appliedCoupons?.reduce((sum, coupon) => {
    return sum + (typeof coupon.discountAmount === 'number' ? coupon.discountAmount : coupon.discountAmount?.amount || 0);
  }, 0) || 0;

  const taxAmount = (subtotalAmount - discountAmount) * 0.18; // 18% GST
  const shippingAmount = subtotalAmount > 2000 ? 0 : 100; // Free shipping above ₹2000
  const totalAmount = subtotalAmount - discountAmount + taxAmount + shippingAmount;

  const createPrice = (amount: number): Price => ({
    amount,
    currency: cart.currency,
    formatted: `₹${amount.toLocaleString('en-IN')}`
  });

  return {
    itemCount: cart.items.length,
    uniqueItemCount: cart.items.length,
    subtotal: createPrice(subtotalAmount),
    taxAmount: createPrice(taxAmount),
    shippingAmount: createPrice(shippingAmount),
    discountAmount: createPrice(discountAmount),
    total: createPrice(totalAmount),
  };
}

/**
 * Generate mock cart data
 */
function getMockCart(cartId: string): Cart {
  const now = new Date().toISOString();
  const emptyPrice: Price = { amount: 0, currency: 'INR', formatted: '₹0' };

  return {
    id: cartId,
    userId: undefined,
    items: [],
    currency: 'INR' as const,
    subtotal: emptyPrice,
    taxAmount: emptyPrice,
    shippingAmount: emptyPrice,
    discountAmount: emptyPrice,
    total: emptyPrice,
    status: 'active',
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
    appliedCoupons: [],
    appliedDiscounts: [],
    shippingAddress: undefined,
  };
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/cart
 * Fetch user's cart
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cartId = await getCartId(request);

    if (!cartId) {
      // No cart exists yet
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'No cart found',
        },
        { status: 200 }
      );
    }

    // Try fetching from backend
    try {
      const response = await fetch(`${BACKEND_URL}/cart/${cartId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('authorization') || '',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const cart: Cart = await response.json();
        const summary = calculateCartSummary(cart);

        return NextResponse.json(
          {
            success: true,
            data: { cart, summary },
            source: 'backend',
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'no-store, must-revalidate',
            },
          }
        );
      }

      if (response.status === 404) {
        // Cart not found in backend, clear cookie
        await clearCartIdCookie();
        return NextResponse.json(
          {
            success: true,
            data: null,
            message: 'Cart not found',
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.warn('Backend unavailable, using mock cart:', error);
    }

    // Fallback to mock data
    const mockCart = getMockCart(cartId);
    const summary = calculateCartSummary(mockCart);

    return NextResponse.json(
      {
        success: true,
        data: { cart: mockCart, summary },
        source: 'mock',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[Cart API Error - GET]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Create new cart
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateCartRequest = await request.json();

    // Try creating in backend
    try {
      const response = await fetch(`${BACKEND_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('authorization') || '',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const cart: Cart = await response.json();
        await setCartIdCookie(cart.id);

        const summary = calculateCartSummary(cart);

        return NextResponse.json(
          {
            success: true,
            data: { cart, summary },
            source: 'backend',
          },
          { status: 201 }
        );
      }
    } catch (error) {
      console.warn('Backend unavailable, creating mock cart:', error);
    }

    // Fallback to mock cart
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockCart: Cart = {
      ...getMockCart(cartId),
      userId: body.userId,
      items: body.items || [],
      currency: (body.currency as 'INR' | 'USD' | 'EUR') || 'INR' as const,
    };

    await setCartIdCookie(cartId);
    const summary = calculateCartSummary(mockCart);

    return NextResponse.json(
      {
        success: true,
        data: { cart: mockCart, summary },
        source: 'mock',
        message: 'Cart created in demo mode',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Cart API Error - POST]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create cart',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Clear cart
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const cartId = await getCartId(request);

    if (!cartId) {
      return NextResponse.json(
        { success: true, message: 'No cart to clear' },
        { status: 200 }
      );
    }

    // Try deleting from backend
    try {
      const response = await fetch(`${BACKEND_URL}/cart/${cartId}`, {
        method: 'DELETE',
        headers: {
          Authorization: request.headers.get('authorization') || '',
        },
      });

      if (response.ok) {
        await clearCartIdCookie();
        return NextResponse.json(
          {
            success: true,
            message: 'Cart cleared successfully',
            source: 'backend',
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.warn('Backend unavailable:', error);
    }

    // Fallback: just clear cookie
    await clearCartIdCookie();
    return NextResponse.json(
      {
        success: true,
        message: 'Cart cleared (demo mode)',
        source: 'mock',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Cart API Error - DELETE]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cart',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/cart
 * Handle CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Cart-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}
