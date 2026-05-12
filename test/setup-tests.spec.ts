import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer('postgres:18').start();

  
});

afterAll(async () => {
  await postgresContainer.stop();
});
