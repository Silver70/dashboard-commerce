<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";
import type { Product } from "~/types";
import { GET_PRODUCTS, DELETE_PRODUCT } from "~/graphql/products";

const { $apollo } = useNuxtApp();

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

const data = ref<Product[]>([]);
const totalItems = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const table = ref();

async function fetchProducts() {
  try {
    loading.value = true;
    error.value = null;

    // Wait for Apollo client to be available
    await nextTick();

    if (!$apollo) {
      throw new Error("Apollo client not available");
    }

    const { data: apolloData } = await $apollo.query({
      query: GET_PRODUCTS,
      variables: {
        options: {
          take: pagination.value.pageSize,
          skip: pagination.value.pageIndex * pagination.value.pageSize,
        },
      },
      fetchPolicy: "network-only",
    });

    data.value = apolloData?.products?.items || [];
    totalItems.value = apolloData?.products?.totalItems || 0;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch products";
    console.error("Error fetching products:", err);
    toast.add({
      title: "Error",
      description: error.value || "Failed to fetch products",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Initial fetch on mount
onMounted(() => {
  fetchProducts();
});

// Watch pagination changes
watch(pagination, fetchProducts, { deep: true });

async function deleteProduct(productId: string, productName: string) {
  try {
    if (!$apollo) {
      throw new Error("Apollo client not available");
    }

    const { data: deleteData } = await $apollo.mutate({
      mutation: DELETE_PRODUCT,
      variables: {
        id: productId,
      },
    });

    if (deleteData?.deleteProduct?.result === "DELETED") {
      toast.add({
        title: "Product deleted",
        description: `${productName} has been deleted successfully.`,
        color: "success",
      });

      // Refresh the products list
      await fetchProducts();
    } else {
      throw new Error(
        deleteData?.deleteProduct?.message || "Failed to delete product"
      );
    }
  } catch (err: any) {
    console.error("Error deleting product:", err);
    toast.add({
      title: "Error",
      description: err.message || "Failed to delete product",
      color: "error",
    });
  }
}

function getRowItems(row: Row<Product>) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Copy product ID",
      icon: "i-lucide-copy",
      onSelect() {
        navigator.clipboard.writeText(row.original.id);
        toast.add({
          title: "Copied to clipboard",
          description: "Product ID copied to clipboard",
        });
      },
    },
    {
      type: "separator",
    },
    {
      label: "Edit product",
      icon: "i-lucide-pencil",
    },
    {
      label: "View details",
      icon: "i-lucide-eye",
      onSelect() {
        navigateTo(`/products/${row.original.id}`);
      },
    },
    {
      type: "separator",
    },
    {
      label: "Delete product",
      icon: "i-lucide-trash",
      color: "error",
      onSelect() {
        deleteProduct(row.original.id, row.original.name);
      },
    },
  ];
}

const columns: TableColumn<Product>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Product Name",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }) => {
      return h(
        "div",
        { class: "font-medium text-highlighted" },
        row.original.name
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => {
      return h(
        "span",
        { class: "text-muted font-mono text-sm" },
        row.original.slug
      );
    },
  },
  {
    accessorKey: "variants",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Price",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }) => {
      const firstVariant = row.original.variants?.[0];
      if (!firstVariant) return "N/A";
      return h(
        "span",
        { class: "font-medium" },
        `$${(firstVariant.price / 100).toLocaleString()}`
      );
    },
  },
  {
    accessorKey: "variants",
    header: "Stock",
    cell: ({ row }) => {
      const firstVariant = row.original.variants?.[0];
      if (!firstVariant) return "N/A";

      const stockLevel = firstVariant.stockLevel;
      const isInStock = stockLevel === "IN_STOCK";
      const color = isInStock ? "success" : "error";
      const variant = "subtle";

      return h(UBadge, { class: "capitalize", variant, color }, () =>
        isInStock ? "In Stock" : "Out of Stock"
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
            })
        )
      );
    },
  },
];
</script>

<template>
  <UDashboardPanel id="products">
    <template #header>
      <UDashboardNavbar title="Products">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Add Product"
            variant="outline"
            to="/products/create"
            icon="i-heroicons-plus"
          />
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
            Failed to Load Products
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ error }}
          </p>
          <UButton
            :loading="loading"
            color="primary"
            variant="solid"
            size="lg"
            @click="fetchProducts"
          >
            <i class="i-heroicons-arrow-path mr-2" />
            Try Again
          </UButton>
        </div>
      </div>

      <!-- Loading State with Skeleton -->
      <div v-else-if="loading && data.length === 0" class="space-y-6">
        <!-- Search Bar Skeleton -->
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <div class="max-w-sm w-full">
            <div
              class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          </div>
        </div>

        <!-- Table Skeleton -->
        <div
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <!-- Table Header -->
          <div
            class="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700"
          >
            <div class="grid grid-cols-6 gap-4">
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 ml-auto"
              />
            </div>
          </div>
          <!-- Table Rows -->
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="i in pagination.pageSize" :key="i" class="px-6 py-4">
              <div class="grid grid-cols-6 gap-4 items-center">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20"
                />
                <div
                  class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Skeleton -->
        <div
          class="flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4"
        >
          <div
            class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"
          />
          <div class="flex items-center gap-1.5">
            <div
              class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
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
              >Loading products...</span
            >
          </div>
        </div>
      </div>

      <!-- Content State -->
      <div v-else class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <UInput
            :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search products..."
            :disabled="loading"
            @update:model-value="
              table?.tableApi?.getColumn('name')?.setFilterValue($event)
            "
          />
        </div>

        <UTable
          ref="table"
          class="shrink-0"
          :data="data"
          :columns="columns"
          :loading="loading"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
          }"
        />

        <div
          class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
        >
          <div class="text-sm text-muted">
            <span v-if="!loading">
              Showing
              {{ pagination.pageIndex * pagination.pageSize + 1 }}
              to
              {{
                Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  totalItems
                )
              }}
              of
              {{ totalItems }}
              products.
            </span>
            <span v-else class="opacity-50">Loading...</span>
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :page="pagination.pageIndex + 1"
              :page-count="Math.ceil(totalItems / pagination.pageSize)"
              :total="totalItems"
              :disabled="loading"
              @update:page="(p: number) => pagination.pageIndex = p - 1"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
