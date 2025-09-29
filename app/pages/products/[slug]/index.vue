<script setup lang="ts">
import { GET_PRODUCT } from "~/graphql/products";

const { $apollo } = useNuxtApp();
const { slug } = useRoute().params;

// Reactive state for loading and error handling
const loading = ref(true);
const error = ref<string | null>(null);
const apolloData = ref<any>(null);

const product = computed(() => apolloData.value?.product);

// Async function to fetch product data
const fetchProduct = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Wait for Apollo client to be available
    await nextTick();

    if (!$apollo) {
      throw new Error("Apollo client not available");
    }

    const result = await $apollo.query({
      query: GET_PRODUCT,
      variables: {
        id: slug,
      },
    });

    apolloData.value = result.data;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch product";
    console.error("Error fetching product:", err);
  } finally {
    loading.value = false;
  }
};

// Fetch product on mount
onMounted(() => {
  fetchProduct();
});
</script>

<template>
  <UDashboardPanel id="product">
    <template #header>
      <UDashboardNavbar :title="product?.name || 'Product'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Edit Product" variant="outline" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Error State -->
      <div
        v-if="error"
        class="p-8 flex items-center justify-center min-h-[400px]"
      >
        <div class="text-center max-w-md">
          <div class="text-red-500 mb-6">
            <i class="i-heroicons-exclamation-triangle text-8xl" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Product
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ error }}
          </p>
          <UButton
            :loading="loading"
            color="primary"
            variant="solid"
            size="lg"
            @click="fetchProduct"
          >
            <i class="i-heroicons-arrow-path mr-2" />
            Try Again
          </UButton>
        </div>
      </div>

      <!-- Loading State with Skeleton -->
      <div v-else-if="loading" class="p-6 space-y-6 animate-pulse">
        <!-- Header Skeleton -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Image Skeleton -->
          <div class="lg:w-1/3">
            <div
              class="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700"
            />
            <div class="mt-4 grid grid-cols-4 gap-2">
              <div class="aspect-square rounded bg-gray-200 dark:bg-gray-700" />
              <div class="aspect-square rounded bg-gray-200 dark:bg-gray-700" />
              <div class="aspect-square rounded bg-gray-200 dark:bg-gray-700" />
              <div class="aspect-square rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          <!-- Content Skeleton -->
          <div class="lg:w-2/3 space-y-4">
            <div class="space-y-2">
              <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div class="flex gap-2">
                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            </div>
          </div>
        </div>

        <!-- Variants Table Skeleton -->
        <div class="space-y-4">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div class="bg-gray-50 dark:bg-gray-800 px-6 py-3">
              <div class="grid grid-cols-6 gap-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div v-for="i in 3" :key="i" class="px-6 py-4">
                <div class="grid grid-cols-6 gap-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cards Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="i in 3"
            :key="i"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4" />
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>

        <!-- Loading indicator overlay -->
        <div
          class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center space-x-3"
          >
            <div class="relative">
              <div
                class="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-600"
              />
              <div
                class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent absolute top-0"
              />
            </div>
            <span class="text-gray-700 dark:text-gray-300 font-medium"
              >Loading product...</span
            >
          </div>
        </div>
      </div>

      <!-- Product Content -->
      <div v-else-if="product" class="p-6 space-y-6">
        <!-- Product Header -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Product Image -->
          <div class="lg:w-1/3">
            <div
              class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img
                v-if="product.featuredAsset?.preview"
                :src="product.featuredAsset.preview"
                :alt="product.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                <i class="i-heroicons-photo text-8xl" />
              </div>
            </div>

            <!-- Additional Images -->
            <div
              v-if="product.assets?.length > 1"
              class="mt-4 grid grid-cols-4 gap-2"
            >
              <div
                v-for="asset in product.assets.slice(0, 4)"
                :key="asset.id"
                class="aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                <img
                  :src="asset.preview"
                  :alt="asset.name"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- Product Details -->
          <div class="lg:w-2/3 space-y-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ product.name }}
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                SKU: {{ product.variants?.[0]?.sku || "N/A" }}
              </p>
            </div>

            <div
              v-if="product.description"
              class="prose dark:prose-invert max-w-none"
            >
              <p>{{ product.description }}</p>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center gap-2">
              <UBadge
                :color="product.enabled ? 'success' : 'error'"
                :label="product.enabled ? 'Active' : 'Inactive'"
              />
            </div>

            <!-- Collections -->
            <div v-if="product.collections?.length" class="space-y-2">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Collections
              </h3>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="collection in product.collections"
                  :key="collection.id"
                  :label="collection.name"
                  variant="soft"
                />
              </div>
            </div>

            <!-- Facet Values -->
            <div v-if="product.facetValues?.length" class="space-y-2">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attributes
              </h3>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="facetValue in product.facetValues"
                  :key="facetValue.id"
                  class="text-sm"
                >
                  <span class="font-medium">{{ facetValue.facet.name }}:</span>
                  <span class="ml-1 text-gray-600 dark:text-gray-400">{{
                    facetValue.name
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Variants Section -->
        <div v-if="product.variants?.length" class="space-y-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Product Variants
          </h2>
          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    SKU
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Stock
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Options
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  v-for="variant in product.variants"
                  :key="variant.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {{ variant.name }}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    {{ variant.sku }}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                  >
                    ${{ (variant.priceWithTax / 100).toFixed(2) }}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                  >
                    {{ variant.stockLevel }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <UBadge
                      :color="variant.enabled ? 'success' : 'error'"
                      :label="variant.enabled ? 'Active' : 'Inactive'"
                      size="xs"
                    />
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="option in variant.options"
                        :key="option.id"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {{ option.name }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Product Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Created</h3>
            </template>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ new Date(product.createdAt).toLocaleDateString() }}
            </p>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Last Updated</h3>
            </template>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ new Date(product.updatedAt).toLocaleDateString() }}
            </p>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Total Variants</h3>
            </template>
            <p class="text-2xl font-bold text-primary">
              {{ product.variants?.length || 0 }}
            </p>
          </UCard>
        </div>
      </div>

      <!-- No Product Found -->
      <div v-else class="p-6 flex items-center justify-center">
        <div class="text-center">
          <div class="text-gray-400 mb-4">
            <i class="i-heroicons-cube-transparent text-8xl" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Product Not Found
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            The product you're looking for doesn't exist.
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
