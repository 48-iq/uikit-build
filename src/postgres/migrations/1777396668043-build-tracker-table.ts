import { MigrationInterface, QueryRunner } from "typeorm";

export class BuildTrackerTable1777396668043 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      queryRunner.query(`
          CREATE TABLE "builds" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "componentId" uuid NOT NULL,
          "status" character varying NOT NULL DEFAULT 'pending',
          "logs" text,
          "errorMessage" character varying,
          "startedAt"  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          "updatedAt"  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          "finishedAt" TIMESTAMP,
          CONSTRAINT "PK_builds" PRIMARY KEY ("id")
        )
      `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "builds"`);
    }

}
