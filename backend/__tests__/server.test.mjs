import { jest } from "@jest/globals";
import request from 'supertest';

await jest.unstable_mockModule('../src/config/db.js', () => ({ prisma: {} }));

const { app, server } = await import('../src/server.js');

describe('server app', () => {
  test('does not open a listener in test mode', () => {
    expect(server).toBeNull();
  });

  test('responds on root route', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'API is running' });
  });

  test('responds on health route', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'success', message: 'Backend is healthy' });
  });

  test('requires a CSRF token for state-changing API requests', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'secret1' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ status: 'fail', message: 'Invalid CSRF token' });
  });

  test('issues a CSRF token that allows state-changing API requests to reach route validation', async () => {
    const agent = request.agent(app);
    const tokenResponse = await agent.get('/api/v1/auth/csrf-token');

    const response = await agent
      .post('/api/v1/auth/login')
      .set('X-CSRF-Token', tokenResponse.body.csrfToken)
      .send({ email: 'not-an-email', password: 'secret1' });

    expect(tokenResponse.status).toBe(200);
    expect(typeof tokenResponse.body.csrfToken).toBe('string');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  test('handles undefined routes with json error', async () => {
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'fail',
      message: "Can't find /missing-route on this server!",
    });
  });
});
