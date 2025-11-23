/**
 * Product Adapter Utility
 *
 * Converts between different Product type formats:
 * - API Product (from backend) → Component Product (for frontend components)
 * - Ensures compatibility with both simple and comprehensive Product structures
 */

import type { Product as APIProduct } from '@/lib/api/types';
import type { Product, ProductPricing, StockInfo, MediaGallery, Rating } from '@/types';
import type { Price } from '@/types/common.types';

/**
 * Converts API Product format to Component Product format
 * Handles both simple (API) and comprehensive (Component) structures
 */
export function adaptAPIProduct(apiProduct: APIProduct): Product {
  // Handle both naming conventions for ID
  const productId = (apiProduct as any)._id || apiProduct.id;

  // Create comprehensive pricing object from simple price
  const pricing: ProductPricing = {
    basePrice: {
      amount: apiProduct.originalPrice || apiProduct.price,
      currency: 'INR',
      formatted: `₹${(apiProduct.originalPrice || apiProduct.price).toLocaleString('en-IN')}`,
    } as Price,
    salePrice: apiProduct.discount ? {
      amount: apiProduct.price,
      currency: 'INR',
      formatted: `₹${apiProduct.price.toLocaleString('en-IN')}`,
    } as Price : undefined,
    compareAtPrice: apiProduct.originalPrice ? {
      amount: apiProduct.originalPrice,
      currency: 'INR',
      formatted: `₹${apiProduct.originalPrice.toLocaleString('en-IN')}`,
    } as Price : undefined,
    isDynamicPricing: false,
    taxable: true,
  };

  // Create comprehensive inventory object from simple stock
  const inventory: StockInfo = {
    quantity: apiProduct.stock,
    isInStock: apiProduct.stock > 0,
    availableQuantity: apiProduct.stock,
    lowStockThreshold: 10,
    isLowStock: apiProduct.stock > 0 && apiProduct.stock <= 10,
    backorderAllowed: false,
  };

  // Create comprehensive media object from simple images
  const media: MediaGallery = {
    images: apiProduct.images?.map((img, index) => ({
      id: `${productId}-img-${index}`,
      url: img.url,
      alt: img.alt || apiProduct.name,
      width: 800,
      height: 800,
      isPrimary: img.isPrimary || index === 0,
      order: img.order ?? index,
    })) || [],
    videos: [],
    primaryImage: apiProduct.images?.[0] ? {
      id: `${productId}-primary`,
      url: apiProduct.images[0].url,
      alt: apiProduct.images[0].alt || apiProduct.name,
      width: 800,
      height: 800,
      isPrimary: true,
      order: 0,
    } : undefined,
  };

  // Create comprehensive rating object
  const rating: Rating | undefined = apiProduct.rating ? {
    average: apiProduct.rating.average,
    count: apiProduct.rating.count,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  } : undefined;

  // Return adapted product with both structures for maximum compatibility
  return {
    // IDs
    id: productId,
    _id: productId,

    // Basic Information
    name: apiProduct.name,
    slug: apiProduct.slug,
    sku: apiProduct.sku,
    description: apiProduct.description,
    shortDescription: apiProduct.shortDescription,

    // Categorization (required fields)
    categoryId: typeof apiProduct.category === 'string' ? apiProduct.category : apiProduct.category?.id || '',
    category: apiProduct.category as any, // API category may be partial
    brandId: typeof apiProduct.brand === 'string' ? apiProduct.brand : apiProduct.brand?.id,
    brand: apiProduct.brand as any, // API brand may be partial
    collectionIds: [],
    collections: [],

    // Pricing - BOTH formats for compatibility
    price: apiProduct.price, // Simple format (backend)
    pricing, // Comprehensive format (frontend)

    // Media - BOTH formats for compatibility
    image: apiProduct.images?.[0]?.url, // Simple format
    images: apiProduct.images?.map(img => img.url), // Array format
    media, // Comprehensive format

    // Inventory - BOTH formats for compatibility
    stock: apiProduct.stock, // Simple format
    inventory, // Comprehensive format

    // Reviews and Ratings - BOTH formats for compatibility
    rating, // Comprehensive format
    averageRating: apiProduct.rating?.average, // Simple format
    reviewCount: apiProduct.rating?.count,
    totalReviews: apiProduct.rating?.count,

    // Variants (map to component format)
    variants: apiProduct.variants?.map(v => ({
      id: v.id,
      productId,
      name: v.name,
      sku: v.sku,
      options: [],
      pricing: {
        basePrice: {
          amount: v.price,
          currency: 'INR',
          formatted: `₹${v.price.toLocaleString('en-IN')}`,
        } as Price,
      } as ProductPricing,
      inventory: {
        quantity: v.stock,
        isInStock: v.stock > 0,
        availableQuantity: v.stock,
        lowStockThreshold: 10,
        isLowStock: v.stock > 0 && v.stock <= 10,
        backorderAllowed: false,
      } as StockInfo,
      media: {
        images: v.images?.map((imgUrl, idx) => ({
          id: `${v.id}-img-${idx}`,
          url: imgUrl.url,
          alt: v.name,
          width: 800,
          height: 800,
          isPrimary: idx === 0,
          order: idx,
        })) || [],
        videos: [],
      } as MediaGallery,
      status: 'active',
      isDefault: false,
      createdAt: apiProduct.createdAt,
      updatedAt: apiProduct.updatedAt,
    })) || [],

    // Attributes (convert to component format)
    specifications: apiProduct.attributes?.map(attr => ({
      group: attr.group || 'General',
      key: attr.name,
      value: attr.value,
      displayName: attr.name,
      unit: undefined,
      sortOrder: 0,
    })),

    // Tags
    tags: apiProduct.tags,

    // Status and Visibility
    status: apiProduct.status,
    isActive: apiProduct.status === 'active',
    isFeatured: apiProduct.featured,
    isNewArrival: apiProduct.isNew,
    isBestseller: apiProduct.isBestseller,

    // SEO
    seo: apiProduct.seo,

    // Dates
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  } as Product;
}

/**
 * Batch adapter for arrays of API products
 */
export function adaptAPIProducts(apiProducts: APIProduct[]): Product[] {
  return apiProducts.map(adaptAPIProduct);
}

/**
 * Type guard to check if a product needs adaptation
 */
export function needsAdaptation(product: any): product is APIProduct {
  // API products have simple 'price' and 'stock' fields
  // Component products have 'pricing' and 'inventory' objects
  return typeof product.price === 'number' && !product.pricing;
}

/**
 * Smart adapter that only adapts if needed
 */
export function ensureComponentProduct(product: any): Product {
  if (needsAdaptation(product)) {
    return adaptAPIProduct(product);
  }
  return product as Product;
}
