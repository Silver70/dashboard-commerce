<script setup lang="ts">
import { z } from "zod";
import {
  CREATE_COLLECTION,
  GET_PRODUCTS
} from "~/graphql/products";

const { $apollo } = useNuxtApp();
const toast = useToast();
const router = useRouter();

// Form validation schema
const schema = z.object({
  name: z.string().min(1, "Collection name is required").max(255, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  selectedProductIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

// Form state
const loading = ref(false);
const form = ref<FormData>({
  name: "",
  slug: "",
  description: "",
  isPrivate: false,
  selectedProductIds: [],
});

// Data for selection
const availableProducts = ref<any[]>([]);
const productsLoading = ref(false);

// Get selected products with full details
const selectedProducts = computed(() => {
  if (!form.value.selectedProductIds || form.value.selectedProductIds.length === 0) {
    return [];
  }
  return availableProducts.value.filter(product =>
    form.value.selectedProductIds?.includes(product.value)
  );
});

// Format price for display
function formatPrice(priceInCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(priceInCents / 100);
}

// Remove product from selection
function removeProduct(productId: string) {
  form.value.selectedProductIds = form.value.selectedProductIds?.filter(id => id !== productId) || [];
}

// Generate slug from name
function generateSlug() {
  if (form.value.name) {
    form.value.slug = form.value.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }
}

// Auto-generate slug when name field loses focus and slug is empty
function handleNameBlur() {
  if (form.value.name && !form.value.slug) {
    generateSlug();
  }
}





// Build collection filters for selected products
function buildCollectionFilters() {
  const filters: any[] = [];

  // If products are manually selected, create a filter for them
  if (form.value.selectedProductIds && form.value.selectedProductIds.length > 0) {
    filters.push({
      code: "product-id-filter",
      arguments: [
        {
          name: "productIds",
          value: `[${form.value.selectedProductIds.map(id => `"${id}"`).join(",")}]`
        }
      ]
    });
  }

  return filters;
}

// Form submission
async function onSubmit() {
  try {
    loading.value = true;

    // Build the filters first
    const filters = buildCollectionFilters();
    console.log('Built collection filters:', filters);

    // Create the collection
    const collectionInput = {
      translations: [
        {
          languageCode: "en",
          name: form.value.name,
          slug: form.value.slug,
          description: form.value.description || "",
        },
      ],
      isPrivate: form.value.isPrivate,
      filters: filters,
    };

    console.log('Collection input:', collectionInput);

    const { data: collectionData } = await $apollo.mutate({
      mutation: CREATE_COLLECTION,
      variables: { input: collectionInput },
    });

    console.log('Collection creation response:', collectionData);

    const collection = collectionData?.createCollection;

    if (!collection?.id) {
      throw new Error("Collection was created but no ID was returned");
    }

    toast.add({
      title: "Success",
      description: `Collection "${form.value.name}" created successfully`,
      color: "success",
    });

    // Navigate to the collections list
    await router.push('/products/collections');
  } catch (error: any) {
    console.error("Collection creation error:", error);

    let errorMessage = "Failed to create collection";

    if (error.graphQLErrors?.length > 0) {
      errorMessage = error.graphQLErrors[0].message;
    } else if (error.networkError) {
      errorMessage = "Network error - please check your connection";
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast.add({
      title: "Error",
      description: errorMessage,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Cancel and go back
function onCancel() {
  router.push("/products/collections");
}


// Fetch products for manual selection (API first, demo fallback)
async function fetchProducts() {
  try {
    productsLoading.value = true;
    console.log('Fetching products from API...');

    const { data } = await $apollo.query({
      query: GET_PRODUCTS,
      variables: {
        options: {
          take: 100,
          sort: {
            name: 'ASC'
          }
        }
      }
    });

    console.log('Products API response:', data);

    if (data?.products?.items && data.products.items.length > 0) {
      availableProducts.value = data.products.items.map((product: any) => ({
        label: product.name,
        value: product.id,
        description: product.description || '',
        slug: product.slug,
        enabled: product.enabled,
        featuredAsset: product.featuredAsset,
        variants: product.variants || [],
      }));
      console.log('✅ Using real products from API:', availableProducts.value.length);
    } else {
      console.log('⚠️ No products from API, using demo data');
      availableProducts.value = [
        {
          label: "iPhone 14 Pro",
          value: "1",
          description: "Latest iPhone model with advanced camera system",
          slug: "iphone-14-pro",
          enabled: true,
          featuredAsset: { preview: "/api/placeholder/300/200" },
          variants: [{ price: 99900, priceWithTax: 119880, sku: "IPH14PRO" }]
        },
        {
          label: "MacBook Pro",
          value: "2",
          description: "Professional laptop for developers and creators",
          slug: "macbook-pro",
          enabled: true,
          featuredAsset: { preview: "/api/placeholder/300/200" },
          variants: [{ price: 199900, priceWithTax: 239880, sku: "MBP16" }]
        },
        {
          label: "AirPods Pro",
          value: "3",
          description: "Wireless earbuds with active noise cancellation",
          slug: "airpods-pro",
          enabled: true,
          featuredAsset: { preview: "/api/placeholder/300/200" },
          variants: [{ price: 24900, priceWithTax: 29880, sku: "APP3" }]
        },
        {
          label: "Samsung TV",
          value: "4",
          description: "4K Smart TV with HDR support",
          slug: "samsung-tv",
          enabled: true,
          featuredAsset: { preview: "/api/placeholder/300/200" },
          variants: [{ price: 89900, priceWithTax: 107880, sku: "STV65" }]
        },
        {
          label: "Nike Shoes",
          value: "5",
          description: "Comfortable running shoes for daily workouts",
          slug: "nike-shoes",
          enabled: false,
          featuredAsset: { preview: "/api/placeholder/300/200" },
          variants: [{ price: 12900, priceWithTax: 15480, sku: "NKE42" }]
        },
      ];
    }
  } catch (error) {
    console.error('❌ API failed, using demo products:', error);
    availableProducts.value = [
      {
        label: "iPhone 14 Pro",
        value: "1",
        description: "Latest iPhone model with advanced camera system",
        slug: "iphone-14-pro",
        enabled: true,
        featuredAsset: { preview: "/api/placeholder/300/200" },
        variants: [{ price: 99900, priceWithTax: 119880, sku: "IPH14PRO" }]
      },
      {
        label: "MacBook Pro",
        value: "2",
        description: "Professional laptop for developers and creators",
        slug: "macbook-pro",
        enabled: true,
        featuredAsset: { preview: "/api/placeholder/300/200" },
        variants: [{ price: 199900, priceWithTax: 239880, sku: "MBP16" }]
      },
      {
        label: "AirPods Pro",
        value: "3",
        description: "Wireless earbuds with active noise cancellation",
        slug: "airpods-pro",
        enabled: true,
        featuredAsset: { preview: "/api/placeholder/300/200" },
        variants: [{ price: 24900, priceWithTax: 29880, sku: "APP3" }]
      },
    ];
  } finally {
    productsLoading.value = false;
  }
}

// Load data on mount
onMounted(async () => {
  console.log('Component mounted, loading data...');
  try {
    await fetchProducts();
  } catch (error) {
    console.error('Failed to load products:', error);
  }
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Collection">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              variant="outline"
              color="neutral"
              :disabled="loading"
              @click="onCancel"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              form="collection-form"
              :loading="loading"
              color="primary"
            >
              Create Collection
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UForm
          id="collection-form"
          :schema="schema"
          :state="form"
          class="w-full max-w-4xl mx-auto space-y-8"
          @submit="onSubmit"
        >
            <!-- Basic Information -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Basic Information</h2>
              </template>

              <div class="space-y-4">
                <div class="flex gap-4 w-full">
                  <UFormGroup label="Collection Name" name="name" required class="flex-1">
                    <UInput
                      v-model="form.name"
                      placeholder="Enter collection name"
                      :disabled="loading"
                      @blur="handleNameBlur"
                    />
                  </UFormGroup>

                  <UFormGroup label="Slug" name="slug" required class="flex-1">
                    <div class="flex gap-2">
                      <UInput
                        v-model="form.slug"
                        placeholder="collection-slug"
                        :disabled="loading"
                      />
                      <UButton
                        size="sm"
                        variant="outline"
                        :disabled="loading || !form.name"
                        @click="generateSlug"
                      >
                        Generate
                      </UButton>
                    </div>
                  </UFormGroup>
                </div>

                <UFormGroup label="Description" name="description">
                  <UTextarea
                    v-model="form.description"
                    placeholder="Collection description..."
                    :rows="3"
                    :disabled="loading"
                    class="w-full"
                  />
                </UFormGroup>

                <UFormGroup label="Privacy" name="isPrivate" class="flex items-center pt-3">
                  <UCheckbox v-model="form.isPrivate" :disabled="loading" />
                  <span class="ml-2 text-sm">
                    {{ form.isPrivate ? "Private Collection" : "Public Collection" }}
                  </span>
                  <template #help>
                    <span class="text-sm text-gray-500">
                      Private collections are not visible in the storefront
                    </span>
                  </template>
                </UFormGroup>
              </div>
            </UCard>


            <!-- Product Selection -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Add Products</h2>
              </template>

              <div class="space-y-6">
                <UFormGroup label="Select Products" name="selectedProductIds">
                  <USelect
                    v-model="form.selectedProductIds"
                    :items="availableProducts"
                    multiple
                    searchable
                    placeholder="Search and select products for this collection"
                    :disabled="loading || productsLoading"
                    size="lg"
                    class="w-full"
                  />
                  <template #help>
                    <span class="text-sm text-gray-500">
                      Choose which products to include in this collection ({{ availableProducts.length }} available)
                      {{ productsLoading ? ' - Loading...' : '' }}
                    </span>
                  </template>
                </UFormGroup>

                <!-- Selected Products List -->
                <div v-if="selectedProducts.length > 0" class="mt-6">
                  <h3 class="text-md font-medium mb-4 text-gray-900 dark:text-gray-100">
                    Selected Products ({{ selectedProducts.length }})
                  </h3>
                  <div class="space-y-3">
                    <div
                      v-for="product in selectedProducts"
                      :key="product.value"
                      class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <!-- Product Thumbnail -->
                      <div class="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          v-if="product.featuredAsset?.preview"
                          :src="product.featuredAsset.preview"
                          :alt="product.label"
                          class="w-full h-full object-cover"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center">
                          <i class="i-lucide-image text-xl text-gray-400" />
                        </div>
                      </div>

                      <!-- Product Info -->
                      <div class="flex-grow min-w-0">
                        <div class="flex items-start justify-between mb-2">
                          <h4 class="font-medium text-sm truncate pr-2">{{ product.label }}</h4>
                          <UBadge
                            :color="product.enabled ? 'success' : 'neutral'"
                            :label="product.enabled ? 'Active' : 'Inactive'"
                            size="xs"
                            class="flex-shrink-0"
                          />
                        </div>

                        <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                          {{ product.description }}
                        </p>

                        <div class="flex items-center justify-between text-xs">
                          <span class="font-medium text-primary">
                            {{ product.variants?.[0]?.priceWithTax ? formatPrice(product.variants[0].priceWithTax) : 'N/A' }}
                          </span>
                          <span class="text-gray-500">
                            SKU: {{ product.variants?.[0]?.sku || 'N/A' }}
                          </span>
                        </div>
                      </div>

                      <!-- Remove button -->
                      <UButton
                        icon="i-lucide-x"
                        size="xs"
                        color="error"
                        variant="ghost"
                        class="flex-shrink-0"
                        @click="removeProduct(product.value)"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </UCard>

        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
