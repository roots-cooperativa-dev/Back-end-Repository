import { MigrationInterface, QueryRunner } from "typeorm";

export class DonationEmigrations1752527112461 implements MigrationInterface {
    name = 'DonationEmigrations1752527112461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "donates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pagoId" character varying NOT NULL, "status" character varying NOT NULL, "statusDetail" character varying NOT NULL, "transactionAmount" double precision NOT NULL, "currencyId" character varying NOT NULL, "paymentTypeId" character varying NOT NULL, "paymentMethodId" character varying NOT NULL, "dateApproved" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_57600cb0d8b826cdee36328d420" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "donates" ADD CONSTRAINT "FK_3e340af83cc6464e4585f2683db" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "donates" DROP CONSTRAINT "FK_3e340af83cc6464e4585f2683db"`);
        await queryRunner.query(`DROP TABLE "donates"`);
    }

}
