import { PostgreSqlContainer } from '@testcontainers/postgresql';

import { MinioContainer } from '@testcontainers/minio';

export default async () => {
  const postgresContainer = await new PostgreSqlContainer('postgres:18')
    .withDatabase('uikit-build-db')
    .withPassword('password')
    .withUsername('postgres')
    .start();

  process.env.POSTGRES_HOST = postgresContainer.getHost();
  process.env.POSTGRES_PORT = postgresContainer.getPort().toString();
  process.env.POSTGRES_USER = postgresContainer.getUsername();
  process.env.POSTGRES_PASSWORD = postgresContainer.getPassword();
  process.env.POSTGRES_DB = postgresContainer.getDatabase();

  const minioContainer = await new MinioContainer('minio/minio:latest')
    .withUsername('minio')
    .withPassword('password')
    .start();

  process.env.MINIO_HOST = minioContainer.getHost();
  process.env.MINIO_PORT = minioContainer.getPort().toString();
  process.env.MINIO_USER = minioContainer.getUsername();
  process.env.MINIO_PASSWORD = minioContainer.getPassword();

  // сохраняем контейнеры глобально
  (global as any).__POSTGRES__ = postgresContainer;
  (global as any).__MINIO__ = minioContainer;
};
