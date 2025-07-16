import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisitsEntitiesTables1752615237578
  implements MigrationInterface
{
  name = 'AddVisitsEntitiesTables1752615237578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "bookedAt" TIMESTAMP NOT NULL DEFAULT now(), "numberOfPeople" integer NOT NULL DEFAULT '1', "visitSlotId" uuid NOT NULL, CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "visit_slots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "isBooked" boolean NOT NULL DEFAULT false, "maxAppointments" integer NOT NULL DEFAULT '1', "currentAppointmentsCount" integer NOT NULL DEFAULT '0', "visitId" uuid NOT NULL, CONSTRAINT "PK_b6f97becfd4de0bfcf6517cd451" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c3f165abf65ec80895a702ace4" ON "visit_slots" ("date", "startTime", "visitId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text, "people" integer NOT NULL DEFAULT '1', "status" character varying NOT NULL DEFAULT 'active', CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_0d1aa4085d4c15a5ed10de7667f" FOREIGN KEY ("visitSlotId") REFERENCES "visit_slots"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_slots" ADD CONSTRAINT "FK_6653a21e6dc1cf0384ad6aa3450" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "visit_slots" DROP CONSTRAINT "FK_6653a21e6dc1cf0384ad6aa3450"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_0d1aa4085d4c15a5ed10de7667f"`,
    );
    await queryRunner.query(`DROP TABLE "visits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3f165abf65ec80895a702ace4"`,
    );
    await queryRunner.query(`DROP TABLE "visit_slots"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
  }
}
