import { MigrationInterface, QueryRunner } from "typeorm";

export class OrdersEntity1752673368928 implements MigrationInterface {
    name = 'OrdersEntity1752673368928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('active', 'cancelled', 'processed', 'finalized')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."orders_status_enum" NOT NULL DEFAULT 'active', "orderDetailId" uuid, "user_id" uuid, CONSTRAINT "REL_749e30f71cc0d2d95f8546f459" UNIQUE ("orderDetailId"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orders_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total" numeric(10) NOT NULL, CONSTRAINT "PK_9e5b29b50620aadf9af8eccb36d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_details_products" ("ordersDetailsId" uuid NOT NULL, "productsId" uuid NOT NULL, CONSTRAINT "PK_12ed3ac9146ba2e208b5b1833e8" PRIMARY KEY ("ordersDetailsId", "productsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6695ca12e2545b58f1e7b186f0" ON "order_details_products" ("ordersDetailsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4592a14f5578c3385b67e94e8f" ON "order_details_products" ("productsId") `);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_749e30f71cc0d2d95f8546f4592" FOREIGN KEY ("orderDetailId") REFERENCES "orders_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_details_products" ADD CONSTRAINT "FK_6695ca12e2545b58f1e7b186f09" FOREIGN KEY ("ordersDetailsId") REFERENCES "orders_details"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "order_details_products" ADD CONSTRAINT "FK_4592a14f5578c3385b67e94e8ff" FOREIGN KEY ("productsId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_details_products" DROP CONSTRAINT "FK_4592a14f5578c3385b67e94e8ff"`);
        await queryRunner.query(`ALTER TABLE "order_details_products" DROP CONSTRAINT "FK_6695ca12e2545b58f1e7b186f09"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_749e30f71cc0d2d95f8546f4592"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4592a14f5578c3385b67e94e8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6695ca12e2545b58f1e7b186f0"`);
        await queryRunner.query(`DROP TABLE "order_details_products"`);
        await queryRunner.query(`DROP TABLE "orders_details"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}
