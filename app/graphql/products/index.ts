import { gql } from "@apollo/client";

// ============================================================================
// QUERIES
// ============================================================================

export const GET_PRODUCTS = gql`
  query Products($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        name
        slug
        description
        enabled
        createdAt
        updatedAt
        variants {
          id
          name
          sku
          price
          priceWithTax
          stockLevel
          enabled
        }
        featuredAsset {
          id
          name
          preview
          source
        }
        facetValues {
          id
          name
          code
          facet {
            id
            name
          }
        }
        collections {
          id
          name
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT = gql`
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      slug
      description
      enabled
      createdAt
      updatedAt
      variants {
        id
        name
        sku
        price
        priceWithTax
        stockLevel
        stockOnHand
        stockAllocated
        enabled
        createdAt
        updatedAt
        options {
          id
          name
          code
        }
        taxCategory {
          id
          name
        }
      }
      featuredAsset {
        id
        name
        preview
        source
        width
        height
        type
        fileSize
      }
      assets {
        id
        name
        preview
        source
        width
        height
        type
        fileSize
      }
      optionGroups {
        id
        name
        code
        options {
          id
          name
          code
        }
      }
      facetValues {
        id
        name
        code
        facet {
          id
          name
          code
        }
      }
      collections {
        id
        name
        slug
        description
      }
      channels {
        id
        code
        token
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($input: SearchInput!) {
    search(input: $input) {
      items {
        productId
        productName
        productVariantId
        productVariantName
        sku
        slug
        price {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
        priceWithTax {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
        productAsset {
          id
          preview
        }
        productVariantAsset {
          id
          preview
        }
        score
        inStock
        enabled
        facetValues {
          facetId
          id
          name
        }
        collectionIds
      }
      totalItems
      facetValues {
        facetId
        count
        id
        name
      }
    }
  }
`;

export const GET_COLLECTIONS = gql`
  query Collections($options: CollectionListOptions) {
    collections(options: $options) {
      items {
        id
        name
        slug
        description
        isPrivate
        parentId
        position
        featuredAsset {
          id
          name
          preview
        }
        breadcrumbs {
          id
          name
          slug
        }
        children {
          id
          name
        }
      }
      totalItems
    }
  }
`;

export const GET_FACETS = gql`
  query Facets($options: FacetListOptions) {
    facets(options: $options) {
      items {
        id
        name
        code
        isPrivate
        languageCode
        values {
          id
          name
          code
          facet {
            id
            name
          }
        }
      }
      totalItems
    }
  }
`;

export const GET_FACET_VALUES = gql`
  query FacetValues($options: FacetValueListOptions) {
    facetValues(options: $options) {
      items {
        id
        name
        code
        facet {
          id
          name
          code
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT_VARIANTS = gql`
  query ProductVariants($options: ProductVariantListOptions) {
    productVariants(options: $options) {
      items {
        id
        name
        sku
        price
        priceWithTax
        stockLevel
        stockOnHand
        stockAllocated
        enabled
        createdAt
        updatedAt
        product {
          id
          name
        }
        options {
          id
          name
          code
          group {
            id
            name
            code
          }
        }
        featuredAsset {
          id
          name
          preview
        }
        taxCategory {
          id
          name
        }
        channels {
          id
          code
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT_VARIANT = gql`
  query ProductVariant($id: ID!) {
    productVariant(id: $id) {
      id
      name
      sku
      price
      priceWithTax
      stockLevel
      stockOnHand
      stockAllocated
      enabled
      createdAt
      updatedAt
      product {
        id
        name
        slug
      }
      options {
        id
        name
        code
        group {
          id
          name
          code
        }
      }
      assets {
        id
        name
        preview
        source
        width
        height
      }
      featuredAsset {
        id
        name
        preview
        source
        width
        height
      }
      facetValues {
        id
        name
        code
        facet {
          id
          name
        }
      }
      taxCategory {
        id
        name
      }
      stockMovements {
        items {
          id
          type
          quantity
          createdAt
        }
        totalItems
      }
      channels {
        id
        code
      }
    }
  }
`;

// ============================================================================
// MUTATIONS
// ============================================================================

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      slug
      description
      enabled
      createdAt
      updatedAt
      featuredAsset {
        id
        name
        preview
      }
      facetValues {
        id
        name
        code
        facet {
          id
          name
        }
      }
      collections {
        id
        name
      }
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      ... on Product {
        id
        name
        slug
        description
        enabled
        createdAt
        updatedAt
        variants {
          id
          name
          sku
          price
          priceWithTax
          stockLevel
          enabled
        }
        featuredAsset {
          id
          name
          preview
        }
        facetValues {
          id
          name
          code
          facet {
            id
            name
          }
        }
        collections {
          id
          name
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      result
      message
    }
  }
`;

export const DELETE_PRODUCTS = gql`
  mutation DeleteProducts($ids: [ID!]!) {
    deleteProducts(ids: $ids) {
      result
      message
    }
  }
`;

export const ADD_OPTION_GROUP_TO_PRODUCT = gql`
  mutation AddOptionGroupToProduct($productId: ID!, $optionGroupId: ID!) {
    addOptionGroupToProduct(
      productId: $productId
      optionGroupId: $optionGroupId
    ) {
      id
      optionGroups {
        id
        name
        code
        options {
          id
          name
          code
        }
      }
    }
  }
`;

export const REMOVE_OPTION_GROUP_FROM_PRODUCT = gql`
  mutation RemoveOptionGroupFromProduct(
    $productId: ID!
    $optionGroupId: ID!
    $force: Boolean
  ) {
    removeOptionGroupFromProduct(
      productId: $productId
      optionGroupId: $optionGroupId
      force: $force
    ) {
      ... on Product {
        id
        optionGroups {
          id
          name
          code
          options {
            id
            name
            code
          }
        }
      }
      ... on ProductOptionInUseError {
        errorCode
        message
        optionGroupCode
        productVariantCount
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const CREATE_PRODUCT_OPTION_GROUP = gql`
  mutation CreateProductOptionGroup($input: CreateProductOptionGroupInput!) {
    createProductOptionGroup(input: $input) {
      id
      name
      code
      options {
        id
        name
        code
      }
    }
  }
`;

export const CREATE_PRODUCT_OPTION = gql`
  mutation CreateProductOption($input: CreateProductOptionInput!) {
    createProductOption(input: $input) {
      id
      name
      code
      group {
        id
        name
        code
      }
    }
  }
`;

export const CREATE_COLLECTION = gql`
  mutation CreateCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      name
      slug
      description
      isPrivate
      position
      featuredAsset {
        id
        name
        preview
      }
      parentId
      children {
        id
        name
      }
    }
  }
`;

export const UPDATE_COLLECTION = gql`
  mutation UpdateCollection($input: UpdateCollectionInput!) {
    updateCollection(input: $input) {
      ... on Collection {
        id
        name
        slug
        description
        isPrivate
        position
        featuredAsset {
          id
          name
          preview
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ASSIGN_PRODUCTS_TO_CHANNEL = gql`
  mutation AssignProductsToChannel($input: AssignProductsToChannelInput!) {
    assignProductsToChannel(input: $input) {
      ... on Product {
        id
        channels {
          id
          code
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_PRODUCTS_FROM_CHANNEL = gql`
  mutation RemoveProductsFromChannel($input: RemoveProductsFromChannelInput!) {
    removeProductsFromChannel(input: $input) {
      ... on Product {
        id
        channels {
          id
          code
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// ============================================================================
// PRODUCT VARIANT MUTATIONS
// ============================================================================

export const CREATE_PRODUCT_VARIANTS = gql`
  mutation CreateProductVariants($input: [CreateProductVariantInput!]!) {
    createProductVariants(input: $input) {
      id
      name
      sku
      price
      priceWithTax
      stockLevel
      enabled
      product {
        id
        name
      }
      options {
        id
        name
        code
        group {
          id
          name
          code
        }
      }
      featuredAsset {
        id
        name
        preview
      }
    }
  }
`;

export const UPDATE_PRODUCT_VARIANTS = gql`
  mutation UpdateProductVariants($input: [UpdateProductVariantInput!]!) {
    updateProductVariants(input: $input) {
      ... on ProductVariant {
        id
        name
        sku
        price
        priceWithTax
        stockLevel
        enabled
        product {
          id
          name
        }
        options {
          id
          name
          code
          group {
            id
            name
            code
          }
        }
        featuredAsset {
          id
          name
          preview
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const DELETE_PRODUCT_VARIANT = gql`
  mutation DeleteProductVariant($id: ID!) {
    deleteProductVariant(id: $id) {
      result
      message
    }
  }
`;

export const DELETE_PRODUCT_VARIANTS = gql`
  mutation DeleteProductVariants($ids: [ID!]!) {
    deleteProductVariants(ids: $ids) {
      result
      message
    }
  }
`;

export const UPDATE_PRODUCT_VARIANT_CHANNELS = gql`
  mutation UpdateProductVariantChannels(
    $input: UpdateProductVariantChannelInput!
  ) {
    updateProductVariantChannels(input: $input) {
      ... on ProductVariant {
        id
        channels {
          id
          code
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ASSIGN_PRODUCT_VARIANTS_TO_CHANNEL = gql`
  mutation AssignProductVariantsToChannel(
    $input: AssignProductVariantsToChannelInput!
  ) {
    assignProductVariantsToChannel(input: $input) {
      ... on ProductVariant {
        id
        channels {
          id
          code
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_PRODUCT_VARIANTS_FROM_CHANNEL = gql`
  mutation RemoveProductVariantsFromChannel(
    $input: RemoveProductVariantsFromChannelInput!
  ) {
    removeProductVariantsFromChannel(input: $input) {
      ... on ProductVariant {
        id
        channels {
          id
          code
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// ============================================================================
// STOCK & INVENTORY MUTATIONS
// ============================================================================

export const UPDATE_STOCK = gql`
  mutation UpdateStock($input: [UpdateStockInput!]!) {
    updateStock(input: $input) {
      ... on StockMovement {
        id
        type
        quantity
        productVariant {
          id
          stockOnHand
          stockAllocated
          stockLevel
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADD_STOCK_TO_LOCATION = gql`
  mutation AddStockToLocation($input: AddStockToLocationInput!) {
    addStockToLocation(input: $input) {
      ... on StockLevel {
        id
        stockOnHand
        stockAllocated
        stockLocation {
          id
          name
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// ============================================================================
// ASSET & IMAGE MANAGEMENT MUTATIONS
// ============================================================================

export const CREATE_ASSETS = gql`
  mutation CreateAssets($input: [CreateAssetInput!]!) {
    createAssets(input: $input) {
      ... on Asset {
        id
        name
        source
        preview
        focalPoint {
          x
          y
        }
        width
        height
        type
        fileSize
        tags {
          id
          value
        }
      }
      ... on MimeTypeError {
        errorCode
        message
        fileName
        mimeType
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const UPDATE_ASSET = gql`
  mutation UpdateAsset($input: UpdateAssetInput!) {
    updateAsset(input: $input) {
      ... on Asset {
        id
        name
        source
        preview
        focalPoint {
          x
          y
        }
        width
        height
        type
        fileSize
        tags {
          id
          value
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const DELETE_ASSET = gql`
  mutation DeleteAsset($input: DeleteAssetInput!) {
    deleteAsset(input: $input) {
      result
      message
    }
  }
`;

export const DELETE_ASSETS = gql`
  mutation DeleteAssets($input: DeleteAssetsInput!) {
    deleteAssets(input: $input) {
      result
      message
    }
  }
`;

export const ASSIGN_ASSETS_TO_CHANNEL = gql`
  mutation AssignAssetsToChannel($input: AssignAssetsToChannelInput!) {
    assignAssetsToChannel(input: $input) {
      ... on Asset {
        id
        channels {
          id
          code
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// ============================================================================
// FACET & COLLECTION MUTATIONS
// ============================================================================

export const ASSIGN_FACET_VALUES_TO_PRODUCT = gql`
  mutation AssignFacetValuesToProduct($productId: ID!, $facetValueIds: [ID!]!) {
    assignFacetValuesToProduct(
      productId: $productId
      facetValueIds: $facetValueIds
    ) {
      ... on Product {
        id
        facetValues {
          id
          name
          code
          facet {
            id
            name
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_FACET_VALUES_FROM_PRODUCT = gql`
  mutation RemoveFacetValuesFromProduct(
    $productId: ID!
    $facetValueIds: [ID!]!
  ) {
    removeFacetValuesFromProduct(
      productId: $productId
      facetValueIds: $facetValueIds
    ) {
      ... on Product {
        id
        facetValues {
          id
          name
          code
          facet {
            id
            name
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADD_PRODUCTS_TO_COLLECTION = gql`
  mutation AddProductsToCollection($collectionId: ID!, $productIds: [ID!]!) {
    addProductsToCollection(
      collectionId: $collectionId
      productIds: $productIds
    ) {
      ... on Collection {
        id
        name
        productVariants {
          totalItems
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_PRODUCTS_FROM_COLLECTION = gql`
  mutation RemoveProductsFromCollection(
    $collectionId: ID!
    $productIds: [ID!]!
  ) {
    removeProductsFromCollection(
      collectionId: $collectionId
      productIds: $productIds
    ) {
      ... on Collection {
        id
        name
        productVariants {
          totalItems
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;
