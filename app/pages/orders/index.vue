<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";
import type { Order } from "~/types";
import { GET_ORDERS } from "~/graphql/orders";
import { formatDistanceToNow } from "date-fns";

const { $apollo } = useNuxtApp();

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

const data = ref<Order[]>([]);
const totalItems = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const table = ref();

async function fetchOrders() {
  try {
    loading.value = true;
    error.value = null;

    // Wait for Apollo client to be available
    await nextTick();

    if (!$apollo) {
      throw new Error("Apollo client not available");
    }

    const { data: apolloData } = await $apollo.query({
      query: GET_ORDERS,
      variables: {
        options: {
          take: pagination.value.pageSize,
          skip: pagination.value.pageIndex * pagination.value.pageSize,
        },
      },
      fetchPolicy: "network-only",
    });

    data.value = apolloData?.orders?.items || [];
    totalItems.value = apolloData?.orders?.totalItems || 0;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch orders";
    console.error("Error fetching orders:", err);
    toast.add({
      title: "Error",
      description: error.value || "Failed to fetch orders",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Initial fetch on mount
onMounted(() => {
  fetchOrders();
});

// Watch pagination changes
watch(pagination, fetchOrders, { deep: true });

function getRowItems(row: Row<Order>) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Copy order ID",
      icon: "i-lucide-copy",
      onSelect() {
        navigator.clipboard.writeText(row.original.id);
        toast.add({
          title: "Copied to clipboard",
          description: "Order ID copied to clipboard",
        });
      },
    },
    {
      label: "Copy order code",
      icon: "i-lucide-hash",
      onSelect() {
        navigator.clipboard.writeText(row.original.code);
        toast.add({
          title: "Copied to clipboard",
          description: "Order code copied to clipboard",
        });
      },
    },
    {
      type: "separator",
    },
    {
      label: "View details",
      icon: "i-lucide-eye",
      onSelect() {
        navigateTo(`/orders/${row.original.id}`);
      },
    },
  ];
}

function getOrderStateColor(state: string): string {
  const stateColors: Record<string, string> = {
    AddingItems: "neutral",
    ArrangingPayment: "warning",
    PaymentAuthorized: "info",
    PaymentSettled: "success",
    PartiallyShipped: "info",
    Shipped: "success",
    PartiallyDelivered: "info",
    Delivered: "success",
    Cancelled: "error",
    Modifying: "warning",
    ArrangingAdditionalPayment: "warning",
  };
  return stateColors[state] || "neutral";
}

function formatOrderState(state: string): string {
  return state.replace(/([A-Z])/g, " $1").trim();
}

const columns: TableColumn<Order>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Order Code",
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
        { class: "font-medium text-highlighted font-mono" },
        row.original.code
      );
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer) return "Guest";
      return h(
        "div",
        { class: "flex flex-col" },
        [
          h("span", { class: "font-medium" }, `${customer.firstName} ${customer.lastName}`),
          h("span", { class: "text-muted text-xs" }, customer.emailAddress)
        ]
      );
    },
  },
  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => {
      const state = row.original.state;
      const color = getOrderStateColor(state);
      const variant = "subtle";

      return h(UBadge, { class: "capitalize", variant, color }, () =>
        formatOrderState(state)
      );
    },
  },
  {
    accessorKey: "totalQuantity",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Items",
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
        "span",
        { class: "font-medium" },
        row.original.totalQuantity.toString()
      );
    },
  },
  {
    accessorKey: "totalWithTax",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Total",
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
      const total = row.original.totalWithTax / 100;
      const currency = row.original.currencyCode;
      return h(
        "span",
        { class: "font-medium" },
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD'
        }).format(total)
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return h(
        "span",
        { class: "text-muted text-sm" },
        formatDistanceToNow(date, { addSuffix: true })
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
  <UDashboardPanel id="orders">
    <template #header>
      <UDashboardNavbar title="Orders" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
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
            Failed to Load Orders
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ error }}
          </p>
          <UButton
            :loading="loading"
            color="primary"
            variant="solid"
            size="lg"
            @click="fetchOrders"
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
            <div class="grid grid-cols-7 gap-4">
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
              <div class="grid grid-cols-7 gap-4 items-center">
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
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
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
              >Loading orders...</span
            >
          </div>
        </div>
      </div>

      <!-- Content State -->
      <div v-else class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <UInput
            :model-value="(table?.tableApi?.getColumn('code')?.getFilterValue() as string)"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search orders..."
            :disabled="loading"
            @update:model-value="
              table?.tableApi?.getColumn('code')?.setFilterValue($event)
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
              orders.
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
