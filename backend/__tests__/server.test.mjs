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

  test('handles undefined routes with json error', async () => {
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'fail',
      message: "Can't find /missing-route on this server!",
    });
  });
});
