<script setup lang="ts">
import { z } from "zod";
import {
  CREATE_PRODUCT,
  CREATE_PRODUCT_OPTION_GROUP,
  ADD_OPTION_GROUP_TO_PRODUCT,
  CREATE_PRODUCT_VARIANTS
} from "~/graphql/products";

const { $apollo } = useNuxtApp();
const toast = useToast();
const router = useRouter();

// Form validation schemas
const optionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Option name is required"),
  code: z.string().min(1, "Option code is required"),
});

const optionGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Option group name is required"),
  code: z.string().min(1, "Option group code is required"),
  options: z.array(optionSchema).min(1, "At least one option is required"),
});

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  stockOnHand: z.number().min(0, "Stock must be positive"),
  enabled: z.boolean(),
  options: z.array(
    z.object({
      optionGroupId: z.string(),
      optionId: z.string(),
    })
  ),
});

const schema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  enabled: z.boolean(),
  featuredAssetId: z.string().optional(),
  assetIds: z.array(z.string()).optional(),
  facetValueIds: z.array(z.string()).optional(),
  optionGroups: z.array(optionGroupSchema),
  variants: z.array(variantSchema),
  translations: z
    .array(
      z.object({
        languageCode: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

type FormData = z.infer<typeof schema>;
type OptionGroup = z.infer<typeof optionGroupSchema>;
type Option = z.infer<typeof optionSchema>;

// Form state
const loading = ref(false);
const form = ref<FormData>({
  name: "",
  slug: "",
  description: "",
  enabled: true,
  featuredAssetId: undefined,
  assetIds: [],
  facetValueIds: [],
  optionGroups: [],
  variants: [],
  translations: [],
  customFields: {},
});

// Generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Simple slug generation
function generateSlug() {
  if (form.value.name) {
    form.value.slug = form.value.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }
}

// Auto-generate slug only when name field loses focus and slug is empty
function handleNameBlur() {
  if (form.value.name && !form.value.slug) {
    generateSlug();
  }
}

// Option group management
function addOptionGroup() {
  const newGroup: OptionGroup = {
    id: generateId(),
    name: "",
    code: "",
    options: [],
  };
  form.value.optionGroups.push(newGroup);
}

function removeOptionGroup(groupIndex: number) {
  form.value.optionGroups.splice(groupIndex, 1);
}

// Option input values for tag-based input
const optionInputValues = ref<Record<number, string>>({});

// Get option input value for a specific group
function getOptionInputValue(groupIndex: number): string {
  return optionInputValues.value[groupIndex] || "";
}

// Set option input value for a specific group
function setOptionInputValue(groupIndex: number, value: string) {
  optionInputValues.value[groupIndex] = value;
}

// Handle keydown events for tag input
function handleOptionKeydown(event: KeyboardEvent, groupIndex: number) {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();

  // Handle Enter, comma, or space
  if (
    (event.key === "Enter" || event.key === "," || event.key === " ") &&
    value
  ) {
    event.preventDefault();
    addOptionFromInput(groupIndex, value);
    setOptionInputValue(groupIndex, "");
  }

  // Handle backspace when input is empty to remove last tag
  if (event.key === "Backspace" && !value) {
    const group = form.value.optionGroups[groupIndex];
    if (group && group.options.length > 0) {
      removeOption(groupIndex, group.options.length - 1);
    }
  }
}

// Add option from tag input
function addOptionFromInput(groupIndex: number, optionName: string) {
  const group = form.value.optionGroups[groupIndex];
  if (!group) return;

  // Check if option already exists
  const exists = group.options.some(
    (option) => option.name.toLowerCase() === optionName.toLowerCase()
  );

  if (exists) return;

  const newOption: Option = {
    id: generateId(),
    name: optionName,
    code: optionName.toLowerCase().replace(/[^a-z0-9]/g, ""),
  };

  group.options.push(newOption);
}

function removeOption(groupIndex: number, optionIndex: number) {
  const group = form.value.optionGroups[groupIndex];
  if (!group) return;

  group.options.splice(optionIndex, 1);
}

// Auto-generate codes when field loses focus and code is empty
function handleOptionGroupNameBlur(groupIndex: number) {
  const group = form.value.optionGroups[groupIndex];
  if (!group) return;

  if (group.name && !group.code) {
    group.code = group.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
}

// Generate all possible variant combinations
function generateVariants() {
  if (form.value.optionGroups.length === 0) {
    // No option groups, create a single default variant
    form.value.variants = [
      {
        name: form.value.name || "Default",
        sku: form.value.slug || "default",
        price: 0,
        stockOnHand: 0,
        enabled: true,
        options: [],
      },
    ];
    return;
  }

  // Filter out option groups that have no valid options
  const validGroups = form.value.optionGroups.filter((group) =>
    group.options.some((option) => option.name && option.code)
  );

  if (validGroups.length === 0) {
    form.value.variants = [];
    return;
  }

  // Generate all combinations
  const combinations = generateCombinations(validGroups);

  form.value.variants = combinations.map((combination) => ({
    name: generateVariantName(combination),
    sku: generateVariantSku(combination),
    price: 0,
    stockOnHand: 0,
    enabled: true,
    options: combination,
  }));
}

function generateCombinations(
  groups: OptionGroup[]
): Array<Array<{ optionGroupId: string; optionId: string }>> {
  if (groups.length === 0) return [];

  const firstGroup = groups[0];
  if (!firstGroup) return [];

  if (groups.length === 1) {
    return firstGroup.options
      .filter((option) => option.name && option.code)
      .map((option) => [{ optionGroupId: firstGroup.id, optionId: option.id }]);
  }

  const restGroups = groups.slice(1);
  const firstOptions = firstGroup.options.filter(
    (option) => option.name && option.code
  );
  const restCombinations = generateCombinations(restGroups);

  const result = [];
  for (const option of firstOptions) {
    for (const restCombination of restCombinations) {
      result.push([
        { optionGroupId: firstGroup.id, optionId: option.id },
        ...restCombination,
      ]);
    }
  }
  return result;
}

function generateVariantName(
  options: Array<{ optionGroupId: string; optionId: string }>
): string {
  const optionNames = options
    .map((opt) => {
      const group = form.value.optionGroups.find(
        (g) => g.id === opt.optionGroupId
      );
      const option = group?.options.find((o) => o.id === opt.optionId);
      return option?.name || "";
    })
    .filter(Boolean);

  return optionNames.length > 0
    ? `${form.value.name} - ${optionNames.join(" / ")}`
    : form.value.name || "Variant";
}

function generateVariantSku(
  options: Array<{ optionGroupId: string; optionId: string }>
): string {
  const optionCodes = options
    .map((opt) => {
      const group = form.value.optionGroups.find(
        (g) => g.id === opt.optionGroupId
      );
      const option = group?.options.find((o) => o.id === opt.optionId);
      return option?.code || "";
    })
    .filter(Boolean);

  const baseSlug = form.value.slug || "product";
  return optionCodes.length > 0
    ? `${baseSlug}-${optionCodes.join("-")}`
    : baseSlug;
}

// Helper function to get description preview for SEO
function getDescriptionPreview(): string {
  const description = form.value.description;
  if (!description) {
    return "Product description will appear here...";
  }

  const truncated = description.substring(0, 120);
  const ellipsis = description.length > 120 ? "..." : "";
  return truncated + ellipsis;
}

// Form submission
async function onSubmit() {
  try {
    loading.value = true;

    // Validate that we have at least one variant if option groups exist
    if (form.value.optionGroups.length > 0 && form.value.variants.length === 0) {
      throw new Error("Please generate variants before creating the product");
    }

    // Step 1: Create the basic product
    const productInput = {
      translations: [
        {
          languageCode: "en",
          name: form.value.name,
          slug: form.value.slug,
          description: form.value.description || "",
        },
      ],
      enabled: form.value.enabled,
      featuredAssetId: form.value.featuredAssetId,
      assetIds: form.value.assetIds || [],
      facetValueIds: form.value.facetValueIds || [],
      customFields: form.value.customFields || {},
    };

    const { data: productData } = await $apollo.mutate({
      mutation: CREATE_PRODUCT,
      variables: { input: productInput },
    });

    const product = productData?.createProduct;

    if (!product?.id) {
      throw new Error("Product was created but no ID was returned");
    }

    // Step 2: Create option groups and add them to the product (if any)
    const createdOptionGroups: any[] = [];
    for (const group of form.value.optionGroups) {
      // Create the option group with all its options at once
      const { data: groupData } = await $apollo.mutate({
        mutation: CREATE_PRODUCT_OPTION_GROUP,
        variables: {
          input: {
            code: group.code,
            translations: [
              {
                languageCode: "en",
                name: group.name,
              },
            ],
            options: group.options.map(option => ({
              code: option.code,
              translations: [
                {
                  languageCode: "en",
                  name: option.name,
                },
              ],
            })),
          },
        },
      });

      const createdGroup = groupData?.createProductOptionGroup;
      if (!createdGroup) {
        throw new Error(`Failed to create option group: ${group.name}`);
      }



      // Add the option group to the product
      const { data: addGroupData } = await $apollo.mutate({
        mutation: ADD_OPTION_GROUP_TO_PRODUCT,
        variables: {
          productId: product.id,
          optionGroupId: createdGroup.id,
        },
      });

     

      createdOptionGroups.push(createdGroup);
    }

    // Step 3: Create product variants (if any)
    if (form.value.variants.length > 0) {
      const variantInputs = form.value.variants.map(variant => {
        // Map the variant's option IDs to the actual created option IDs
        const optionIds = variant.options.map(variantOption => {
          // Find the original group and option from our form data
          const originalGroup = form.value.optionGroups.find(og => og.id === variantOption.optionGroupId);
          const originalOption = originalGroup?.options.find(o => o.id === variantOption.optionId);

          if (!originalOption || !originalGroup) {
            console.warn('Could not find original option:', { variantOption, originalGroup, originalOption });
            return null;
          }

          // Find the corresponding created group by matching the code
          const createdGroup = createdOptionGroups.find((g: any) => g.code === originalGroup.code);

          if (!createdGroup?.options) {
            console.warn('Could not find created group or its options:', { originalGroup, createdGroup });
            return null;
          }

          // Find the created option by matching the code
          const createdOption = createdGroup.options.find((o: any) => o.code === originalOption.code);

          if (!createdOption) {
            console.warn('Could not find created option:', { originalOption, createdGroup });
            return null;
          }

          return createdOption.id;
        }).filter(Boolean);

        console.log('Variant options mapping:', {
          variantName: variant.name,
          originalOptions: variant.options,
          mappedOptionIds: optionIds,
          createdOptionGroups: createdOptionGroups.map(g => ({ id: g.id, code: g.code, name: g.name }))
        });

        // Validate that we have exactly one option from each group
        if (optionIds.length !== createdOptionGroups.length) {
          throw new Error(`Variant "${variant.name}" should have ${createdOptionGroups.length} options, but only has ${optionIds.length}`);
        }

        return {
          productId: product.id,
          translations: [
            {
              languageCode: "en",
              name: variant.name,
            },
          ],
          sku: variant.sku,
          price: Math.round(variant.price * 100), // Convert to cents
          stockOnHand: variant.stockOnHand,
          enabled: variant.enabled,
          optionIds,
        };
      });

      await $apollo.mutate({
        mutation: CREATE_PRODUCT_VARIANTS,
        variables: { input: variantInputs },
      });
    }

    toast.add({
      title: "Success",
      description: "Product created successfully",
      color: "success",
    });

    // Navigate to the created product
    await router.push(`/products/${product.id}`);
  } catch (error: any) {
    console.error("Product creation error:", error);

    let errorMessage = "Failed to create product";

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
  router.push("/products");
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Product">
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
              form="product-form"
              :loading="loading"
              color="primary"
            >
              Create Product
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UForm
          id="product-form"
          :schema="schema"
          :state="form"
          class="w-full flex gap-6"
          @submit="onSubmit"
        >
          <!-- Main Content Area - Left Side (2/3) -->
          <div class="w-2/3 space-y-6">
            <!-- Basic Information -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Basic Information</h2>
              </template>

              <div class="space-y-4">
                <div class="flex gap-2 w-full">
                  <UFormGroup label="Product Name" name="name" required>
                    <UInput
                      v-model="form.name"
                      placeholder="Enter product name"
                      :disabled="loading"
                      @blur="handleNameBlur"
                    />
                  </UFormGroup>

                  <UFormGroup label="Slug" name="slug" required>
                    <div class="flex gap-2">
                      <UInput
                        v-model="form.slug"
                        placeholder="product-slug"
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
                    placeholder="Product description..."
                    :rows="3"
                    :disabled="loading"
                    class="w-full"
                  />
                </UFormGroup>

                <UFormGroup label="Status" name="enabled" class="flex pt-3">
                  <UCheckbox v-model="form.enabled" :disabled="loading" />
                  <span class="ml-2 text-sm">
                    {{ form.enabled ? "Active" : "Inactive" }}
                  </span>
                </UFormGroup>
              </div>
            </UCard>

            <!-- Product Images -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Product Images</h2>
              </template>

              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Featured Image Upload -->
                  <UFormGroup label="Featured Image" name="featuredAssetId">
                    <div
                      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
                    >
                      <div class="space-y-2">
                        <i
                          class="i-heroicons-photo text-4xl text-gray-400 mx-auto"
                        />
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          <p>Drag and drop an image here, or click to browse</p>
                          <p class="text-xs">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <UButton
                          variant="outline"
                          size="sm"
                          :disabled="loading"
                        >
                          Choose File
                        </UButton>
                      </div>
                    </div>
                  </UFormGroup>

                  <!-- Additional Images -->
                  <UFormGroup label="Additional Images" name="assetIds">
                    <div
                      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
                    >
                      <div class="space-y-2">
                        <i
                          class="i-heroicons-photo text-4xl text-gray-400 mx-auto"
                        />
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          <p>Add more product images</p>
                          <p class="text-xs">You can upload multiple images</p>
                        </div>
                        <UButton
                          variant="outline"
                          size="sm"
                          :disabled="loading"
                        >
                          Add Images
                        </UButton>
                      </div>
                    </div>
                  </UFormGroup>
                </div>
              </div>
            </UCard>

            <!-- Option Groups -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Product Options</h2>
                  <UButton
                    size="sm"
                    variant="outline"
                    icon="i-heroicons-plus"
                    :disabled="loading"
                    @click="addOptionGroup"
                  >
                    Add Option Group
                  </UButton>
                </div>
              </template>

              <div
                v-if="form.optionGroups.length === 0"
                class="text-center py-8"
              >
                <div class="text-gray-400 mb-4">
                  <i class="i-heroicons-squares-2x2 text-4xl" />
                </div>
                <h3
                  class="text-lg font-medium text-gray-900 dark:text-white mb-2"
                >
                  No Option Groups
                </h3>
                <p class="text-gray-500 mb-4">
                  Add option groups like Size, Color, or Material to create
                  product variants
                </p>
                <UButton
                  variant="outline"
                  icon="i-heroicons-plus"
                  :disabled="loading"
                  @click="addOptionGroup"
                >
                  Add First Option Group
                </UButton>
              </div>

              <div v-else class="space-y-6">
                <div
                  v-for="(group, groupIndex) in form.optionGroups"
                  :key="group.id"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-medium text-gray-900 dark:text-white">
                      Option Group {{ groupIndex + 1 }}
                    </h3>
                    <UButton
                      size="sm"
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      :disabled="loading"
                      @click="removeOptionGroup(groupIndex)"
                    />
                  </div>

                  <div class="space-y-4 flex gap-4">
                    <UFormGroup
                      label="Group Name"
                      :name="`optionGroups.${groupIndex}.name`"
                      required
                    >
                      <UInput
                        v-model="group.name"
                        placeholder="e.g., Size, Color"
                        :disabled="loading"
                        @blur="handleOptionGroupNameBlur(groupIndex)"
                      />
                    </UFormGroup>

                    <UFormGroup
                      label="Values"
                      :name="`optionGroups.${groupIndex}.options`"
                    >
                      <div class="space-y-3">
                        <UInput
                          :model-value="getOptionInputValue(groupIndex)"
                          placeholder="Type option values and press Enter"
                          :disabled="loading"
                          @keydown="handleOptionKeydown($event, groupIndex)"
                          @update:model-value="
                            setOptionInputValue(groupIndex, $event)
                          "
                        />

                        <!-- Option tags display -->
                        <div
                          v-if="group.options && group.options.length > 0"
                          class="flex flex-wrap gap-2"
                        >
                          <div
                            v-for="(option, optionIndex) in group.options"
                            :key="option.id"
                            class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm"
                          >
                            <span>{{ option.name }}</span>
                            <UButton
                              size="2xs"
                              color="error"
                              variant="ghost"
                              icon="i-heroicons-x-mark"
                              :disabled="loading"
                              @click="removeOption(groupIndex, optionIndex)"
                            />
                          </div>
                        </div>
                        <!-- Hidden code field - auto-generated from name -->
                        <input v-model="group.code" type="hidden" />
                      </div>
                    </UFormGroup>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Generated Variants -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">Product Variants</h2>
                  <div class="flex items-center gap-3">
                    <div class="text-sm text-gray-500">
                      {{ form.variants.length }} variant{{
                        form.variants.length !== 1 ? "s" : ""
                      }}
                    </div>
                    <UButton
                      size="sm"
                      variant="outline"
                      icon="i-heroicons-sparkles"
                      :disabled="loading || form.optionGroups.length === 0"
                      @click="generateVariants"
                    >
                      Generate Variants
                    </UButton>
                  </div>
                </div>
              </template>

              <div v-if="form.variants.length === 0" class="text-center py-8">
                <div class="text-gray-400 mb-4">
                  <i class="i-heroicons-cube text-4xl" />
                </div>
                <h3
                  class="text-lg font-medium text-gray-900 dark:text-white mb-2"
                >
                  No Variants Generated
                </h3>
                <p class="text-gray-500">
                  Variants will be automatically generated when you add option
                  groups
                </p>
              </div>

              <div v-else class="space-y-4">
                <div
                  v-for="(variant, variantIndex) in form.variants"
                  :key="variantIndex"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Variant Name
                      </label>
                      <div
                        class="text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {{ variant.name }}
                      </div>
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        SKU
                      </label>
                      <UInput
                        v-model="variant.sku"
                        size="sm"
                        :disabled="loading"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Price
                      </label>
                      <UInput
                        v-model.number="variant.price"
                        type="number"
                        size="sm"
                        step="0.01"
                        min="0"
                        :disabled="loading"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Stock
                      </label>
                      <UInput
                        v-model.number="variant.stockOnHand"
                        type="number"
                        size="sm"
                        min="0"
                        :disabled="loading"
                      />
                    </div>
                  </div>

                  <div class="mt-3 flex items-center">
                    <UCheckbox v-model="variant.enabled" :disabled="loading" />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {{ variant.enabled ? "Active" : "Inactive" }}
                    </span>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Right Sidebar - Secondary Information (1/3) -->
          <div class="w-1/3 space-y-6">
            <!-- Organization -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Organization</h2>
              </template>

              <div class="space-y-4">
                <UFormGroup label="Categories & Tags" name="facetValueIds">
                  <USelectMenu
                    v-model="form.facetValueIds"
                    :options="[]"
                    multiple
                    placeholder="Select categories"
                    :disabled="loading"
                  >
                    <template #empty>
                      <div class="text-center py-4">
                        <p class="text-sm text-gray-500">
                          No categories available
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                          Categories will be loaded from your Vendure instance
                        </p>
                      </div>
                    </template>
                  </USelectMenu>
                  <template #help>
                    <span class="text-sm text-gray-500">
                      Choose categories and tags to help organize your product
                    </span>
                  </template>
                </UFormGroup>
              </div>
            </UCard>

            <!-- SEO Preview -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">SEO Preview</h2>
              </template>

              <div class="space-y-4">
                <div
                  class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                >
                  <div class="flex items-start">
                    <i
                      class="i-heroicons-information-circle text-blue-500 mt-0.5 mr-3"
                    />
                    <div class="flex-1">
                      <h3
                        class="text-sm font-medium text-blue-800 dark:text-blue-200"
                      >
                        SEO Preview
                      </h3>
                      <div
                        class="mt-2 text-sm text-blue-700 dark:text-blue-300"
                      >
                        <div class="font-medium">
                          {{ form.name || "Product Name" }}
                        </div>
                        <div class="text-green-600 dark:text-green-400 text-xs">
                          yourstore.com/products/{{
                            form.slug || "product-slug"
                          }}
                        </div>
                        <div
                          class="text-gray-600 dark:text-gray-400 text-xs mt-1"
                        >
                          {{ getDescriptionPreview() }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Meta Title
                    </label>
                    <UInput
                      :model-value="form.name"
                      placeholder="SEO title"
                      :disabled="true"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Uses product name by default
                    </p>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      URL Slug
                    </label>
                    <UInput :model-value="form.slug" :disabled="true" />
                    <p class="text-xs text-gray-500 mt-1">
                      Auto-generated from product name
                    </p>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Product Summary -->
            <UCard>
              <template #header>
                <h2 class="text-lg font-semibold">Summary</h2>
              </template>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Status:</span>
                    <div class="font-medium">
                      <UBadge
                        :color="form.enabled ? 'success' : 'neutral'"
                        :label="form.enabled ? 'Active' : 'Inactive'"
                        size="xs"
                      />
                    </div>
                  </div>
                  <div>
                    <span class="text-gray-500">Variants:</span>
                    <div class="font-medium">
                      {{ form.variants.length }}
                    </div>
                  </div>
                  <div>
                    <span class="text-gray-500">Option Groups:</span>
                    <div class="font-medium">
                      {{ form.optionGroups.length }}
                    </div>
                  </div>
                  <div>
                    <span class="text-gray-500">Categories:</span>
                    <div class="font-medium">
                      {{ form.facetValueIds?.length || 0 }}
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
