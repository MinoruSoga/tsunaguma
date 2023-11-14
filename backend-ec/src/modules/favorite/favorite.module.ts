import { Module } from 'medusa-extender'

import { ProductFavorite } from './entities/product-favorite.entity'
import { StoreFavorite } from './entities/store-favorite.entity'
import { FavoriteRouter } from './favorite.router'
import { FavoriteMigration1668142235992 } from './migrations/1668142235992-favorite.migration'
import { FavoriteMigration1668998661513 } from './migrations/1668998661513-favorite.migration'
import { FavoriteMigration1671110365623 } from './migrations/1671110365623-favorite.migration'
import { FavoriteMigration1671858617364 } from './migrations/1671858617364-favorite.migration'
import { ProductFavoriteRepository } from './repository/product-favorite.repository'
import { StoreFavoriteRepository } from './repository/store-favorite.repository'
import { FavoriteService } from './services/favorite.service'

@Module({
  imports: [
    ProductFavorite,
    StoreFavorite,
    FavoriteService,
    ProductFavoriteRepository,
    StoreFavoriteRepository,
    FavoriteMigration1668142235992,
    FavoriteRouter,
    FavoriteMigration1668998661513,
    FavoriteMigration1671110365623,
    FavoriteMigration1671858617364,
  ],
})
export class FavoriteModule {}
