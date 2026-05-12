import { StartedMinioContainer } from "@testcontainers/minio";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql"

export default async () => {
  const postgresContainer: StartedPostgreSqlContainer = (global as any).__POSTGRES__;
  const minioContainer: StartedMinioContainer = (global as any).__MINIO__;

  await postgresContainer.stop();
  await minioContainer.stop();
}