<script setup lang="ts">
import {
  CREATE_DRAFT_ORDER,
  ADD_ITEM_TO_DRAFT_ORDER,
  REMOVE_DRAFT_ORDER_LINE,
  SET_DRAFT_ORDER_CUSTOMER,
  SET_DRAFT_ORDER_SHIPPING_ADDRESS,
  SET_DRAFT_ORDER_BILLING_ADDRESS,
  TRANSITION_ORDER_TO_STATE,
} from "~/graphql/orders";
import { GET_PRODUCTS } from "~/graphql/products";

const { $apollo } = useNuxtApp();
const toast = useToast();
const router = useRouter();

// State
const loading = ref(false);
const draftOrder = ref<any>(null);
const products = ref<any[]>([]);
const productsLoading = ref(false);
const productSearchQuery = ref("");

// Customer modal
const customerModalOpen = ref(false);
const customerTab = ref<'search' | 'create'>('search');
const customerSearchQuery = ref("");
const customerForm = ref({
  firstName: "",
  lastName: "",
  emailAddress: "",
  phoneNumber: "",
});

// Shipping address modal
const shippingModalOpen = ref(false);
const shippingTab = ref<'search' | 'create'>('search');
const shippingSearchQuery = ref("");
const shippingForm = ref({
  fullName: "",
  company: "",
  streetLine1: "",
  streetLine2: "",
  city: "",
  province: "",
  postalCode: "",
  countryCode: "",
  phoneNumber: "",
});

// Billing address modal
const billingModalOpen = ref(false);
const billingTab = ref<'search' | 'create'>('search');
const billingSearchQuery = ref("");
const billingForm = ref({
  fullName: "",
  company: "",
  streetLine1: "",
  streetLine2: "",
  city: "",
  province: "",
  postalCode: "",
  countryCode: "",
  phoneNumber: "",
});

// Initialize draft order
async function initializeDraftOrder() {
  try {
    loading.value = true;
    const { data } = await $apollo.mutate({
      mutation: CREATE_DRAFT_ORDER,
    });

    draftOrder.value = data?.createDraftOrder;

    if (!draftOrder.value?.id) {
      throw new Error("Failed to create draft order");
    }

    toast.add({
      title: "Success",
      description: `Draft order created! ID: ${draftOrder.value.id} Code: ${draftOrder.value.code}`,
      color: "success",
    });
  } catch (error: any) {
    console.error("Failed to create draft order:", error);
    toast.add({
      title: "Error",
      description: "Failed to create draft order",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Load products with debounce
const loadProducts = useDebounceFn(async () => {
  if (!productSearchQuery.value) {
    products.value = [];
    return;
  }

  try {
    productsLoading.value = true;
    const { data } = await $apollo.query({
      query: GET_PRODUCTS,
      variables: {
        options: {
          take: 50,
          filter: {
            name: {
              contains: productSearchQuery.value,
            },
          },
        },
      },
    });

    products.value = data?.products?.items || [];
  } catch (error) {
    console.error("Failed to load products:", error);
    toast.add({
      title: "Error",
      description: "Failed to load products",
      color: "error",
    });
  } finally {
    productsLoading.value = false;
  }
}, 300);

// Check if a variant is already in the order
function isVariantInOrder(variantId: string): boolean {
  return draftOrder.value?.lines?.some((line: any) => line.productVariant?.id === variantId) || false;
}

// Add item to order
async function addItemToOrder(productVariantId: string, variantName: string) {
  if (!draftOrder.value?.id) {
    toast.add({
      title: "Error",
      description: "No draft order available",
      color: "error",
    });
    return;
  }

  // Check if already added
  if (isVariantInOrder(productVariantId)) {
    toast.add({
      title: "Info",
      description: "This item is already in the order",
      color: "info",
    });
    return;
  }

  try {
    const { data } = await $apollo.mutate({
      mutation: ADD_ITEM_TO_DRAFT_ORDER,
      variables: {
        orderId: draftOrder.value.id,
        input: {
          productVariantId,
          quantity: 1,
        },
      },
    });

    draftOrder.value = data?.addItemToDraftOrder;

    toast.add({
      title: "Success",
      description: `${variantName} added to order`,
      color: "success",
    });
  } catch (error) {
    console.error("Failed to add item:", error);
    toast.add({
      title: "Error",
      description: "Failed to add item to order",
      color: "error",
    });
  }
}

// Remove item from order
async function removeItemFromOrder(orderLineId: string) {
  if (!draftOrder.value?.id) return;

  try {
    const { data } = await $apollo.mutate({
      mutation: REMOVE_DRAFT_ORDER_LINE,
      variables: {
        orderId: draftOrder.value.id,
        orderLineId,
      },
    });

    draftOrder.value = data?.removeDraftOrderLine;

    toast.add({
      title: "Success",
      description: "Item removed from order",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to remove item:", error);
    toast.add({
      title: "Error",
      description: "Failed to remove item from order",
      color: "error",
    });
  }
}

// Save customer
async function saveCustomer() {
  if (!draftOrder.value?.id) return;

  // Validate required fields
  if (!customerForm.value.firstName || !customerForm.value.lastName || !customerForm.value.emailAddress) {
    toast.add({
      title: "Validation Error",
      description: "Please fill in all required fields",
      color: "error",
    });
    return;
  }

  try {
    const { data } = await $apollo.mutate({
      mutation: SET_DRAFT_ORDER_CUSTOMER,
      variables: {
        orderId: draftOrder.value.id,
        input: customerForm.value,
      },
    });

    draftOrder.value = data?.setCustomerForDraftOrder;
    customerModalOpen.value = false;

    toast.add({
      title: "Success",
      description: "Customer information saved",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to save customer:", error);
    toast.add({
      title: "Error",
      description: "Failed to save customer information",
      color: "error",
    });
  }
}

// Save shipping address
async function saveShippingAddress() {
  if (!draftOrder.value?.id) return;

  // Validate required fields
  if (!shippingForm.value.fullName || !shippingForm.value.streetLine1 ||
      !shippingForm.value.city || !shippingForm.value.province ||
      !shippingForm.value.postalCode || !shippingForm.value.countryCode) {
    toast.add({
      title: "Validation Error",
      description: "Please fill in all required fields",
      color: "error",
    });
    return;
  }

  try {
    const { data } = await $apollo.mutate({
      mutation: SET_DRAFT_ORDER_SHIPPING_ADDRESS,
      variables: {
        orderId: draftOrder.value.id,
        input: shippingForm.value,
      },
    });

    draftOrder.value = data?.setDraftOrderShippingAddress;
    shippingModalOpen.value = false;

    toast.add({
      title: "Success",
      description: "Shipping address saved",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to save shipping address:", error);
    toast.add({
      title: "Error",
      description: "Failed to save shipping address",
      color: "error",
    });
  }
}

// Save billing address
async function saveBillingAddress() {
  if (!draftOrder.value?.id) return;

  // Validate required fields
  if (!billingForm.value.fullName || !billingForm.value.streetLine1 ||
      !billingForm.value.city || !billingForm.value.province ||
      !billingForm.value.postalCode || !billingForm.value.countryCode) {
    toast.add({
      title: "Validation Error",
      description: "Please fill in all required fields",
      color: "error",
    });
    return;
  }

  try {
    const { data } = await $apollo.mutate({
      mutation: SET_DRAFT_ORDER_BILLING_ADDRESS,
      variables: {
        orderId: draftOrder.value.id,
        input: billingForm.value,
      },
    });

    draftOrder.value = data?.setDraftOrderBillingAddress;
    billingModalOpen.value = false;

    toast.add({
      title: "Success",
      description: "Billing address saved",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to save billing address:", error);
    toast.add({
      title: "Error",
      description: "Failed to save billing address",
      color: "error",
    });
  }
}

// Copy shipping address to billing
async function copyShippingToBilling() {
  if (!draftOrder.value?.shippingAddress) {
    toast.add({
      title: "Error",
      description: "Please add a shipping address first",
      color: "error",
    });
    return;
  }

  // Prepare the billing address data from shipping address
  const billingData = {
    fullName: draftOrder.value.shippingAddress.fullName || "",
    company: draftOrder.value.shippingAddress.company || "",
    streetLine1: draftOrder.value.shippingAddress.streetLine1 || "",
    streetLine2: draftOrder.value.shippingAddress.streetLine2 || "",
    city: draftOrder.value.shippingAddress.city || "",
    province: draftOrder.value.shippingAddress.province || "",
    postalCode: draftOrder.value.shippingAddress.postalCode || "",
    countryCode: draftOrder.value.shippingAddress.countryCode || "",
    phoneNumber: draftOrder.value.shippingAddress.phoneNumber || "",
  };

  try {
    const { data } = await $apollo.mutate({
      mutation: SET_DRAFT_ORDER_BILLING_ADDRESS,
      variables: {
        orderId: draftOrder.value.id,
        input: billingData,
      },
    });

    draftOrder.value = data?.setDraftOrderBillingAddress;

    toast.add({
      title: "Success",
      description: "Billing address copied from shipping address",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to copy billing address:", error);
    toast.add({
      title: "Error",
      description: "Failed to copy billing address",
      color: "error",
    });
  }
}

// Complete order
async function completeOrder() {
  if (!draftOrder.value?.id) return;

  try {
    loading.value = true;
    await $apollo.mutate({
      mutation: TRANSITION_ORDER_TO_STATE,
      variables: {
        id: draftOrder.value.id,
        state: "ArrangingPayment",
      },
    });

    toast.add({
      title: "Success",
      description: "Order completed successfully",
      color: "success",
    });

    await router.push("/orders");
  } catch (error: any) {
    console.error("Failed to complete order:", error);
    toast.add({
      title: "Error",
      description: "Failed to complete order",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Cancel
function onCancel() {
  router.push("/orders");
}

// Country codes list
const countryCodes = [
  { label: "United States (US)", value: "US" },
  { label: "Canada (CA)", value: "CA" },
  { label: "United Kingdom (GB)", value: "GB" },
  { label: "Australia (AU)", value: "AU" },
  { label: "Germany (DE)", value: "DE" },
  { label: "France (FR)", value: "FR" },
  { label: "Italy (IT)", value: "IT" },
  { label: "Spain (ES)", value: "ES" },
  { label: "Netherlands (NL)", value: "NL" },
  { label: "Belgium (BE)", value: "BE" },
  { label: "Switzerland (CH)", value: "CH" },
  { label: "Austria (AT)", value: "AT" },
  { label: "Denmark (DK)", value: "DK" },
  { label: "Sweden (SE)", value: "SE" },
  { label: "Norway (NO)", value: "NO" },
  { label: "Finland (FI)", value: "FI" },
  { label: "Poland (PL)", value: "PL" },
  { label: "Ireland (IE)", value: "IE" },
  { label: "Portugal (PT)", value: "PT" },
  { label: "Greece (GR)", value: "GR" },
  { label: "Czech Republic (CZ)", value: "CZ" },
  { label: "Hungary (HU)", value: "HU" },
  { label: "Romania (RO)", value: "RO" },
  { label: "Bulgaria (BG)", value: "BG" },
  { label: "Croatia (HR)", value: "HR" },
  { label: "Slovakia (SK)", value: "SK" },
  { label: "Slovenia (SI)", value: "SI" },
  { label: "Lithuania (LT)", value: "LT" },
  { label: "Latvia (LV)", value: "LV" },
  { label: "Estonia (EE)", value: "EE" },
  { label: "Japan (JP)", value: "JP" },
  { label: "China (CN)", value: "CN" },
  { label: "India (IN)", value: "IN" },
  { label: "South Korea (KR)", value: "KR" },
  { label: "Singapore (SG)", value: "SG" },
  { label: "Hong Kong (HK)", value: "HK" },
  { label: "Taiwan (TW)", value: "TW" },
  { label: "Malaysia (MY)", value: "MY" },
  { label: "Thailand (TH)", value: "TH" },
  { label: "Indonesia (ID)", value: "ID" },
  { label: "Philippines (PH)", value: "PH" },
  { label: "Vietnam (VN)", value: "VN" },
  { label: "New Zealand (NZ)", value: "NZ" },
  { label: "Brazil (BR)", value: "BR" },
  { label: "Mexico (MX)", value: "MX" },
  { label: "Argentina (AR)", value: "AR" },
  { label: "Chile (CL)", value: "CL" },
  { label: "Colombia (CO)", value: "CO" },
  { label: "Peru (PE)", value: "PE" },
  { label: "South Africa (ZA)", value: "ZA" },
  { label: "United Arab Emirates (AE)", value: "AE" },
  { label: "Saudi Arabia (SA)", value: "SA" },
  { label: "Israel (IL)", value: "IL" },
  { label: "Turkey (TR)", value: "TR" },
  { label: "Russia (RU)", value: "RU" },
  { label: "Ukraine (UA)", value: "UA" },
];

// Watch for product search changes
watch(productSearchQuery, () => {
  loadProducts();
});

// Initialize
onMounted(async () => {
  await initializeDraftOrder();
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Order">
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
              :loading="loading"
              :disabled="!draftOrder?.lines?.length"
              color="primary"
              @click="completeOrder"
            >
              Complete Order
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div class="flex gap-6">
          <!-- Main Content Area - Left Side (2/3) -->
          <div class="w-2/3 space-y-6">
            <!-- Product Search -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Add Products</h2>
              </template>

              <div class="space-y-4">
                <UInput
                  v-model="productSearchQuery"
                  placeholder="Search for products..."
                  icon="i-heroicons-magnifying-glass"
                  :disabled="productsLoading"
                />

                <div v-if="products.length > 0" class="max-h-96 overflow-y-auto space-y-2">
                  <template v-for="product in products" :key="product.id">
                    <div
                      v-for="variant in product.variants"
                      :key="variant.id"
                      :class="[
                        'border rounded-lg p-3 cursor-pointer transition-all',
                        isVariantInOrder(variant.id)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      ]"
                      @click="addItemToOrder(variant.id, variant.name)"
                    >
                      <div class="flex items-center gap-3">
                        <img
                          v-if="variant.featuredAsset?.preview || product.featuredAsset?.preview"
                          :src="variant.featuredAsset?.preview || product.featuredAsset?.preview"
                          :alt="variant.name"
                          class="w-12 h-12 object-cover rounded"
                        />
                        <div class="flex-1">
                          <div class="font-medium">{{ variant.name }}</div>
                          <div class="text-sm text-gray-500">
                            SKU: {{ variant.sku }}
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="text-sm font-medium">
                            ${{ (variant.price / 100).toFixed(2) }}
                          </div>
                          <div
                            v-if="isVariantInOrder(variant.id)"
                            class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
                          >
                            <i class="i-heroicons-check-circle text-base" />
                            Added
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <div v-else-if="productSearchQuery && !productsLoading" class="text-center py-4">
                  <p class="text-sm text-gray-500">No products found</p>
                </div>
              </div>
            </UCard>

            <!-- Order Lines -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Order Items</h2>
              </template>

              <div v-if="!draftOrder?.lines?.length" class="text-center py-8">
                <div class="text-gray-400 mb-4">
                  <i class="i-heroicons-shopping-cart text-4xl" />
                </div>
                <p class="text-gray-500">No items added yet</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="line in draftOrder.lines"
                  :key="line.id"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 relative group"
                >
                  <UButton
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="error"
                    variant="ghost"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="removeItemFromOrder(line.id)"
                  />
                  <div class="flex items-center gap-3">
                    <img
                      v-if="line.productVariant?.featuredAsset?.preview"
                      :src="line.productVariant.featuredAsset.preview"
                      :alt="line.productVariant.name"
                      class="w-16 h-16 object-cover rounded"
                    />
                    <div class="flex-1">
                      <div class="font-medium">{{ line.productVariant?.name }}</div>
                      <div class="text-sm text-gray-500">
                        SKU: {{ line.productVariant?.sku }}
                      </div>
                      <div class="text-sm text-gray-500">
                        Quantity: {{ line.quantity }}
                      </div>
                    </div>
                    <div class="text-right pr-8">
                      <div class="font-medium">
                        ${{ (line.linePriceWithTax / 100).toFixed(2) }}
                      </div>
                      <div class="text-sm text-gray-500">
                        ${{ (line.unitPriceWithTax / 100).toFixed(2) }} each
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Right Sidebar - Order Information (1/3) -->
          <div class="w-1/3 space-y-6">
            <!-- Customer Information -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Customer</h2>
                  <UButton
                    size="sm"
                    variant="outline"
                    icon="i-heroicons-plus"
                    @click="customerModalOpen = true"
                  >
                    {{ draftOrder?.customer ? "Edit" : "Add" }}
                  </UButton>
                </div>
              </template>

              <div v-if="!draftOrder?.customer" class="text-center py-4">
                <p class="text-sm text-gray-500">No customer assigned</p>
              </div>

              <div v-else class="space-y-2 text-sm">
                <div>
                  <span class="font-medium">Name:</span>
                  {{ draftOrder.customer.firstName }} {{ draftOrder.customer.lastName }}
                </div>
                <div>
                  <span class="font-medium">Email:</span>
                  {{ draftOrder.customer.emailAddress }}
                </div>
                <div v-if="draftOrder.customer.phoneNumber">
                  <span class="font-medium">Phone:</span>
                  {{ draftOrder.customer.phoneNumber }}
                </div>
              </div>
            </UCard>

            <!-- Shipping Address -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Shipping Address</h2>
                  <UButton
                    size="sm"
                    variant="outline"
                    icon="i-heroicons-plus"
                    @click="shippingModalOpen = true"
                  >
                    {{ draftOrder?.shippingAddress ? "Edit" : "Add" }}
                  </UButton>
                </div>
              </template>

              <div v-if="!draftOrder?.shippingAddress" class="text-center py-4">
                <p class="text-sm text-gray-500">No shipping address</p>
              </div>

              <div v-else class="space-y-1 text-sm">
                <div>{{ draftOrder.shippingAddress.fullName }}</div>
                <div v-if="draftOrder.shippingAddress.company">
                  {{ draftOrder.shippingAddress.company }}
                </div>
                <div>{{ draftOrder.shippingAddress.streetLine1 }}</div>
                <div v-if="draftOrder.shippingAddress.streetLine2">
                  {{ draftOrder.shippingAddress.streetLine2 }}
                </div>
                <div>
                  {{ draftOrder.shippingAddress.city }}, {{ draftOrder.shippingAddress.province }}
                  {{ draftOrder.shippingAddress.postalCode }}
                </div>
                <div>{{ draftOrder.shippingAddress.countryCode }}</div>
              </div>
            </UCard>

            <!-- Billing Address -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Billing Address</h2>
                  <div class="flex items-center gap-2">
                    <UButton
                      size="sm"
                      variant="ghost"
                      icon="i-heroicons-document-duplicate"
                      title="Same as shipping"
                      :disabled="!draftOrder?.shippingAddress"
                      @click="copyShippingToBilling"
                    />
                    <UButton
                      size="sm"
                      variant="outline"
                      icon="i-heroicons-plus"
                      @click="billingModalOpen = true"
                    >
                      {{ draftOrder?.billingAddress ? "Edit" : "Add" }}
                    </UButton>
                  </div>
                </div>
              </template>

              <div v-if="!draftOrder?.billingAddress" class="text-center py-4">
                <p class="text-sm text-gray-500">No billing address</p>
              </div>

              <div v-else class="space-y-1 text-sm">
                <div>{{ draftOrder.billingAddress.fullName }}</div>
                <div v-if="draftOrder.billingAddress.company">
                  {{ draftOrder.billingAddress.company }}
                </div>
                <div>{{ draftOrder.billingAddress.streetLine1 }}</div>
                <div v-if="draftOrder.billingAddress.streetLine2">
                  {{ draftOrder.billingAddress.streetLine2 }}
                </div>
                <div>
                  {{ draftOrder.billingAddress.city }}, {{ draftOrder.billingAddress.province }}
                  {{ draftOrder.billingAddress.postalCode }}
                </div>
                <div>{{ draftOrder.billingAddress.countryCode }}</div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Order Summary - Full Width Below -->
        <div class="mt-6">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">Order Summary</h2>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2 text-sm">
                <div class="text-xs font-medium text-gray-500 uppercase">Subtotal</div>
                <div class="text-2xl font-semibold">
                  ${{ ((draftOrder?.subTotalWithTax || 0) / 100).toFixed(2) }}
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="text-xs font-medium text-gray-500 uppercase">Shipping</div>
                <div class="text-2xl font-semibold">
                  ${{ ((draftOrder?.shippingWithTax || 0) / 100).toFixed(2) }}
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="text-xs font-medium text-gray-500 uppercase">Total</div>
                <div class="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                  ${{ ((draftOrder?.totalWithTax || 0) / 100).toFixed(2) }}
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Customer Modal -->
      <UModal v-model:open="customerModalOpen" title="Customer">
        <template #body>
          <div class="space-y-6">
            <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors',
                  customerTab === 'search'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
                @click="customerTab = 'search'"
              >
                Search Existing
              </button>
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors',
                  customerTab === 'create'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
                @click="customerTab = 'create'"
              >
                Create New
              </button>
            </div>

            <div v-if="customerTab === 'search'" class="space-y-4">
              <UInput
                v-model="customerSearchQuery"
                placeholder="Search customers by name or email..."
                icon="i-heroicons-magnifying-glass"
              />
              <div class="text-center py-8 text-gray-500">
                Search functionality coming soon
              </div>
            </div>

            <div v-else class="space-y-5">
              <UFormGroup label="First Name" name="firstName" required>
                <UInput v-model="customerForm.firstName" placeholder="John" />
              </UFormGroup>
              <UFormGroup label="Last Name" name="lastName" required>
                <UInput v-model="customerForm.lastName" placeholder="Doe" />
              </UFormGroup>
              <UFormGroup label="Email Address" name="emailAddress" required>
                <UInput v-model="customerForm.emailAddress" type="email" placeholder="john@example.com" />
              </UFormGroup>
              <UFormGroup label="Phone Number" name="phoneNumber">
                <UInput v-model="customerForm.phoneNumber" placeholder="+1 234 567 8900" />
              </UFormGroup>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="customerModalOpen = false">
              Cancel
            </UButton>
            <UButton v-if="customerTab === 'create'" @click="saveCustomer">
              Save
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Shipping Address Modal -->
      <UModal v-model:open="shippingModalOpen" title="Shipping Address">
        <template #body>
          <div class="space-y-6">
            <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors',
                  shippingTab === 'search'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
                @click="shippingTab = 'search'"
              >
                Search Existing
              </button>
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors',
                  shippingTab === 'create'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
                @click="shippingTab = 'create'"
              >
                Create New
              </button>
            </div>

            <div v-if="shippingTab === 'search'" class="space-y-4">
              <UInput
                v-model="shippingSearchQuery"
                placeholder="Search addresses..."
                icon="i-heroicons-magnifying-glass"
              />
              <div class="text-center py-8 text-gray-500">
                Search functionality coming soon
              </div>
            </div>

            <div v-else class="space-y-5">
              <UFormGroup label="Full Name" name="fullName" required>
                <UInput v-model="shippingForm.fullName" placeholder="John Doe" />
              </UFormGroup>
              <UFormGroup label="Company" name="company">
                <UInput v-model="shippingForm.company" placeholder="Company Inc." />
              </UFormGroup>
              <UFormGroup label="Street Address" name="streetLine1" required>
                <UInput v-model="shippingForm.streetLine1" placeholder="123 Main St" />
              </UFormGroup>
              <UFormGroup label="Street Address 2" name="streetLine2">
                <UInput v-model="shippingForm.streetLine2" placeholder="Apt 4B" />
              </UFormGroup>
              <UFormGroup label="City" name="city" required>
                <UInput v-model="shippingForm.city" placeholder="New York" />
              </UFormGroup>
              <UFormGroup label="Province/State" name="province" required>
                <UInput v-model="shippingForm.province" placeholder="NY" />
              </UFormGroup>
              <UFormGroup label="Postal Code" name="postalCode" required>
                <UInput v-model="shippingForm.postalCode" placeholder="10001" />
              </UFormGroup>
              <UFormGroup label="Country" name="countryCode" required>
                <USelect v-model="shippingForm.countryCode" :items="countryCodes" searchable placeholder="Select country" />
              </UFormGroup>
              <UFormGroup label="Phone Number" name="phoneNumber">
                <UInput v-model="shippingForm.phoneNumber" placeholder="+1 234 567 8900" />
              </UFormGroup>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="shippingModalOpen = false">
              Cancel
            </UButton>
            <UButton v-if="shippingTab === 'create'" @click="saveShippingAddress">
              Save
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Billing Address Modal -->
      <UModal v-model:open="billingModalOpen" title="Billing Address">
        <template #body>
          <div class="space-y-6">
            <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors',
                  billingTab === 'search'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
                @click="billingTab = 'search'"
              >
                Search Existing
              </button>
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors',
                  billingTab === 'create'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                ]"
                @click="billingTab = 'create'"
              >
                Create New
              </button>
            </div>

            <div v-if="billingTab === 'search'" class="space-y-4">
              <UInput
                v-model="billingSearchQuery"
                placeholder="Search addresses..."
                icon="i-heroicons-magnifying-glass"
              />
              <div class="text-center py-8 text-gray-500">
                Search functionality coming soon
              </div>
            </div>

            <div v-else class="space-y-5">
              <UFormGroup label="Full Name" name="fullName" required>
                <UInput v-model="billingForm.fullName" placeholder="John Doe" />
              </UFormGroup>
              <UFormGroup label="Company" name="company">
                <UInput v-model="billingForm.company" placeholder="Company Inc." />
              </UFormGroup>
              <UFormGroup label="Street Address" name="streetLine1" required>
                <UInput v-model="billingForm.streetLine1" placeholder="123 Main St" />
              </UFormGroup>
              <UFormGroup label="Street Address 2" name="streetLine2">
                <UInput v-model="billingForm.streetLine2" placeholder="Apt 4B" />
              </UFormGroup>
              <UFormGroup label="City" name="city" required>
                <UInput v-model="billingForm.city" placeholder="New York" />
              </UFormGroup>
              <UFormGroup label="Province/State" name="province" required>
                <UInput v-model="billingForm.province" placeholder="NY" />
              </UFormGroup>
              <UFormGroup label="Postal Code" name="postalCode" required>
                <UInput v-model="billingForm.postalCode" placeholder="10001" />
              </UFormGroup>
              <UFormGroup label="Country" name="countryCode" required>
                <USelect v-model="billingForm.countryCode" :items="countryCodes" searchable placeholder="Select country" />
              </UFormGroup>
              <UFormGroup label="Phone Number" name="phoneNumber">
                <UInput v-model="billingForm.phoneNumber" placeholder="+1 234 567 8900" />
              </UFormGroup>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="billingModalOpen = false">
              Cancel
            </UButton>
            <UButton v-if="billingTab === 'create'" @click="saveBillingAddress">
              Save
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
