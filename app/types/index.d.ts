import type { AvatarProps } from '@nuxt/ui'
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stockLevel: string
}

export interface Product {
  id: string
  name: string
  slug: string
  variants: ProductVariant[]
  featuredAsset?: {
    preview: string
  }
}

export interface OrderCustomer {
  id: string
  firstName: string
  lastName: string
  emailAddress: string
}

export interface Order {
  id: string
  code: string
  state: string
  active: boolean
  createdAt: string
  updatedAt: string
  orderPlacedAt?: string
  totalQuantity: number
  total: number
  totalWithTax: number
  currencyCode: string
  customer?: OrderCustomer
}

declare module '#app' {
  interface NuxtApp {
    $apollo: ApolloClient<NormalizedCacheObject>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $apollo: ApolloClient<NormalizedCacheObject>
  }
}
