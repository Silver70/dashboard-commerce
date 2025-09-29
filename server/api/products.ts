import type { Product } from '~/types'

export const products: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    slug: 'product-1',
    variants: [
      {
        id: '1-1',
        name: 'Default Variant',
        price: 10000,
        stockLevel: 'IN_STOCK'
      }
    ]
  },
  {
    id: '2',
    name: 'Product 2',
    slug: 'product-2',
    variants: [
      {
        id: '2-1',
        name: 'Default Variant',
        price: 20000,
        stockLevel: 'OUT_OF_STOCK'
      }
    ]
  },
  {
    id: '3',
    name: 'Product 3',
    slug: 'product-3',
    variants: [
      {
        id: '3-1',
        name: 'Default Variant',
        price: 30000,
        stockLevel: 'IN_STOCK'
      }
    ]
  },
  {
    id: '4',
    name: 'Product 4',
    slug: 'product-4',
    variants: [
      {
        id: '4-1',
        name: 'Default Variant',
        price: 40000,
        stockLevel: 'IN_STOCK'
      }
    ]
  },
  {
    id: '5',
    name: 'Product 5',
    slug: 'product-5',
    variants: [
      {
        id: '5-1',
        name: 'Default Variant',
        price: 50000,
        stockLevel: 'OUT_OF_STOCK'
      }
    ]
  }
]

export default eventHandler(async () => {
  return products
})
