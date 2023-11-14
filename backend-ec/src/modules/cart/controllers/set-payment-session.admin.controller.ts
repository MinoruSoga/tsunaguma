/**
 * @oas [post] /carts/{id}/payment-session
 * operationId: PostCartsCartPaymentSession
 * summary: Select a Payment Session
 * description: "Selects a Payment Session as the session intended to be used towards the completion of the Cart."
 * parameters:
 *   - (path) id=* {string} The ID of the Cart.
 *   - (body) provider_id=* {string} The ID of the Payment Provider.
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       medusa.carts.setPaymentSession(cart_id, {
 *         provider_id: 'manual'
 *       })
 *       .then(({ cart }) => {
 *         console.log(cart.id);
 *       });
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl --location --request POST 'https://medusa-url.com/store/carts/{id}/payment-sessions' \
 *       --header 'Content-Type: application/json' \
 *       --data-raw '{
 *           "provider_id": "manual"
 *       }'
 * tags:
 *   - Cart
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             cart:
 *               $ref: "#/components/schemas/cart"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
