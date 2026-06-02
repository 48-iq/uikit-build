import { MigrationInterface, QueryRunner } from 'typeorm';

export class LoadsTable1779440777948 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "loads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "buildId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT "PK_loads" PRIMARY KEY ("id"),
        CONSTRAINT "FK_loads_build" FOREIGN KEY ("buildId")
          REFERENCES "builds"("id")
          ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "loads"`);
  }
}
