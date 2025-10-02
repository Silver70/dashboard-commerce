// plugins/apollo.client.ts
import { defineNuxtPlugin } from "#app";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";

export default defineNuxtPlugin((nuxtApp) => {
  // Use a different port for Vendure API (commonly 3001 or 4000)
  const httpLink = new HttpLink({
    uri: "http://localhost:3000/admin-api", // Changed from 3000 to 3001
    headers: {
      Authorization: `Bearer 9d1e3dce221dc5c3fbc36d517852e776d2a6f7099cff80a6c600a84c21421e55`,
    },
  });

  const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  nuxtApp.provide("apollo", client);
});
