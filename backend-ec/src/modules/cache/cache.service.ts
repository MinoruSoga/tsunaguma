import { Redis } from 'ioredis'
import { Service } from 'medusa-extender'

@Service()
export class CacheService {
  static resolutionKey = 'cacheService'
  protected redis_: Redis

  constructor({ redisClient }: { redisClient: Redis }) {
    this.redis_ = redisClient
  }

  /**
   * Set a key/value pair to the cache.
   * It is also possible to manage the ttl through environment variable using CACHE_TTL. If the ttl is 0 it will
   * act like the value should not be cached at all.
   * @param key
   * @param data
   * @param ttl expiry time in second
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis_.set(key, JSON.stringify(data), 'EX', ttl)
    } else {
      await this.redis_.set(key, JSON.stringify(data))
    }
  }

  /**
   * Retrieve a cached value belonging to the given key.
   * @param cacheKey
   */
  async get<T>(cacheKey: string): Promise<T | null> {
    try {
      const cached = await this.redis_.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (err) {
      await this.redis_.del(cacheKey)
    }
    return null
  }

  /**
   * Invalidate cache for a specific key. a key can be either a specific key or more global such as "ps:*".
   * @param key
   */
  async invalidate(key: string): Promise<void> {
    const keys = await this.redis_.keys(key)
    const pipeline = this.redis_.pipeline()

    keys.forEach(function (key) {
      pipeline.del(key)
    })

    await pipeline.exec()
  }

  async clearCache(patterns: string[] = []): Promise<void> {
    await Promise.all(
      patterns.map(async (pattern) => {
        await this.invalidate(pattern)
      }),
    )
  }
}
