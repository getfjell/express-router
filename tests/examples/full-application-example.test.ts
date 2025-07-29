/**
 * Full Application Example Tests
 *
 * Comprehensive tests to verify the full application example functionality,
 * including data initialization, mock operations, API endpoints, middleware,
 * error handling, and business logic validation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { runFullApplicationExample } from '../../examples/full-application-example';

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Full Application Example', () => {
  let app: express.Application;

  beforeEach(async () => {
    const result = await runFullApplicationExample();
    app = result.app;
  });

  describe('Application Setup', () => {
    it('should return app with correct structure', async () => {
      const result = await runFullApplicationExample();

      expect(result).toHaveProperty('app');
      expect(result.app).toBeDefined();
      expect(typeof result.app.listen).toBe('function');
    });

    it('should setup production-ready application with all required methods', async () => {
      const result = await runFullApplicationExample();

      expect(result.app).toBeDefined();
      expect(typeof result.app.get).toBe('function');
      expect(typeof result.app.post).toBe('function');
      expect(typeof result.app.put).toBe('function');
      expect(typeof result.app.delete).toBe('function');
      expect(typeof result.app.use).toBe('function');
    });
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await supertest(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('customers');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('orders');
    });

    it('should return valid timestamp', async () => {
      const response = await supertest(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Dashboard Endpoint', () => {
    it('should return dashboard data with correct structure', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('customerTiers');
      expect(response.body).toHaveProperty('orderStatuses');
      expect(response.body).toHaveProperty('featuredProducts');
      expect(response.body).toHaveProperty('recentOrders');
    });

    it('should return correct summary statistics', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { summary } = response.body;
      expect(summary).toHaveProperty('totalCustomers');
      expect(summary).toHaveProperty('totalProducts');
      expect(summary).toHaveProperty('totalOrders');
      expect(summary).toHaveProperty('revenue');

      expect(typeof summary.totalCustomers).toBe('number');
      expect(typeof summary.totalProducts).toBe('number');
      expect(typeof summary.totalOrders).toBe('number');
      expect(typeof summary.revenue).toBe('number');
    });

    it('should return customer tier distribution', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { customerTiers } = response.body;
      expect(typeof customerTiers).toBe('object');

      // Should have at least one tier with customers
      const tierCounts = Object.values(customerTiers);
      expect(tierCounts.some((count: any) => count > 0)).toBe(true);
    });

    it('should return order status distribution', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { orderStatuses } = response.body;
      expect(typeof orderStatuses).toBe('object');

      // Should have at least one status with orders
      const statusCounts = Object.values(orderStatuses);
      expect(statusCounts.some((count: any) => count > 0)).toBe(true);
    });

    it('should return featured products array', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { featuredProducts } = response.body;
      expect(Array.isArray(featuredProducts)).toBe(true);
    });

    it('should return recent orders (max 10)', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { recentOrders } = response.body;
      expect(Array.isArray(recentOrders)).toBe(true);
      expect(recentOrders.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Catalog Endpoint', () => {
    it('should return catalog data with correct structure', async () => {
      const response = await supertest(app)
        .get('/api/catalog')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('filters');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await supertest(app)
        .get('/api/catalog?category=Electronics')
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) => product.category === 'Electronics')).toBe(true);
    });

    it('should filter featured products', async () => {
      const response = await supertest(app)
        .get('/api/catalog?featured=true')
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) => product.featured === true)).toBe(true);
    });

    it('should filter by minimum price', async () => {
      const minPrice = 200;
      const response = await supertest(app)
        .get(`/api/catalog?minPrice=${minPrice}`)
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) => product.price >= minPrice)).toBe(true);
    });

    it('should filter by maximum price', async () => {
      const maxPrice = 400;
      const response = await supertest(app)
        .get(`/api/catalog?maxPrice=${maxPrice}`)
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) => product.price <= maxPrice)).toBe(true);
    });

    it('should search by product name', async () => {
      const searchTerm = 'headphones';
      const response = await supertest(app)
        .get(`/api/catalog?search=${searchTerm}`)
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      )).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const response = await supertest(app)
        .get('/api/catalog?category=Electronics&featured=true&minPrice=200')
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) =>
        product.category === 'Electronics' &&
        product.featured === true &&
        product.price >= 200
      )).toBe(true);
    });

    it('should return correct filters in response', async () => {
      const response = await supertest(app)
        .get('/api/catalog?category=Electronics&featured=true&minPrice=200&maxPrice=500&search=headphones')
        .expect(200);

      expect(response.body.filters).toEqual({
        category: 'Electronics',
        featured: 'true',
        minPrice: '200',
        maxPrice: '500',
        search: 'headphones'
      });
    });
  });

  describe('Customer Analytics Endpoint', () => {
    it('should return analytics for existing customer', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('customer');
      expect(response.body).toHaveProperty('orderStats');
      expect(response.body).toHaveProperty('recentOrders');
    });

    it('should return correct customer information', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { customer } = response.body;
      expect(customer).toHaveProperty('id', 'cust-1');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('tier');
      expect(customer).toHaveProperty('registrationDate');
    });

    it('should return order statistics', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { orderStats } = response.body;
      expect(orderStats).toHaveProperty('totalOrders');
      expect(orderStats).toHaveProperty('totalSpent');
      expect(orderStats).toHaveProperty('averageOrderValue');
      expect(orderStats).toHaveProperty('ordersByStatus');

      expect(typeof orderStats.totalOrders).toBe('number');
      expect(typeof orderStats.totalSpent).toBe('number');
      expect(typeof orderStats.averageOrderValue).toBe('number');
      expect(typeof orderStats.ordersByStatus).toBe('object');
    });

    it('should return recent orders (max 5)', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { recentOrders } = response.body;
      expect(Array.isArray(recentOrders)).toBe(true);
      expect(recentOrders.length).toBeLessThanOrEqual(5);
    });

    it('should handle non-existent customer', async () => {
      await supertest(app)
        .get('/api/customers/non-existent/analytics')
        .expect(500); // Will trigger error handler since customer not found
    });
  });

  describe('Customer Management Routes', () => {
    it('should return all customers', async () => {
      const response = await supertest(app)
        .get('/api/customers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return specific customer', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'cust-1');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('tier');
    });

    it('should create new customer', async () => {
      const newCustomer = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1-555-9999',
        address: {
          street: '999 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345'
        },
        tier: 'bronze'
      };

      const response = await supertest(app)
        .post('/api/customers')
        .send(newCustomer)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newCustomer.name);
      expect(response.body.email).toBe(newCustomer.email);
      expect(response.body.tier).toBe(newCustomer.tier);
    });

    it('should update existing customer', async () => {
      const updates = {
        name: 'Updated Name',
        tier: 'silver'
      };

      const response = await supertest(app)
        .put('/api/customers/cust-1')
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.tier).toBe(updates.tier);
      expect(response.body.id).toBe('cust-1');
    });

    it('should delete customer', async () => {
      await supertest(app)
        .delete('/api/customers/cust-2')
        .expect(200);
    });

    it('should find customers by tier', async () => {
      const response = await supertest(app)
        .get('/api/customers/find/byTier?tier=gold')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((customer: any) => customer.tier === 'gold')).toBe(true);
    });

    it('should find customers by state', async () => {
      const response = await supertest(app)
        .get('/api/customers/find/byState?state=CA')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((customer: any) => customer.address.state === 'CA')).toBe(true);
    });
  });

  describe('Product Management Routes', () => {
    it('should return all products', async () => {
      const response = await supertest(app)
        .get('/api/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return specific product', async () => {
      const response = await supertest(app)
        .get('/api/products/prod-1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'prod-1');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('category');
    });

    it('should create new product', async () => {
      const newProduct = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Test',
        inStock: 10,
        sku: 'TEST-001',
        featured: false
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(newProduct)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newProduct.name);
      expect(response.body.price).toBe(newProduct.price);
      expect(response.body.category).toBe(newProduct.category);
    });

    it('should update existing product', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 199.99,
        featured: true
      };

      const response = await supertest(app)
        .put('/api/products/prod-1')
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.price).toBe(updates.price);
      expect(response.body.featured).toBe(updates.featured);
      expect(response.body.id).toBe('prod-1');
    });

    it('should delete product', async () => {
      await supertest(app)
        .delete('/api/products/prod-2')
        .expect(200);
    });

    it('should find products by category', async () => {
      const response = await supertest(app)
        .get('/api/products/find/byCategory?category=Electronics')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((product: any) => product.category === 'Electronics')).toBe(true);
    });

    it('should find featured products', async () => {
      const response = await supertest(app)
        .get('/api/products/find/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((product: any) => product.featured === true)).toBe(true);
    });

    it('should find products in stock', async () => {
      const response = await supertest(app)
        .get('/api/products/find/inStock')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((product: any) => product.inStock > 0)).toBe(true);
    });
  });

  describe('Order Management Routes', () => {
    it('should return all orders for customer', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return specific order', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders/order-1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'order-1');
      expect(response.body).toHaveProperty('customerId', 'cust-1');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('total');
    });

    it('should create new order', async () => {
      const newOrder = {
        customerId: 'cust-1',
        orderDate: new Date().toISOString(),
        status: 'pending',
        total: 150.00,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345'
        }
      };

      const response = await supertest(app)
        .post('/api/customers/cust-1/orders')
        .send(newOrder);

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      console.log('Response text:', response.text);

      if (response.status !== 200) {
        throw new Error(`Order creation failed with status ${response.status}: ${response.text}`);
      }

      expect(response.body).toHaveProperty('id');
      expect(response.body.customerId).toBe('cust-1');
      expect(response.body.status).toBe(newOrder.status);
      expect(response.body.total).toBe(newOrder.total);
    });

    it('should update existing order', async () => {
      const updates = {
        status: 'processing',
        total: 299.99
      };

      const response = await supertest(app)
        .put('/api/customers/cust-1/orders/order-1')
        .send(updates)
        .expect(200);

      expect(response.body.status).toBe(updates.status);
      expect(response.body.total).toBe(updates.total);
      expect(response.body.id).toBe('order-1');
    });

    it('should delete order', async () => {
      await supertest(app)
        .delete('/api/customers/cust-1/orders/order-1')
        .expect(200);
    });

    it('should find orders by status', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders/find/byStatus?status=delivered')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((order: any) => order.status === 'delivered')).toBe(true);
    });

    it('should find orders by customer', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders/find/byCustomer?customerId=cust-1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((order: any) => order.customerId === 'cust-1')).toBe(true);
    });
  });

  describe('Middleware and Error Handling', () => {
    it('should handle CORS headers', async () => {
      const response = await supertest(app)
        .options('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['x-powered-by']).toBe('Fjell Express Router');
    });

    it('should validate customer tier middleware', async () => {
      await supertest(app)
        .get('/health')
        .set('x-customer-tier', 'invalid-tier')
        .expect(400);
    });

    it('should accept valid customer tier', async () => {
      await supertest(app)
        .get('/health')
        .set('x-customer-tier', 'gold')
        .expect(200);
    });

    it('should handle 404 for unknown routes', async () => {
      const response = await supertest(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('path', '/api/nonexistent');
    });

    it('should handle server errors gracefully', async () => {
      // This will trigger an error since we're trying to get analytics for non-existent customer
      const response = await supertest(app)
        .get('/api/customers/non-existent/analytics')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields when creating customer', async () => {
      const invalidCustomer = {
        name: 'Test Customer'
        // Missing required fields
      };

      await supertest(app)
        .post('/api/customers')
        .send(invalidCustomer)
        .expect(500); // Will trigger error due to missing fields
    });

    it('should validate required fields when creating product', async () => {
      const invalidProduct = {
        name: 'Test Product'
        // Missing required fields
      };

      await supertest(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(500); // Will trigger error due to missing fields
    });

    it('should handle invalid JSON in request body', async () => {
      await supertest(app)
        .post('/api/customers')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Business Logic Validation', () => {
    it('should calculate correct revenue in dashboard', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { summary } = response.body;
      expect(summary.revenue).toBeGreaterThanOrEqual(0);
    });

    it('should calculate correct average order value', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { orderStats } = response.body;
      if (orderStats.totalOrders > 0) {
        expect(orderStats.averageOrderValue).toBe(orderStats.totalSpent / orderStats.totalOrders);
      } else {
        expect(orderStats.averageOrderValue).toBe(0);
      }
    });

    it('should sort recent orders by date descending', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { recentOrders } = response.body;
      if (recentOrders.length > 1) {
        for (let i = 0; i < recentOrders.length - 1; i++) {
          const currentDate = new Date(recentOrders[i].orderDate);
          const nextDate = new Date(recentOrders[i + 1].orderDate);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });

    it('should limit recent orders to maximum count', async () => {
      const dashboardResponse = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const analyticsResponse = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      expect(dashboardResponse.body.recentOrders.length).toBeLessThanOrEqual(10);
      expect(analyticsResponse.body.recentOrders.length).toBeLessThanOrEqual(5);
    });
  });
});
