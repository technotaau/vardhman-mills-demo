/**
 * Product Type Guards and Utility Functions
 * Provides type-safe access to Product fields across the application
 */

import type {
  Product,
  Brand,
  ProductSpecification,
  ProductVariant,
  BackendProductVariant,
  ProductPricing,
} from '@/types/product.types';
import type { MediaGallery, StockInfo, Rating } from '@/types/common.types';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if brand is Brand object (not string)
 */
export function isBrandObject(brand: Brand | string | undefined): brand is Brand {
  return typeof brand === 'object' && brand !== null && 'name' in brand;
}

/**
 * Check if specifications is an array (not Map)
 */
export function isSpecificationArray(
  specs: ProductSpecification[] | Map<string, string> | undefined
): specs is ProductSpecification[] {
  return Array.isArray(specs);
}

/**
 * Check if variant is frontend ProductVariant (not BackendProductVariant)
 */
export function isProductVariant(
  variant: ProductVariant | BackendProductVariant
): variant is ProductVariant {
  return 'productId' in variant && 'name' in variant && 'options' in variant;
}

// ============================================================================
// SAFE ACCESSORS
// ============================================================================

/**
 * Safely get product pricing with fallback
 */
export function getProductPricing(product: Product): ProductPricing | null {
  return product.pricing || null;
}

/**
 * Safely get product media with fallback
 */
export function getProductMedia(product: Product): MediaGallery | null {
  return product.media || null;
}

/**
 * Safely get product inventory with fallback
 */
export function getProductInventory(product: Product): StockInfo | null {
  return product.inventory || null;
}

/**
 * Safely get product rating with fallback
 */
export function getProductRating(product: Product): Rating | null {
  return product.rating || null;
}

/**
 * Safely get brand name (works with both Brand object and string)
 */
export function getBrandName(brand: Brand | string | undefined): string {
  if (!brand) return 'Unknown Brand';
  if (typeof brand === 'string') return brand;
  return brand.name || 'Unknown Brand';
}

/**
 * Safely get first product image
 */
export function getProductImage(product: Product): string {
  // Try direct image property first
  if (product.image) return product.image;

  // Try images array
  if (product.images && product.images.length > 0) return product.images[0];

  // Try media gallery
  if (product.media?.images && product.media.images.length > 0) {
    const firstImage = product.media.images[0];
    return typeof firstImage === 'string' ? firstImage : firstImage.url || '';
  }

  // Fallback to placeholder
  return '/images/placeholder-product.jpg';
}

/**
 * Safely get product stock count
 */
export function getProductStock(product: Product): number {
  // Try direct stock property
  if (typeof product.stock === 'number') return product.stock;

  // Try inventory object
  if (product.inventory?.quantity !== undefined) {
    return product.inventory.quantity;
  }

  // Default to 0
  return 0;
}

/**
 * Check if product is in stock
 */
export function isProductInStock(product: Product): boolean {
  const stock = getProductStock(product);
  return stock > 0;
}

/**
 * Safely get product price
 */
export function getProductPrice(product: Product): number {
  // Try direct price property
  if (typeof product.price === 'number') return product.price;

  // Try pricing object
  if (product.pricing?.basePrice?.amount !== undefined) {
    return product.pricing.basePrice.amount;
  }

  if (product.pricing?.basePrice !== undefined && typeof product.pricing.basePrice === 'number') {
    return product.pricing.basePrice;
  }

  // Default to 0
  return 0;
}

/**
 * Safely get product sale price
 */
export function getProductSalePrice(product: Product): number | null {
  if (product.pricing?.salePrice?.amount !== undefined) {
    return product.pricing.salePrice.amount;
  }

  if (product.pricing?.salePrice !== undefined && typeof product.pricing.salePrice === 'number') {
    return product.pricing.salePrice;
  }

  return null;
}

/**
 * Safely get product compare price
 */
export function getProductComparePrice(product: Product): number | null {
  if (product.pricing?.compareAtPrice?.amount !== undefined) {
    return product.pricing.compareAtPrice.amount;
  }

  if (product.pricing?.compareAtPrice !== undefined && typeof product.pricing.compareAtPrice === 'number') {
    return product.pricing.compareAtPrice;
  }

  return null;
}

/**
 * Check if product is on sale
 */
export function isProductOnSale(product: Product): boolean {
  const salePrice = getProductSalePrice(product);
  const basePrice = getProductPrice(product);

  return salePrice !== null && salePrice > 0 && salePrice < basePrice;
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(product: Product): number {
  const basePrice = getProductPrice(product);
  const salePrice = getProductSalePrice(product);

  if (!salePrice || basePrice === 0) return 0;

  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}

/**
 * Safely get product rating value
 */
export function getProductRatingValue(product: Product): number {
  // Try rating object
  if (product.rating?.average !== undefined) {
    return product.rating.average;
  }

  // Try direct averageRating property
  if (typeof product.averageRating === 'number') {
    return product.averageRating;
  }

  // Default to 0
  return 0;
}

/**
 * Safely get product review count
 */
export function getProductReviewCount(product: Product): number {
  // Try rating object
  if (product.rating?.count !== undefined) {
    return product.rating.count;
  }

  // Try review count properties
  if (typeof product.reviewCount === 'number') {
    return product.reviewCount;
  }

  if (typeof product.totalReviews === 'number') {
    return product.totalReviews;
  }

  // Default to 0
  return 0;
}

/**
 * Safely get specifications as array
 */
export function getProductSpecifications(product: Product): ProductSpecification[] {
  if (!product.specifications) return [];

  // If already an array, return it
  if (isSpecificationArray(product.specifications)) {
    return product.specifications;
  }

  // If it's a Map, convert to array
  if (product.specifications instanceof Map) {
    const specs: ProductSpecification[] = [];
    let sortOrder = 0;

    product.specifications.forEach((value, name) => {
      specs.push({
        id: `spec-${sortOrder}`,
        name,
        value,
        isHighlight: false,
        sortOrder: sortOrder++,
      });
    });

    return specs;
  }

  return [];
}

/**
 * Convert BackendProductVariant to ProductVariant structure
 */
export function normalizeVariant(
  variant: ProductVariant | BackendProductVariant,
  productId?: string
): Partial<ProductVariant> {
  if (isProductVariant(variant)) {
    return variant;
  }

  // Convert BackendProductVariant to ProductVariant-like structure
  return {
    id: variant._id || `variant-${variant.sku}`,
    productId: productId || '',
    sku: variant.sku,
    name: `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku,
    color: variant.color,
    size: variant.size,
    material: variant.material,
    pricing: {
      basePrice: {
        amount: variant.price,
        currency: 'INR',
        formatted: `₹${variant.price.toLocaleString('en-IN')}`,
      },
      compareAtPrice: variant.comparePrice ? {
        amount: variant.comparePrice,
        currency: 'INR',
        formatted: `₹${variant.comparePrice.toLocaleString('en-IN')}`,
      } : undefined,
      isDynamicPricing: false,
      taxable: true,
    },
    media: variant.images?.length ? { images: variant.images.map(url => ({ url })) } : undefined,
    inventory: {
      quantity: variant.stock,
      isInStock: variant.stock > 0,
      isLowStock: variant.stock > 0 && variant.stock <= 10,
      lowStockThreshold: 10,
      reservedQuantity: 0,
      availableQuantity: variant.stock,
      backorderAllowed: false,
    },
    status: variant.isActive ? 'active' : 'inactive',
    isDefault: false,
    options: [],
  } as Partial<ProductVariant>;
}

/**
 * Format currency value
 */
export function formatPrice(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if product has all required data for display
 */
export function isProductComplete(product: Product): boolean {
  return !!(
    product.name &&
    product.slug &&
    getProductPrice(product) > 0 &&
    getProductImage(product)
  );
}

/**
 * Check if product is available for purchase
 */
export function isProductAvailable(product: Product): boolean {
  return (
    (product.isActive || product.status === 'active') &&
    isProductInStock(product) &&
    isProductComplete(product)
  );
}
