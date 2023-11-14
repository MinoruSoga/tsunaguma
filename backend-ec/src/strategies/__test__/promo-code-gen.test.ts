import { BatchJob, BatchJobStatus } from '@medusajs/medusa'

import mockLogger from '../../__tests__/__mocks__/logger'
import mockManager from '../../__tests__/__mocks__/manager'
// import { v4 as uuid } from 'uuid'
import PromotionCodeGenStrategy from '../promotion-code-gen'

const testCodes = [
  {
    total: 100,
    expected: {
      total: 100,
      maxTry: 1,
    },
  },
  {
    total: 1000,
    expected: {
      total: 1000,
      maxTry: 2,
    },
  },
  {
    total: 10000,
    expected: {
      total: 10000,
      maxTry: 3,
    },
  },
  {
    total: 50000,
    expected: {
      total: 50000,
      maxTry: 3,
    },
  },
]

let discountServiceMock = {}

const promotionCodeMasterServiceMock = {}

let promotionCodeGenStrategy: PromotionCodeGenStrategy
const toBeUnique = (arr: string[]) => new Set(arr).size === arr.length

// beforeAll(() => {
//   const fakeBatchJob = {
//     type: 'promo-code-gen',
//     id: new Date().toISOString(),
//     context: {
//       total: 100,
//     },
//     dry_run: true,
//     status: BatchJobStatus.CREATED,
//     created_by: null,
//     created_by_user: null,
//     result: {},
//   }

//   const batchJobServiceMock = {
//     withTransaction(tx) {
//       return this
//     },
//     update: jest.fn().mockImplementation((job, data) => {
//       const fakeJob = {
//         ...fakeBatchJob,
//         ...data,
//         context: { ...fakeBatchJob?.context, ...data?.context },
//         result: { ...fakeBatchJob?.result, ...data?.result },
//       }

//       return Promise.resolve(fakeJob)
//     }),
//     retrieve: jest.fn().mockResolvedValue(fakeBatchJob),
//   }

//   promotionCodeGenStrategy = new PromotionCodeGenStrategy({
//     manager: mockManager as any,
//     batchJobService: batchJobServiceMock as any,
//     discountService: discountServiceMock as any,
//     logger: mockLogger as any,
//     promotionCodeMasterService: promotionCodeMasterServiceMock as any,
//   })
// })

describe('Generate random code', () => {
  const set: Set<string> = new Set()
  const totalGen = 100
  const arr: number[] = new Array(totalGen).fill(1)

  it.each(arr)('test generate random code', () => {
    const generateFn = jest
      .fn()
      .mockImplementation(promotionCodeGenStrategy.generateCode)

    const code = generateFn()
    set.add(code)

    expect(generateFn).toHaveBeenCalled()
    expect(code).toHaveLength(8)
    expect(code).not.toBeNaN()
  })

  it('test unique', () => {
    expect(set.size).toBe(totalGen)
  })
})

describe('test generate codes', () => {
  it.each(testCodes)('test generate unique', (params) => {
    const res = promotionCodeGenStrategy.generate(params.total)

    expect(res.response_body).toHaveLength(params.expected.total)
    expect(res.total_try).toBeLessThanOrEqual(params.expected.maxTry)

    expect(toBeUnique(res.response_body)).toBeTruthy()
  })
})

describe('test preprocess batch job', () => {
  let fakeBatchJob = {
    type: 'promo-code-gen',
    id: new Date().toISOString(),
    context: {
      total: 100,
    },
    dry_run: true,
    status: BatchJobStatus.CREATED,
    created_by: null,
    created_by_user: null,
    result: {} as any,
  }

  const batchJobServiceMock = {
    withTransaction(tx) {
      return this
    },
    update: jest.fn().mockImplementation((job, data) => {
      fakeBatchJob = {
        ...fakeBatchJob,
        ...data,
        context: { ...fakeBatchJob?.context, ...data?.context },
        result: { ...fakeBatchJob?.result, ...data?.result },
      }

      return Promise.resolve(fakeBatchJob)
    }),
    retrieve: jest.fn().mockResolvedValue(fakeBatchJob),
  }

  promotionCodeGenStrategy = new PromotionCodeGenStrategy({
    manager: mockManager as any,
    batchJobService: batchJobServiceMock as any,
    discountService: discountServiceMock as any,
    logger: mockLogger as any,
    promotionCodeMasterService: promotionCodeMasterServiceMock as any,
  })

  const mockUsedCodes = promotionCodeGenStrategy.generate(1000).response_body

  discountServiceMock = {
    withTransaction(tx) {
      return this
    },
    list_: jest.fn().mockResolvedValue(mockUsedCodes.map((code) => ({ code }))),
  }

  promotionCodeGenStrategy = new PromotionCodeGenStrategy({
    manager: mockManager as any,
    batchJobService: batchJobServiceMock as any,
    discountService: discountServiceMock as any,
    logger: mockLogger as any,
    promotionCodeMasterService: promotionCodeMasterServiceMock as any,
  })

  it.only('test preprocess batchjob result', async () => {
    await promotionCodeGenStrategy.preProcessBatchJob(fakeBatchJob.id)

    expect(batchJobServiceMock.retrieve).toHaveBeenCalled()
    expect(batchJobServiceMock.update).toHaveBeenCalled()
    expect(fakeBatchJob.result.count).toBe(100)
    expect(fakeBatchJob.result.items).toHaveLength(100)
    expect(toBeUnique(fakeBatchJob.result.items)).toBeTruthy()

    for (const code of fakeBatchJob.result.items) {
      expect(mockUsedCodes).not.toContain(code)
    }
  })
})
