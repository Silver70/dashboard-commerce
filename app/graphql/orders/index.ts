import gql from 'graphql-tag'

// ============================================================================
// FRAGMENTS
// ============================================================================

export const ORDER_FRAGMENT = gql`
  fragment OrderDetail on Order {
    id
    code
    state
    active
    createdAt
    updatedAt
    orderPlacedAt
    currencyCode
    totalQuantity
    subTotal
    subTotalWithTax
    shipping
    shippingWithTax
    total
    totalWithTax
    taxSummary {
      description
      taxRate
      taxBase
      taxTotal
    }
    customer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
    }
    shippingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      countryCode
      phoneNumber
    }
    billingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      countryCode
      phoneNumber
    }
    shippingLines {
      id
      shippingMethod {
        id
        code
        name
        description
      }
      priceWithTax
    }
    lines {
      id
      quantity
      linePrice
      linePriceWithTax
      unitPrice
      unitPriceWithTax
      discountedLinePrice
      discountedLinePriceWithTax
      productVariant {
        id
        name
        sku
        featuredAsset {
          id
          preview
        }
      }
    }
    payments {
      id
      state
      method
      amount
      metadata
      transactionId
      createdAt
    }
    fulfillments {
      id
      state
      method
      trackingCode
      createdAt
      updatedAt
    }
    discounts {
      adjustmentSource
      amount
      amountWithTax
      description
      type
    }
    history {
      items {
        id
        type
        data
        createdAt
        administrator {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const ORDER_LIST_FRAGMENT = gql`
  fragment OrderListItem on Order {
    id
    code
    state
    active
    createdAt
    updatedAt
    orderPlacedAt
    totalQuantity
    total
    totalWithTax
    currencyCode
    customer {
      id
      firstName
      lastName
      emailAddress
    }
  }
`

// ============================================================================
// QUERIES
// ============================================================================

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const GET_ORDERS = gql`
  query GetOrders($options: OrderListOptions) {
    orders(options: $options) {
      items {
        ...OrderListItem
      }
      totalItems
    }
  }
  ${ORDER_LIST_FRAGMENT}
`

export const GET_ORDER_BY_CODE = gql`
  query GetOrderByCode($code: String!) {
    orderByCode(code: $code) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const GET_NEXT_ORDER_STATES = gql`
  query GetNextOrderStates($id: ID!) {
    nextOrderStates(id: $id)
  }
`

export const GET_ELIGIBLE_SHIPPING_METHODS_FOR_DRAFT_ORDER = gql`
  query GetEligibleShippingMethodsForDraftOrder($orderId: ID!) {
    eligibleShippingMethodsForDraftOrder(orderId: $orderId) {
      id
      code
      name
      description
      priceWithTax
      metadata
    }
  }
`

// ============================================================================
// MUTATIONS - DRAFT ORDER MANAGEMENT
// ============================================================================

export const CREATE_DRAFT_ORDER = gql`
  mutation CreateDraftOrder {
    createDraftOrder {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const ADD_ITEM_TO_DRAFT_ORDER = gql`
  mutation AddItemToDraftOrder($orderId: ID!, $input: AddItemToDraftOrderInput!) {
    addItemToDraftOrder(orderId: $orderId, input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const ADJUST_DRAFT_ORDER_LINE = gql`
  mutation AdjustDraftOrderLine($orderId: ID!, $input: AdjustDraftOrderLineInput!) {
    adjustDraftOrderLine(orderId: $orderId, input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const REMOVE_DRAFT_ORDER_LINE = gql`
  mutation RemoveDraftOrderLine($orderId: ID!, $orderLineId: ID!) {
    removeDraftOrderLine(orderId: $orderId, orderLineId: $orderLineId) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const SET_DRAFT_ORDER_CUSTOMER = gql`
  mutation SetDraftOrderCustomer($orderId: ID!, $customerId: ID, $input: CreateCustomerInput) {
    setCustomerForDraftOrder(orderId: $orderId, customerId: $customerId, input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const SET_DRAFT_ORDER_SHIPPING_ADDRESS = gql`
  mutation SetDraftOrderShippingAddress($orderId: ID!, $input: CreateAddressInput!) {
    setDraftOrderShippingAddress(orderId: $orderId, input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const SET_DRAFT_ORDER_BILLING_ADDRESS = gql`
  mutation SetDraftOrderBillingAddress($orderId: ID!, $input: CreateAddressInput!) {
    setDraftOrderBillingAddress(orderId: $orderId, input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const SET_DRAFT_ORDER_SHIPPING_METHOD = gql`
  mutation SetDraftOrderShippingMethod($orderId: ID!, $shippingMethodId: ID!) {
    setDraftOrderShippingMethod(orderId: $orderId, shippingMethodId: $shippingMethodId) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const APPLY_COUPON_CODE_TO_DRAFT_ORDER = gql`
  mutation ApplyCouponCodeToDraftOrder($orderId: ID!, $couponCode: String!) {
    applyCouponCodeToDraftOrder(orderId: $orderId, couponCode: $couponCode) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const REMOVE_COUPON_CODE_FROM_DRAFT_ORDER = gql`
  mutation RemoveCouponCodeFromDraftOrder($orderId: ID!, $couponCode: String!) {
    removeCouponCodeFromDraftOrder(orderId: $orderId, couponCode: $couponCode) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const SET_DRAFT_ORDER_CUSTOM_FIELDS = gql`
  mutation SetDraftOrderCustomFields($orderId: ID!, $input: UpdateOrderInput!) {
    setDraftOrderCustomFields(orderId: $orderId, input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const DELETE_DRAFT_ORDER = gql`
  mutation DeleteDraftOrder($orderId: ID!) {
    deleteDraftOrder(orderId: $orderId) {
      result
      message
    }
  }
`

// ============================================================================
// MUTATIONS - ORDER MANAGEMENT
// ============================================================================

export const TRANSITION_ORDER_TO_STATE = gql`
  mutation TransitionOrderToState($id: ID!, $state: String!) {
    transitionOrderToState(id: $id, state: $state) {
      ... on Order {
        ...OrderDetail
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
  ${ORDER_FRAGMENT}
`

export const ADD_NOTE_TO_ORDER = gql`
  mutation AddNoteToOrder($input: AddNoteToOrderInput!) {
    addNoteToOrder(input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const UPDATE_ORDER_NOTE = gql`
  mutation UpdateOrderNote($input: UpdateOrderNoteInput!) {
    updateOrderNote(input: $input) {
      id
      type
      data
      isPublic
    }
  }
`

export const DELETE_ORDER_NOTE = gql`
  mutation DeleteOrderNote($id: ID!) {
    deleteOrderNote(id: $id) {
      result
      message
    }
  }
`

export const SET_ORDER_CUSTOMER = gql`
  mutation SetOrderCustomer($input: SetOrderCustomerInput!) {
    setOrderCustomer(input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

export const SET_ORDER_CUSTOM_FIELDS = gql`
  mutation SetOrderCustomFields($input: UpdateOrderInput!) {
    setOrderCustomFields(input: $input) {
      ...OrderDetail
    }
  }
  ${ORDER_FRAGMENT}
`

// ============================================================================
// MUTATIONS - ORDER MODIFICATIONS
// ============================================================================

export const MODIFY_ORDER = gql`
  mutation ModifyOrder($input: ModifyOrderInput!) {
    modifyOrder(input: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on NoChangesSpecifiedError {
        errorCode
        message
      }
      ... on OrderModificationStateError {
        errorCode
        message
      }
      ... on PaymentMethodMissingError {
        errorCode
        message
      }
      ... on RefundPaymentIdMissingError {
        errorCode
        message
      }
      ... on OrderLimitError {
        errorCode
        message
        maxItems
      }
      ... on NegativeQuantityError {
        errorCode
        message
      }
    }
  }
  ${ORDER_FRAGMENT}
`

export const CANCEL_ORDER = gql`
  mutation CancelOrder($input: CancelOrderInput!) {
    cancelOrder(input: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on EmptyOrderLineSelectionError {
        errorCode
        message
      }
      ... on QuantityTooGreatError {
        errorCode
        message
      }
      ... on MultipleOrderError {
        errorCode
        message
      }
      ... on CancelActiveOrderError {
        errorCode
        message
        orderState
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
  ${ORDER_FRAGMENT}
`

export const REFUND_ORDER = gql`
  mutation RefundOrder($input: RefundOrderInput!) {
    refundOrder(input: $input) {
      ... on Refund {
        id
        state
        items
        shipping
        adjustment
        total
        paymentId
        reason
        metadata
      }
      ... on QuantityTooGreatError {
        errorCode
        message
      }
      ... on NothingToRefundError {
        errorCode
        message
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
      ... on MultipleOrderError {
        errorCode
        message
      }
      ... on PaymentOrderMismatchError {
        errorCode
        message
      }
      ... on RefundOrderStateError {
        errorCode
        message
        orderState
      }
      ... on AlreadyRefundedError {
        errorCode
        message
        refundId
      }
      ... on RefundStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`

export const SETTLE_REFUND = gql`
  mutation SettleRefund($input: SettleRefundInput!) {
    settleRefund(input: $input) {
      ... on Refund {
        id
        state
        items
        shipping
        adjustment
        total
      }
      ... on RefundStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`

export const ADD_MANUAL_PAYMENT_TO_ORDER = gql`
  mutation AddManualPaymentToOrder($input: ManualPaymentInput!) {
    addManualPaymentToOrder(input: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on ManualPaymentStateError {
        errorCode
        message
      }
    }
  }
  ${ORDER_FRAGMENT}
`

export const SETTLE_PAYMENT = gql`
  mutation SettlePayment($id: ID!) {
    settlePayment(id: $id) {
      ... on Payment {
        id
        state
        amount
        method
        transactionId
        metadata
      }
      ... on SettlePaymentError {
        errorCode
        message
        paymentErrorMessage
      }
      ... on PaymentStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`

export const TRANSITION_PAYMENT_TO_STATE = gql`
  mutation TransitionPaymentToState($id: ID!, $state: String!) {
    transitionPaymentToState(id: $id, state: $state) {
      ... on Payment {
        id
        state
        amount
        method
      }
      ... on PaymentStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`

// ============================================================================
// MUTATIONS - FULFILLMENT MANAGEMENT
// ============================================================================

export const ADD_FULFILLMENT_TO_ORDER = gql`
  mutation AddFulfillmentToOrder($input: FulfillOrderInput!) {
    addFulfillmentToOrder(input: $input) {
      ... on Fulfillment {
        id
        state
        method
        trackingCode
        createdAt
        updatedAt
      }
      ... on EmptyOrderLineSelectionError {
        errorCode
        message
      }
      ... on ItemsAlreadyFulfilledError {
        errorCode
        message
      }
      ... on InsufficientStockOnHandError {
        errorCode
        message
        productVariantId
        productVariantName
        stockOnHand
      }
      ... on InvalidFulfillmentHandlerError {
        errorCode
        message
      }
      ... on FulfillmentStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
      ... on CreateFulfillmentError {
        errorCode
        message
        fulfillmentHandlerError
      }
    }
  }
`

export const TRANSITION_FULFILLMENT_TO_STATE = gql`
  mutation TransitionFulfillmentToState($id: ID!, $state: String!) {
    transitionFulfillmentToState(id: $id, state: $state) {
      ... on Fulfillment {
        id
        state
        method
        trackingCode
      }
      ... on FulfillmentStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`

export const CANCEL_FULFILLMENT = gql`
  mutation CancelFulfillment($id: ID!) {
    cancelFulfillment(id: $id) {
      ... on Fulfillment {
        id
        state
        method
      }
      ... on FulfillmentStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`
