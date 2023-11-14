export type PromoCodeGenResponse = {
  /** The response code for the generate request */
  response_code: number

  /** The total try for the generate request */
  total_try: number

  /** The response body for the generate request */
  response_body: string[]
}

export interface IPromotionCodeGenStrategy {
  /**
   * Generate promotion codes to allocate to store when register.
   * @param total - the number of codes to generate.
   * @return the response for the generate request
   */
  generate(total: number): Promise<PromoCodeGenResponse>
}

export abstract class AbstractPromotionCodeGenStrategy
  implements IPromotionCodeGenStrategy
{
  abstract generate(total: number): Promise<PromoCodeGenResponse>
}

export function isPromotionCodeGenStrategy(obj: unknown): boolean {
  return (
    typeof (obj as AbstractPromotionCodeGenStrategy).generate === 'function' ||
    obj instanceof AbstractPromotionCodeGenStrategy
  )
}
