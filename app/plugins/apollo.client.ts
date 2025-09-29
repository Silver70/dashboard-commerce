// plugins/apollo.client.ts
import { defineNuxtPlugin } from '#app'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { HttpLink } from '@apollo/client/link/http'

export default defineNuxtPlugin((nuxtApp) => {
  // Use a different port for Vendure API (commonly 3001 or 4000)
  const httpLink = new HttpLink({
    uri: 'http://localhost:3000/admin-api', // Changed from 3000 to 3001
    headers: {
      Authorization: `Bearer 007de0368eb8c160838d1a51063dc4170b4c9c036b37c9359b638061bda521b1`
    }
  })

  const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
  })

  nuxtApp.provide('apollo', client)
})
