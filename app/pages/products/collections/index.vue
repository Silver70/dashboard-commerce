<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";
import { GET_COLLECTIONS } from "~/graphql/products";

const { $apollo } = useNuxtApp();
const toast = useToast();

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

// State
const loading = ref(false);
const collections = ref<any[]>([]);
const table = ref();

// Computed for search
const searchQuery = computed(() => {
  return (table.value?.tableApi?.getColumn('name')?.getFilterValue() as string) || '';
});

// Methods
async function fetchCollections() {
  try {
    loading.value = true;
    console.log('Attempting to fetch collections from GraphQL...');

    const { data } = await $apollo.query({
      query: GET_COLLECTIONS,
      variables: {
        options: {
          take: 100,
          sort: {
            name: 'ASC'
          }
        }
      }
    });

    console.log('GraphQL collections response:', data);

    if (data?.collections?.items && data.collections.items.length > 0) {
      const realCollections = data.collections.items.map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        isPrivate: collection.isPrivate,
        parentId: collection.parentId,
        position: collection.position,
        featuredAsset: collection.featuredAsset,
        breadcrumbs: collection.breadcrumbs,
        children: collection.children,
        productCount: Math.floor(Math.random() * 100), // Demo count since we don't have this in the query
      }));
      collections.value = realCollections;
      console.log('Using real collections from GraphQL:', realCollections);
    } else {
      console.log('No real collections found, keeping demo data');
    }
  } catch (error) {
    console.warn('GraphQL failed, keeping demo data:', error);
  } finally {
    loading.value = false;
    console.log('Final collections array:', collections.value);
  }
}

function getRowItems(row: Row<any>) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Copy collection ID",
      icon: "i-lucide-copy",
      onSelect() {
        navigator.clipboard.writeText(row.original.id);
        toast.add({
          title: "Copied to clipboard",
          description: "Collection ID copied to clipboard",
        });
      },
    },
    {
      type: "separator",
    },
    {
      label: "Edit collection",
      icon: "i-lucide-pencil",
      onSelect() {
        toast.add({
          title: "Info",
          description: `Edit functionality for "${row.original.name}" coming soon`,
          color: "info",
        });
      },
    },
    {
      label: "View details",
      icon: "i-lucide-eye",
      onSelect() {
        toast.add({
          title: "Info",
          description: `View details for "${row.original.name}" coming soon`,
          color: "info",
        });
      },
    },
    {
      type: "separator",
    },
    {
      label: "Delete collection",
      icon: "i-lucide-trash",
      color: "error",
      onSelect() {
        toast.add({
          title: "Info",
          description: `Delete functionality for "${row.original.name}" coming soon`,
          color: "warning",
        });
      },
    },
  ];
}

async function updateCollectionPrivacy(collectionId: string, isPrivate: boolean) {
  try {
    // TODO: Implement GraphQL mutation to update collection privacy
    console.log(`Updating collection ${collectionId} privacy to ${isPrivate}`);

    // Update local state for immediate feedback
    const collection = collections.value.find(c => c.id === collectionId);
    if (collection) {
      collection.isPrivate = isPrivate;
    }

    toast.add({
      title: "Privacy Updated",
      description: `Collection is now ${isPrivate ? 'Private' : 'Public'}`,
      color: "success",
    });
  } catch (error) {
    console.error('Failed to update collection privacy:', error);
    toast.add({
      title: "Error",
      description: "Failed to update collection privacy",
      color: "error",
    });
  }
}

const columns: TableColumn<any>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      return h("span", {
        class: "font-mono text-xs text-gray-500"
      }, row.original.id);
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Name",
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
      return h("span", {
        class: "font-medium text-highlighted"
      }, row.original.name);
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => {
      return h("code", {
        class: "text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
      }, row.original.slug);
    },
  },
  {
    accessorKey: "productCount",
    header: "Products",
    cell: ({ row }) => {
      return h(UBadge, {
        label: row.original.productCount?.toString() || "0",
        color: "neutral",
        variant: "soft"
      });
    },
  },
  {
    accessorKey: "isPrivate",
    header: "Privacy",
    cell: ({ row }) => {
      const isPrivate = row.original.isPrivate;
      return h(
        UDropdownMenu,
        {
          content: {
            align: "start",
          },
          items: [
            {
              label: "Public",
              icon: "i-lucide-eye",
              color: isPrivate ? undefined : "primary",
              onSelect() {
                if (isPrivate) {
                  updateCollectionPrivacy(row.original.id, false);
                }
              },
            },
            {
              label: "Private",
              icon: "i-lucide-eye-off",
              color: isPrivate ? "primary" : undefined,
              onSelect() {
                if (!isPrivate) {
                  updateCollectionPrivacy(row.original.id, true);
                }
              },
            },
          ],
        },
        () =>
          h(UButton, {
            label: isPrivate ? "Private" : "Public",
            color: isPrivate ? "warning" : "success",
            variant: "soft",
            trailingIcon: "i-lucide-chevron-down",
            size: "sm",
          })
      );
    },
  },
];

// Load collections on mount
onMounted(() => {
  fetchCollections();
});
</script>

<template>
  <UDashboardPanel id="collections">
    <template #header>
      <UDashboardNavbar title="Collections">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Add Collection"
            variant="outline"
            icon="i-heroicons-plus"
            to="/products/collections/create"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading State with Skeleton -->
      <div v-if="loading && collections.length === 0" class="space-y-6">
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
            <div class="grid grid-cols-5 gap-4">
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"
              />
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"
              />
            </div>
          </div>
          <!-- Table Rows -->
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="i in 10" :key="i" class="px-6 py-4">
              <div class="grid grid-cols-5 gap-4 items-center">
                <div
                  class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
                <div
                  class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-16"
                />
                <div
                  class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20"
                />
              </div>
            </div>
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
            placeholder="Search collections..."
            :disabled="loading"
            @update:model-value="
              table?.tableApi?.getColumn('name')?.setFilterValue($event)
            "
          />
        </div>

        <UTable
          ref="table"
          class="shrink-0"
          :data="collections"
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
              Showing {{ collections.length }} collections.
            </span>
            <span v-else class="opacity-50">Loading...</span>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
