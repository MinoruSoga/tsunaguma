import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Migration } from 'medusa-extender';

@Migration()
export class ProductShippingOptionsMigration1699328499391 implements MigrationInterface {
    name = 'ProductShippingOptionsMigration1699328499391';
    
    public async up(queryRunner: QueryRunner): Promise<void> {

        const query = "ALTER TABLE product_shipping_options ALTER COLUMN bulk_added_price TYPE int USING (COALESCE(bulk_added_price, 0)), ALTER COLUMN bulk_added_price SET DEFAULT 0, ALTER COLUMN bulk_added_price SET NOT NULL;"
        await queryRunner.query(query)
    }
    
    public async down(queryRunner: QueryRunner): Promise<void> {
        const query = "ALTER TABLE product_shipping_options ALTER COLUMN bulk_added_price SET DEFAULT NULL, ALTER COLUMN bulk_added_price DROP NOT NULL;"
        await queryRunner.query(query)
    }
}