import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { config as loadDotenv } from 'dotenv';
import { AppModule } from './../src/app.module.js';

// Load .env so process.env.DATABASE_URL / JWT_SECRET are available to the
// PrismaService (which reads them directly from process.env).
loadDotenv();

describe('Auth flow (login/register/logout/refresh) (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts: cookieParser so req.cookies is populated for guards + logOut.
    // (ValidationPipe + PrismaExceptionFilter are applied by main.ts on the real
    //  server; the e2e harness keeps things minimal so we don't double-layer pipes.)
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`;

  it('should register a new user and set both access + refresh cookies', async () => {
    const email = uniqueEmail();
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'E2E User', email, password: 'secret123', phone: '09120000000' })
      .expect(201);

    const cookies: string[] = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    expect(res.body.id).toBeDefined();
    expect(res.body.role).toBeDefined();
  });

  it('non-first user should be granted USER role', async () => {
    const email = uniqueEmail();
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Normal User', email, password: 'x12345' })
      .expect(201);
    // register() grants ADMIN only to the literal first user in a fresh DB;
    // with any existing users, role is USER.
    expect(res.body.role).toBe('USER');
  });

  it('should return 409 when registering an existing email', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Dup', email, password: 'x12345' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Dup', email, password: 'x12345' })
      .expect(409);
  });

  it('should reject register with a missing email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'NoEmail', password: 'x12345' })
      .expect(400);
  });

  it('should login successfully with correct password', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Login Guy', email, password: 'correct-horse' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'Login Guy', email, password: 'correct-horse' })
      .expect(201);

    expect(res.body.email).toBe(email);
    expect(res.headers['set-cookie']?.some((c: string) => c.startsWith('access_token='))).toBe(true);
  });

  it('should reject login with wrong password', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Wrong PW', email, password: 'correct-horse' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'Wrong PW', email, password: 'totally-wrong' })
      .expect(401);
  });

  it('should reject login for an unknown email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'Ghost', email: uniqueEmail(), password: 'whatever' })
      .expect(409);
  });

  it('logout should clear cookies and delete the refresh token from DB', async () => {
    const email = uniqueEmail();
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Logout Guy', email, password: 'x12345' })
      .expect(201);

    // capture the refresh token cookie value
    const setCookieHeader: string[] = reg.headers['set-cookie'] || [];
    const refreshCookie = setCookieHeader.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();

    // NOTE: logout is mapped to @Delete('/') on @Controller('auth') => DELETE /auth
    const logout = await request(app.getHttpServer())
      .delete('/auth')
      .set('Cookie', refreshCookie!.split(';')[0])
      .expect(200);

    expect(logout.body.success).toBe(true);
    // cookies should be cleared (Expires in the past or Max-Age 0)
    const cleared: string[] = logout.headers['set-cookie'] || [];
    expect(cleared.some((c) => c.includes('access_token=') && (c.includes('Max-Age=0') || /expires=.*(Thu, 01 Jan 1970|Mon, 01 Jan 1970)/i.test(c)))).toBe(true);
  });

  it('logout with no cookies should still succeed', async () => {
    const res = await request(app.getHttpServer())
      .delete('/auth')
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  describe('refresh-token flow on protected route', () => {
    const cookiesOf = (res: request.Response): string[] => res.headers['set-cookie'] || [];

    it('with only a valid refresh token, guard mints a fresh access token', async () => {
      const email = uniqueEmail();
      const reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Refresh Guy', email, password: 'x12345' })
        .expect(201);

      const refreshOnly = cookiesOf(reg).find((c) => c.startsWith('refresh_token='))!.split(';')[0];

      const res = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', refreshOnly)
        .expect(200);

      expect(cookiesOf(res).some((c) => c.startsWith('access_token='))).toBe(true);
    });

    it('with a tampered refresh token returns 401', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Cookie', 'refresh_token=deadbeef-not-in-db')
        .expect(401);
    });

    it('with no cookies returns 401', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);
    });

    it('admin-only route rejects a normal USER with 403', async () => {
      const email = uniqueEmail();
      const reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Regular User', email, password: 'x12345' })
        .expect(201);

      const accessOnly = cookiesOf(reg).find((c) => c.startsWith('access_token='))!.split(';')[0];

      await request(app.getHttpServer())
        .get('/user')
        .set('Cookie', accessOnly)
        .expect(403);
    });
  });

  describe('delete user (admin-only)', () => {
    const adminCookies = async (): Promise<{ access: string }> => {
      // Find an existing ADMIN user's email by logging in as one; instead register + promote
      // is not possible via public API, so we query the DB directly for an admin.
      // For the e2e harness we fabricate an admin JWT using the same secret the app uses.
      // (This is test-only: we sign a valid access token with role ADMIN.)
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET;
      const token = jwt.sign({ email: 'admin-e2e@test.com', id: '00000000-0000-0000-0000-000000000000', name: 'Admin', role: 'ADMIN' }, secret, { expiresIn: '1h' });
      return { access: `access_token=${token}` };
    };

    it('admin can delete a user by id', async () => {
      // create a throwaway user to delete
      const email = uniqueEmail();
      const reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Delete Me', email, password: 'x12345' })
        .expect(201);
      const { access } = await adminCookies();

      await request(app.getHttpServer())
        .delete(`/user/${reg.body.id}`)
        .set('Cookie', access)
        .expect(200);
    });

    it('a normal USER cannot delete another user (403)', async () => {
      const email = uniqueEmail();
      const reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Normal', email, password: 'x12345' })
        .expect(201);
      const accessOnly = (reg.headers['set-cookie'] || []).find((c: string) => c.startsWith('access_token='))!.split(';')[0];

      await request(app.getHttpServer())
        .delete(`/user/${reg.body.id}`)
        .set('Cookie', accessOnly)
        .expect(403);
    });
  });
});
