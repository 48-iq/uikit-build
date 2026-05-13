import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { JwtGuard } from 'src/security/jwt.guard';

jest.setTimeout(30000);

describe('ComponentController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .setLogger(new Logger())
    .compile();

    app = moduleFixture.createNestApplication();
    const jwtGuard = app.get(JwtGuard);
    app.useGlobalGuards(jwtGuard);
    await app.init();
  });

  it('Component builds successful', async () => {
    const jwtService = app.get(JwtService);

    const jwt = await jwtService.signAsync({
      username: 'test',
      userId: 'test',
    });

    return request(app.getHttpServer())
      .post('/api/components/upload')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', 'TestComponent')
      .field('framework', 'react')
      .field('description', 'Test description')
      .field('fileExtension', 'tsx')
      .field('css', '["css"]')
      .field('dependencies', '{ "axios": "^1.13.6" }')
      .field('version', '1.0.0')
      .attach('file', 'test/resources/index.tsx')
      .expect(201);
  });

  it('Components get successful', async () => {
    const jwtService = app.get(JwtService);

    const jwt = await jwtService.signAsync({
      username: 'test',
      userId: 'test',
    });

    

    return request(app.getHttpServer())
      .get('/api/component')
  });

  // name: string;
  // framework: string;
  // description: string;
  // fileExtension: string;
  // css: string;
  // dependencies: string;
  // version: string;
});
