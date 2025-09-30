<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";
import { GET_FACETS } from "~/graphql/products";

const { $apollo } = useNuxtApp();

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();

interface Facet {
  id: string;
  name: string;
  code: string;
  isPrivate: boolean;
  languageCode: string;
  values: {
    id: string;
    name: string;
    code: string;
  }[];
}

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

const data = ref<Facet[]>([]);
const totalItems = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const table = ref();

async function fetchFacets() {
  try {
    loading.value = true;
    error.value = null;

    await nextTick();

    if (!$apollo) {
      throw new Error("Apollo client not available");
    }

    const { data: apolloData } = await $apollo.query({
      query: GET_FACETS,
      variables: {
        options: {
          take: pagination.value.pageSize,
          skip: pagination.value.pageIndex * pagination.value.pageSize,
        },
      },
      fetchPolicy: "network-only",
    });

    data.value = apolloData?.facets?.items || [];
    totalItems.value = apolloData?.facets?.totalItems || 0;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch attributes";
    console.error("Error fetching attributes:", err);
    toast.add({
      title: "Error",
      description: error.value || "Failed to fetch attributes",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchFacets();
});

watch(pagination, fetchFacets, { deep: true });

function getRowItems(row: Row<Facet>) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Copy attribute ID",
      icon: "i-lucide-copy",
      onSelect() {
        navigator.clipboard.writeText(row.original.id);
        toast.add({
          title: "Copied to clipboard",
          description: "Attribute ID copied to clipboard",
        });
      },
    },
    {
      type: "separator",
    },
    {
      label: "Edit attribute",
      icon: "i-lucide-pencil",
    },
    {
      label: "View details",
      icon: "i-lucide-eye",
    },
    {
      type: "separator",
    },
    {
      label: "Delete attribute",
      icon: "i-lucide-trash",
      color: "error",
      onSelect() {
        toast.add({
          title: "Delete functionality",
          description: "Delete functionality to be implemented",
          color: "warning",
        });
      },
    },
  ];
}

const columns: TableColumn<Facet>[] = [
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
        label: "Attribute Name",
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
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      return h(
        "span",
        { class: "text-muted font-mono text-sm" },
        row.original.code
      );
    },
  },
  {
    accessorKey: "values",
    header: "Values",
    cell: ({ row }) => {
      const valueCount = row.original.values?.length || 0;
      return h(
        "span",
        { class: "font-medium" },
        `${valueCount} value${valueCount !== 1 ? "s" : ""}`
      );
    },
  },
  {
    accessorKey: "isPrivate",
    header: "Visibility",
    cell: ({ row }) => {
      const isPrivate = row.original.isPrivate;
      const color = isPrivate ? "warning" : "success";
      const variant = "subtle";

      return h(UBadge, { class: "capitalize", variant, color }, () =>
        isPrivate ? "Private" : "Public"
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
  <UDashboardPanel id="attributes">
    <template #header>
      <UDashboardNavbar title="Product Attributes">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Add Attribute"
            variant="outline"
            to="/products/attributes/create"
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
            Failed to Load Attributes
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ error }}
          </p>
          <UButton
            :loading="loading"
            color="primary"
            variant="solid"
            size="lg"
            @click="fetchFacets"
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
              >Loading attributes...</span
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
            placeholder="Search attributes..."
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
              attributes.
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
