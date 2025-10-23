import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFjellApp } from '../src/createApp.js';

describe('createFjellApp', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('applies JSON body parser by default', async () => {
    const app = createFjellApp();
    app.post('/echo', (req, res) => {
      res.json({ body: req.body });
    });

    const res = await request(app)
      .post('/echo')
      .send({ hello: 'world', num: 42 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: { hello: 'world', num: 42 } });
  });

  it('parses urlencoded bodies by default', async () => {
    const app = createFjellApp();
    app.post('/form', (req, res) => {
      res.json({ parsed: !!req.body?.a, body: req.body });
    });

    const res = await request(app)
      .post('/form')
      .type('form')
      .send({ a: '1' });

    expect(res.status).toBe(200);
    expect(res.body.parsed).toBe(true);
    expect(res.body.body).toEqual({ a: '1' });
  });

  it('can disable urlencoded parser', async () => {
    const app = createFjellApp({ urlencoded: false });
    app.post('/form', (req, res) => {
      res.json({ parsed: !!req.body?.a, body: req.body });
    });

    const res = await request(app)
      .post('/form')
      .type('form')
      .send({ a: '1' });

    expect(res.status).toBe(200);
    expect(res.body.parsed).toBe(false);
    // When urlencoded is disabled, body will not be parsed
    // and Express leaves it as undefined
    expect(res.body.body === undefined || Object.keys(res.body.body || {}).length === 0).toBe(true);
  });

  it('respects custom jsonLimit (returns 413 for large payloads)', async () => {
    const app = createFjellApp({ jsonLimit: '1kb' });
    app.post('/limit', (req, res) => {
      res.json({ ok: true });
    });

    const largePayload = { data: 'x'.repeat(2000) };
    const res = await request(app)
      .post('/limit')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    // Express reports large payloads as 413 Payload Too Large
    expect([413, 400]).toContain(res.status);
  });

  it('attempts to enable CORS and warns if cors package is missing', async () => {
    const app = createFjellApp({ cors: true });
    app.get('/ping', (_req, res) => res.json({ pong: true }));

    const res = await request(app).get('/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pong: true });

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toMatch(/cors package not installed/i);
  });

  it('adds x-request-id header when missing', async () => {
    const app = createFjellApp();
    app.get('/reqid', (req, res) => {
      res.json({ id: req.headers['x-request-id'] });
    });

    const res = await request(app).get('/reqid');
    expect(res.status).toBe(200);
    expect(res.body.id).toMatch(/^req-/);
  });

  it('preserves provided x-request-id header', async () => {
    const app = createFjellApp();
    app.get('/reqid', (req, res) => {
      res.json({ id: req.headers['x-request-id'] });
    });

    const res = await request(app)
      .get('/reqid')
      .set('x-request-id', 'custom-123');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('custom-123');
  });
});
