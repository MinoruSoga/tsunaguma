import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

const prefectures = [
  { code: 1, name: '北海道' },
  { code: 2, name: '北東北' },
  { code: 3, name: '南東北' },
  { code: 4, name: '関東' },
  { code: 5, name: '信越' },
  { code: 6, name: '北陸' },
  { code: 7, name: '中部' },
  { code: 8, name: '関西' },
  { code: 9, name: '中国' },
  { code: 10, name: '四国' },
  { code: 11, name: '九州' },
  { code: 12, name: '沖縄' },
  { code: 1, name: '北海道', parent_code: 1 },
  { code: 2, name: '青森県', parent_code: 2 },
  { code: 3, name: '岩手県', parent_code: 2 },
  { code: 4, name: '宮城県', parent_code: 3 },
  { code: 5, name: '秋田県', parent_code: 2 },
  { code: 6, name: '山形県', parent_code: 3 },
  { code: 7, name: '福島県', parent_code: 3 },
  { code: 8, name: '茨城県', parent_code: 4 },
  { code: 9, name: '栃木県', parent_code: 4 },
  { code: 10, name: '群馬県', parent_code: 4 },
  { code: 11, name: '埼玉県', parent_code: 4 },
  { code: 12, name: '千葉県', parent_code: 4 },
  { code: 13, name: '東京都', parent_code: 4 },
  { code: 14, name: '神奈川県', parent_code: 4 },
  { code: 15, name: '新潟県', parent_code: 5 },
  { code: 16, name: '富山県', parent_code: 6 },
  { code: 17, name: '石川県', parent_code: 6 },
  { code: 18, name: '福井県', parent_code: 6 },
  { code: 19, name: '山梨県', parent_code: 4 },
  { code: 20, name: '長野県', parent_code: 5 },
  { code: 21, name: '岐阜県', parent_code: 7 },
  { code: 22, name: '静岡県', parent_code: 7 },
  { code: 23, name: '愛知県', parent_code: 7 },
  { code: 24, name: '三重県', parent_code: 7 },
  { code: 25, name: '滋賀県', parent_code: 8 },
  { code: 26, name: '京都府', parent_code: 8 },
  { code: 27, name: '大阪府', parent_code: 8 },
  { code: 28, name: '兵庫県', parent_code: 8 },
  { code: 29, name: '奈良県', parent_code: 8 },
  { code: 30, name: '和歌山県', parent_code: 8 },
  { code: 31, name: '鳥取県', parent_code: 9 },
  { code: 32, name: '島根県', parent_code: 9 },
  { code: 33, name: '岡山県', parent_code: 9 },
  { code: 34, name: '広島県', parent_code: 9 },
  { code: 35, name: '山口県', parent_code: 9 },
  { code: 36, name: '徳島県', parent_code: 10 },
  { code: 37, name: '香川県', parent_code: 10 },
  { code: 38, name: '愛媛県', parent_code: 10 },
  { code: 39, name: '高知県', parent_code: 10 },
  { code: 40, name: '福岡県', parent_code: 11 },
  { code: 41, name: '佐賀県', parent_code: 11 },
  { code: 42, name: '長崎県', parent_code: 11 },
  { code: 43, name: '熊本県', parent_code: 11 },
  { code: 44, name: '大分県', parent_code: 11 },
  { code: 45, name: '宮崎県', parent_code: 11 },
  { code: 46, name: '鹿児島県', parent_code: 11 },
  { code: 47, name: '沖縄県', parent_code: 12 },
]

@Migration()
export class PrefectureMigration1666547701891 implements MigrationInterface {
  name = 'PrefectureMigration1666547701891'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'prefecture',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['parent_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'prefecture',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    const query = `INSERT INTO "prefecture" ("id", "name", "parent_id") VALUES ($1, $2, $3)`
    for (const { code, name, parent_code } of prefectures) {
      await queryRunner.query(query, [
        (parent_code ? 'pref_' : 'area_') + code,
        name,
        parent_code ? 'area_' + parent_code : null,
      ])
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('prefecture', true)
  }
}
