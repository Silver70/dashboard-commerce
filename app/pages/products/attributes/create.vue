<script setup lang="ts">
import { z } from "zod";
import { CREATE_FACET } from "~/graphql/products";

const { $apollo } = useNuxtApp();
const toast = useToast();
const router = useRouter();

// Form validation schema
const schema = z.object({
  name: z
    .string()
    .min(1, "Attribute name is required")
    .max(255, "Name too long"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Code must contain only lowercase letters, numbers, and hyphens"
    ),
  isPrivate: z.boolean(),
  values: z.array(z.string()).min(1, "At least one value is required"),
});

type FormData = z.infer<typeof schema>;

// Form state
const loading = ref(false);
const form = ref<FormData>({
  name: "",
  code: "",
  isPrivate: false,
  values: [],
});

// For InputTags component
const attributeValues = ref<string[]>([]);

// Sync attributeValues with form.values
watch(
  attributeValues,
  (newValues) => {
    form.value.values = newValues;
  },
  { deep: true }
);

// Generate code from name
function generateCode() {
  if (form.value.name) {
    form.value.code = form.value.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }
}

// Auto-generate code when name field loses focus and code is empty
function handleNameBlur() {
  if (form.value.name && !form.value.code) {
    generateCode();
  }
}

// Form submission
async function onSubmit() {
  try {
    loading.value = true;

    // Validate that we have at least one value
    if (form.value.values.length === 0) {
      throw new Error("Please add at least one attribute value");
    }

    // Create the facet with values
    const facetInput = {
      code: form.value.code,
      isPrivate: form.value.isPrivate,
      translations: [
        {
          languageCode: "en",
          name: form.value.name,
        },
      ],
      values: form.value.values.map((value) => ({
        code: value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        translations: [
          {
            languageCode: "en",
            name: value,
          },
        ],
      })),
    };

    console.log("Facet input:", facetInput);

    const { data: facetData } = await $apollo.mutate({
      mutation: CREATE_FACET,
      variables: { input: facetInput },
    });

    console.log("Facet creation response:", facetData);

    const facet = facetData?.createFacet;

    if (!facet?.id) {
      throw new Error("Attribute was created but no ID was returned");
    }

    toast.add({
      title: "Success",
      description: `Attribute "${form.value.name}" created successfully with ${form.value.values.length} values`,
      color: "success",
    });

    // Navigate to the attributes list
    await router.push("/products/attributes");
  } catch (error: any) {
    console.error("Attribute creation error:", error);

    let errorMessage = "Failed to create attribute";

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
  router.push("/products/attributes");
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Attribute">
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
              form="attribute-form"
              :loading="loading"
              color="primary"
            >
              Create Attribute
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UForm
          id="attribute-form"
          :schema="schema"
          :state="form"
          class="w-full max-w-3xl mx-auto space-y-8"
          @submit="onSubmit"
        >
          <!-- Basic Information -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <i class="i-heroicons-tag text-xl text-primary" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold">Basic Information</h2>
                  <p class="text-sm text-gray-500">
                    Define the attribute name and unique code
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <UFormGroup
                label="Attribute Name"
                name="name"
                required
                class="w-full"
              >
                <UInput
                  v-model="form.name"
                  placeholder="e.g., Color, Size, Material"
                  :disabled="loading"
                  @blur="handleNameBlur"
                />
                <template #help>
                  <span class="text-sm text-gray-500">
                    The display name for this attribute (e.g., "Color", "Size")
                  </span>
                </template>
              </UFormGroup>

              <!-- Hidden code field - auto-generated from name -->
              <input v-model="form.code" type="hidden" />

              <UFormGroup
                label="Visibility"
                name="isPrivate"
                class="flex items-center pt-3"
              >
                <UCheckbox v-model="form.isPrivate" :disabled="loading" />
                <span class="ml-2 text-sm">
                  {{
                    form.isPrivate ? "Private Attribute" : "Public Attribute"
                  }}
                </span>
                <template #help>
                  <span class="text-sm text-gray-500">
                    Private attributes are not visible in the storefront
                  </span>
                </template>
              </UFormGroup>
            </div>
          </UCard>

          <!-- Attribute Values -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <i class="i-heroicons-list-bullet text-xl text-primary" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold">Attribute Values</h2>
                  <p class="text-sm text-gray-500">
                    Add possible values for this attribute
                  </p>
                </div>
              </div>
            </template>

            <div class="mb-3">
              <UFormGroup label="Values" name="values" required>
                <UInputTags
                  v-model="attributeValues"
                  placeholder="Type a value and press Enter"
                  :disabled="loading"
                  class="mb-3 w-full"
                />
                <template #help>
                  <span class="text-sm text-gray-500">
                    Press Enter, comma, or space to add a value. Added
                    {{ attributeValues.length }} value{{
                      attributeValues.length !== 1 ? "s" : ""
                    }}.
                  </span>
                </template>
              </UFormGroup>

              <!-- Value Preview -->
              <UCard v-if="attributeValues.length > 0" class="space-y-3">
                <div
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                >
                  <h3
                    class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2"
                  >
                    <i class="i-heroicons-eye text-primary" />
                    Value Preview ({{ attributeValues.length }})
                  </h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div
                      v-for="(value, index) in attributeValues"
                      :key="index"
                      class="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center"
                        >
                          {{ index + 1 }}
                        </span>
                        <div class="min-w-0 flex-1">
                          <div class="font-medium text-sm truncate">
                            {{ value }}
                          </div>
                          <div class="text-xs text-gray-500 font-mono truncate">
                            {{ value.toLowerCase().replace(/[^a-z0-9]/g, "-") }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

              <!-- Empty State -->
              <div
                v-else
                class="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg"
              >
                <div class="text-gray-400 mb-4">
                  <i class="i-heroicons-squares-plus text-4xl" />
                </div>
                <h3
                  class="text-lg font-medium text-gray-900 dark:text-white mb-2"
                >
                  No Values Added
                </h3>
                <p class="text-gray-500 text-sm">
                  Start typing in the input above and press Enter to add values
                </p>
              </div>
            </div>
          </UCard>

          <!-- Summary -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <i class="i-heroicons-document-text text-xl text-primary" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold">Summary</h2>
                  <p class="text-sm text-gray-500">
                    Review your attribute details
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span class="text-gray-500 block mb-1">Attribute Name:</span>
                  <div class="font-medium">
                    {{ form.name || "Not set" }}
                  </div>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span class="text-gray-500 block mb-1">Code:</span>
                  <div class="font-medium font-mono">
                    {{ form.code || "Not set" }}
                  </div>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span class="text-gray-500 block mb-1">Visibility:</span>
                  <div class="font-medium">
                    <UBadge
                      :color="form.isPrivate ? 'warning' : 'success'"
                      :label="form.isPrivate ? 'Private' : 'Public'"
                      size="xs"
                    />
                  </div>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span class="text-gray-500 block mb-1">Total Values:</span>
                  <div class="font-medium">
                    {{ attributeValues.length }}
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
