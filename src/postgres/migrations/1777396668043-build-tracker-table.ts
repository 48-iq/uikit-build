import { MigrationInterface, QueryRunner } from 'typeorm';

export class BuildTrackerTable1777396668043 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "builds_status_enum" AS ENUM ('pending', 'running', 'success', 'failed');

      CREATE TABLE "builds" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "componentId" uuid NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "status" "builds_status_enum" NOT NULL DEFAULT 'pending',
        "logs" text,
        "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "finishedAt" TIMESTAMP,
        "previewFilename" text,
        "packageFilename" text,
        "sourceFilename" text,
        CONSTRAINT "PK_builds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_builds_component" FOREIGN KEY ("componentId")
          REFERENCES "components"("id")
          ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "builds";
      DROP TYPE "builds_status_enum";
    `);
  }
}
