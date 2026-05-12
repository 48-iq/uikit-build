import { MigrationInterface, QueryRunner } from 'typeorm';

export class ComponentsTable1774613288644 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE "components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        "username" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP,
        "version" character varying NOT NULL,
        "framework" character varying NOT NULL,
        CONSTRAINT "PK_component_id" PRIMARY KEY ("id")
      ) 
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`DROP TABLE "components"`);
  }
}

// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
//       CREATE TABLE "chats" (
//         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
//         "title" character varying NOT NULL,
//         "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//         "isPending" boolean NOT NULL,
//         "userId" uuid,
//         "version" integer NOT NULL DEFAULT 0,
//         CONSTRAINT "PK_chat_id" PRIMARY KEY ("id"),
//         CONSTRAINT "FK_chat_user" FOREIGN KEY ("userId")
//           REFERENCES "users"("id")
//           ON DELETE SET NULL
//       );
