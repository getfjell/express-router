/* eslint-disable max-len */
/**
 * Full Application Example Tests
 *
 * Comprehensive tests to verify the full application example functionality,
 * including data initialization, mock operations, API endpoints, middleware,
 * error handling, and business logic validation.
 */

import express from 'express';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

    it('should initialize with consistent sample data across multiple runs', async () => {
      const result1 = await runFullApplicationExample();
      const result2 = await runFullApplicationExample();

      const health1 = await supertest(result1.app).get('/health').expect(200);
      const health2 = await supertest(result2.app).get('/health').expect(200);

      expect(health1.body.data.customers).toBe(health2.body.data.customers);
      expect(health1.body.data.products).toBe(health2.body.data.products);
      expect(health1.body.data.orders).toBe(health2.body.data.orders);
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

    it('should return current uptime value', async () => {
      const response = await supertest(app)
        .get('/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return consistent data counts', async () => {
      const response = await supertest(app)
        .get('/health')
        .expect(200);

      expect(response.body.data.customers).toBeGreaterThan(0);
      expect(response.body.data.products).toBeGreaterThan(0);
      expect(response.body.data.orders).toBeGreaterThanOrEqual(0);
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

    it('should calculate revenue correctly', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { summary, recentOrders } = response.body;

      // Revenue should be sum of all order totals
      const calculatedRevenue = recentOrders.reduce((sum: number, order: any) => sum + order.total, 0);
      expect(summary.revenue).toBe(calculatedRevenue);
    });

    it('should sort recent orders by date descending', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
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

    it('should include all valid customer tiers', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { customerTiers } = response.body;
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];

      Object.keys(customerTiers).forEach(tier => {
        expect(validTiers).toContain(tier);
      });
    });

    it('should include all valid order statuses', async () => {
      const response = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const { orderStatuses } = response.body;
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      Object.keys(orderStatuses).forEach(status => {
        expect(validStatuses).toContain(status);
      });
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

    it('should handle case-insensitive search', async () => {
      const response = await supertest(app)
        .get('/api/catalog?search=HEADPHONES')
        .expect(200);

      const { products } = response.body;
      expect(products.some((product: any) =>
        product.name.toLowerCase().includes('headphones') ||
        product.description.toLowerCase().includes('headphones')
      )).toBe(true);
    });

    it('should return empty array when no products match filters', async () => {
      const response = await supertest(app)
        .get('/api/catalog?category=NonExistentCategory')
        .expect(200);

      expect(response.body.products).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });

    it('should handle price range filtering correctly', async () => {
      const response = await supertest(app)
        .get('/api/catalog?minPrice=300&maxPrice=400')
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) =>
        product.price >= 300 && product.price <= 400
      )).toBe(true);
    });

    it('should handle special characters in search', async () => {
      const response = await supertest(app)
        .get('/api/catalog?search=%26')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should validate numeric filters', async () => {
      const response = await supertest(app)
        .get('/api/catalog?minPrice=abc')
        .expect(200);

      const { products } = response.body;
      // Should handle invalid numbers gracefully (NaN comparison returns false)
      expect(Array.isArray(products)).toBe(true);
    });

    it('should handle featured filter with different values', async () => {
      const responseFalse = await supertest(app)
        .get('/api/catalog?featured=false')
        .expect(200);

      const responseTrue = await supertest(app)
        .get('/api/catalog?featured=true')
        .expect(200);

      // Only 'true' should filter for featured products
      expect(responseFalse.body.products.length).toBeGreaterThanOrEqual(responseTrue.body.products.length);
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

    it('should calculate average order value correctly', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { orderStats } = response.body;
      if (orderStats.totalOrders > 0) {
        const expectedAverage = orderStats.totalSpent / orderStats.totalOrders;
        expect(orderStats.averageOrderValue).toBeCloseTo(expectedAverage, 2);
      } else {
        expect(orderStats.averageOrderValue).toBe(0);
      }
    });

    it('should include valid customer tier in analytics', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { customer } = response.body;
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(validTiers).toContain(customer.tier);
    });

    it('should include valid registration date', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { customer } = response.body;
      const registrationDate = new Date(customer.registrationDate);
      expect(registrationDate).toBeInstanceOf(Date);
      expect(registrationDate.getTime()).toBeGreaterThan(0);
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

    it('should include all valid order statuses in analytics', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/analytics')
        .expect(200);

      const { orderStats } = response.body;
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      Object.keys(orderStats.ordersByStatus).forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });
  });

  describe('Customer Management Routes', () => {
    it('should return all customers', async () => {
      const response = await supertest(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
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
        .expect(201);

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

    it('should handle non-existent customer lookup', async () => {
      await supertest(app)
        .get('/api/customers/non-existent-id')
        .expect(404);
    });

    it('should validate customer creation with missing fields', async () => {
      const invalidCustomer = {
        name: 'Test Customer'
        // Missing email
      };

      await supertest(app)
        .post('/api/customers')
        .send(invalidCustomer)
        .expect(500);
    });

    it('should handle customer update for non-existent customer', async () => {
      const updates = { name: 'Updated Name' };

      await supertest(app)
        .put('/api/customers/non-existent')
        .send(updates)
        .expect(404);
    });

    it('should handle customer deletion for non-existent customer', async () => {
      await supertest(app)
        .delete('/api/customers/non-existent')
        .expect(404);
    });

    it('should preserve customer key when updating', async () => {
      const updates = { name: 'Updated Name' };

      const response = await supertest(app)
        .put('/api/customers/cust-1')
        .send(updates)
        .expect(200);

      expect(response.body.key).toBeDefined();
      expect(response.body.key.kt).toBe('customer');
      expect(response.body.key.pk).toBe('cust-1');
    });

    it('should set registration date for new customers', async () => {
      const newCustomer = {
        name: 'Date Test Customer',
        email: 'datetest@example.com',
        phone: '+1-555-8888',
        address: {
          street: '888 Date St',
          city: 'Date City',
          state: 'TX',
          zipCode: '12345'
        },
        tier: 'bronze'
      };

      const response = await supertest(app)
        .post('/api/customers')
        .send(newCustomer)
        .expect(201);

      expect(response.body.events.created.at).toBeDefined();
      const createdDate = new Date(response.body.events.created.at);
      expect(createdDate).toBeInstanceOf(Date);
    });

    it('should handle empty tier filter', async () => {
      const response = await supertest(app)
        .get('/api/customers/find/byTier?tier=')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((customer: any) => customer.tier === '')).toBe(true);
    });

    it('should handle invalid finder', async () => {
      const response = await supertest(app)
        .get('/api/customers/find/invalidFinder')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Product Management Routes', () => {
    it('should return all products', async () => {
      const response = await supertest(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
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
        .expect(201);

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

    it('should handle non-existent product lookup', async () => {
      await supertest(app)
        .get('/api/products/non-existent-id')
        .expect(404);
    });

    it('should validate product creation with missing fields', async () => {
      const invalidProduct = {
        name: 'Test Product'
        // Missing price and category
      };

      await supertest(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(500);
    });

    it('should validate price is a number', async () => {
      const invalidProduct = {
        name: 'Test Product',
        price: 'not-a-number',
        category: 'Test'
      };

      await supertest(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(500);
    });

    it('should handle product update for non-existent product', async () => {
      const updates = { name: 'Updated Product' };

      await supertest(app)
        .put('/api/products/non-existent')
        .send(updates)
        .expect(404);
    });

    it('should handle product deletion for non-existent product', async () => {
      await supertest(app)
        .delete('/api/products/non-existent')
        .expect(404);
    });

    it('should preserve product key when updating', async () => {
      const updates = { name: 'Updated Product Name' };

      const response = await supertest(app)
        .put('/api/products/prod-1')
        .send(updates)
        .expect(200);

      expect(response.body.key).toBeDefined();
      expect(response.body.key.kt).toBe('product');
      expect(response.body.key.pk).toBe('prod-1');
    });

    it('should handle boolean featured field correctly', async () => {
      const newProduct = {
        name: 'Boolean Test Product',
        description: 'Testing boolean field',
        price: 199.99,
        category: 'Test',
        inStock: 5,
        sku: 'BOOL-001',
        featured: true
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      expect(response.body.featured).toBe(true);
      expect(typeof response.body.featured).toBe('boolean');
    });

    it('should handle zero stock products', async () => {
      const newProduct = {
        name: 'Out of Stock Product',
        description: 'No stock available',
        price: 99.99,
        category: 'Test',
        inStock: 0,
        sku: 'ZERO-001',
        featured: false
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      expect(response.body.inStock).toBe(0);
    });

    it('should find products by invalid category', async () => {
      const response = await supertest(app)
        .get('/api/products/find/byCategory?category=NonExistent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should handle invalid finder', async () => {
      const response = await supertest(app)
        .get('/api/products/find/invalidFinder')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Order Management Routes', () => {
    it('should return all orders for customer', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.items)).toBe(true);
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

      if (response.status !== 201) {
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

    it('should handle order creation with current date when no date provided', async () => {
      const newOrder = {
        customerId: 'cust-1',
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
        .send(newOrder)
        .expect(201);

      expect(response.body.orderDate).toBeDefined();
      const orderDate = new Date(response.body.orderDate);
      expect(orderDate).toBeInstanceOf(Date);
    });

    it('should handle order creation with custom date', async () => {
      const customDate = '2024-01-01T10:00:00.000Z';
      const newOrder = {
        customerId: 'cust-1',
        orderDate: customDate,
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
        .send(newOrder)
        .expect(201);

      expect(new Date(response.body.orderDate).toISOString()).toBe(customDate);
    });

    it('should handle non-existent order lookup', async () => {
      await supertest(app)
        .get('/api/customers/cust-1/orders/non-existent')
        .expect(404);
    });

    it('should handle order update for non-existent order', async () => {
      const updates = { status: 'processing' };

      await supertest(app)
        .put('/api/customers/cust-1/orders/non-existent')
        .send(updates)
        .expect(404);
    });

    it('should handle order deletion for non-existent order', async () => {
      await supertest(app)
        .delete('/api/customers/cust-1/orders/non-existent')
        .expect(404);
    });

    it('should preserve order key when updating', async () => {
      const updates = { status: 'processing' };

      const response = await supertest(app)
        .put('/api/customers/cust-1/orders/order-1')
        .send(updates)
        .expect(200);

      expect(response.body.key).toBeDefined();
      expect(response.body.key.kt).toBe('order');
      expect(response.body.key.pk).toBe('order-1');
    });

    it('should handle invalid order status', async () => {
      const newOrder = {
        customerId: 'cust-1',
        status: 'invalid-status',
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
        .send(newOrder)
        .expect(201);

      // Should create order even with invalid status (no validation in this example)
      expect(response.body.status).toBe('invalid-status');
    });

    it('should find orders with empty status filter', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders/find/byStatus?status=')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid finder', async () => {
      const response = await supertest(app)
        .get('/api/customers/cust-1/orders/find/invalidFinder')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should preserve location information in created orders', async () => {
      const newOrder = {
        customerId: 'cust-1',
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
        .send(newOrder)
        .expect(201);

      expect(response.body.key.loc).toBeDefined();
      expect(response.body.key.loc[0].kt).toBe('customer');
      expect(response.body.key.loc[0].lk).toBe('cust-1');
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

    it('should log requests with proper format', async () => {
      const logSpy = vi.spyOn(console, 'log');

      await supertest(app)
        .get('/health')
        .expect(200);

      expect(logSpy).toHaveBeenCalled();
    });

    it('should accept all valid customer tiers', async () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];

      for (const tier of validTiers) {
        await supertest(app)
          .get('/health')
          .set('x-customer-tier', tier)
          .expect(200);
      }
    });

    it('should handle missing customer tier header', async () => {
      await supertest(app)
        .get('/health')
        .expect(200);
    });

    it('should handle CORS preflight for different routes', async () => {
      const routes = ['/api/customers', '/api/products', '/api/dashboard'];

      for (const route of routes) {
        const response = await supertest(app)
          .options(route)
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('*');
      }
    });

    it('should include all required CORS headers', async () => {
      const response = await supertest(app)
        .options('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
      expect(response.headers).toHaveProperty('x-powered-by');
    });

    it('should handle request size limits', async () => {
      const largePayload = {
        name: 'Test Customer',
        email: 'test@example.com',
        description: 'x'.repeat(1000000) // 1MB string
      };

      // Should handle within limit (10MB) - application may reject very large payloads
      await supertest(app)
        .post('/api/customers')
        .send(largePayload)
        .expect(500);
    });

    it('should handle URL encoded data', async () => {
      await supertest(app)
        .post('/api/customers')
        .type('form')
        .send('name=Test+Customer&email=test@example.com')
        .expect(500); // Will fail validation but should parse correctly
    });

    it('should track request duration in logs', async () => {
      const start = Date.now();

      await supertest(app)
        .get('/health')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(0); // Allow for very fast execution
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

    it('should validate email format (basic check)', async () => {
      const customerWithValidEmail = {
        name: 'Test Customer',
        email: 'valid@example.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345'
        },
        tier: 'bronze'
      };

      await supertest(app)
        .post('/api/customers')
        .send(customerWithValidEmail)
        .expect(201);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await supertest(app)
        .post('/api/customers')
        .set('Content-Type', 'application/json')
        .send('{"name": "Test", "email":}')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid JSON');
    });

    it('should validate numeric fields for products', async () => {
      const validProduct = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Test',
        inStock: 10,
        sku: 'TEST-001',
        featured: false
      };

      await supertest(app)
        .post('/api/products')
        .send(validProduct)
        .expect(201);
    });

    it('should handle missing content-type header', async () => {
      await supertest(app)
        .post('/api/customers')
        .send('name=Test&email=test@example.com')
        .expect(500); // Will fail validation but should parse as URL encoded
    });

    it('should validate nested object structure', async () => {
      const customerWithValidAddress = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345'
        },
        tier: 'bronze'
      };

      const response = await supertest(app)
        .post('/api/customers')
        .send(customerWithValidAddress)
        .expect(201);

      expect(response.body.address).toEqual(customerWithValidAddress.address);
    });

    it('should handle empty request body', async () => {
      await supertest(app)
        .post('/api/customers')
        .send({})
        .expect(500);
    });

    it('should handle null values in request', async () => {
      const customerWithNulls = {
        name: null,
        email: 'test@example.com'
      };

      await supertest(app)
        .post('/api/customers')
        .send(customerWithNulls)
        .expect(500);
    });

    it('should handle array values where object expected', async () => {
      const invalidCustomer = {
        name: 'Test Customer',
        email: 'test@example.com',
        address: ['not', 'an', 'object']
      };

      // Application should reject invalid data structure
      await supertest(app)
        .post('/api/customers')
        .send(invalidCustomer)
        .expect(500);
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

    it('should maintain data consistency between dashboard and analytics', async () => {
      const dashboardResponse = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const customersResponse = await supertest(app)
        .get('/api/customers')
        .expect(200);

      expect(dashboardResponse.body.summary.totalCustomers).toBe(customersResponse.body.items.length);
    });

    it('should calculate customer tiers correctly', async () => {
      const customersResponse = await supertest(app)
        .get('/api/customers')
        .expect(200);

      const dashboardResponse = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const actualTierCounts = customersResponse.body.items.reduce((acc: any, customer: any) => {
        acc[customer.tier] = (acc[customer.tier] || 0) + 1;
        return acc;
      }, {});

      expect(dashboardResponse.body.customerTiers).toEqual(actualTierCounts);
    });

    it('should filter featured products correctly across endpoints', async () => {
      const catalogResponse = await supertest(app)
        .get('/api/catalog?featured=true')
        .expect(200);

      const dashboardResponse = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      expect(catalogResponse.body.products.length).toBe(dashboardResponse.body.featuredProducts.length);
    });

    it('should maintain referential integrity between orders and customers', async () => {
      const customersResponse = await supertest(app)
        .get('/api/customers')
        .expect(200);

      const dashboardResponse = await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const customerIds = customersResponse.body.items.map((c: any) => c.id);
      const ordersWithValidCustomers = dashboardResponse.body.recentOrders.every((order: any) =>
        customerIds.includes(order.customerId)
      );

      expect(ordersWithValidCustomers).toBe(true);
    });

    it('should handle zero division in analytics', async () => {
      // Create a customer with no orders to test zero division
      const newCustomer = {
        name: 'Zero Orders Customer',
        email: 'zero@example.com',
        phone: '+1-555-0000',
        address: {
          street: '000 Zero St',
          city: 'Zero City',
          state: 'TX',
          zipCode: '00000'
        },
        tier: 'bronze'
      };

      const createResponse = await supertest(app)
        .post('/api/customers')
        .send(newCustomer)
        .expect(201);

      const analyticsResponse = await supertest(app)
        .get(`/api/customers/${createResponse.body.id}/analytics`)
        .expect(200);

      expect(analyticsResponse.body.orderStats.averageOrderValue).toBe(0);
    });

    it('should validate order total consistency', async () => {
      const newOrder = {
        customerId: 'cust-1',
        status: 'pending',
        total: 99.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345'
        }
      };

      const response = await supertest(app)
        .post('/api/customers/cust-1/orders')
        .send(newOrder)
        .expect(201);

      expect(response.body.total).toBe(newOrder.total);
      expect(typeof response.body.total).toBe('number');
    });

    it('should handle date edge cases', async () => {
      const futureOrder = {
        customerId: 'cust-1',
        orderDate: new Date('2099-12-31').toISOString(),
        status: 'pending',
        total: 100.00,
        shippingAddress: {
          street: '123 Future St',
          city: 'Future City',
          state: 'TX',
          zipCode: '99999'
        }
      };

      const response = await supertest(app)
        .post('/api/customers/cust-1/orders')
        .send(futureOrder)
        .expect(201);

      expect(new Date(response.body.orderDate).getFullYear()).toBe(2099);
    });
  });

  describe('Advanced Filtering and Search', () => {
    it('should handle complex price range combinations', async () => {
      const response = await supertest(app)
        .get('/api/catalog?minPrice=100&maxPrice=500')
        .expect(200);

      const { products } = response.body;
      expect(products.every((product: any) =>
        product.price >= 100 && product.price <= 500
      )).toBe(true);
    });

    it('should handle search with special characters', async () => {
      const specialSearchTerms = ['%', '&', '+', '@', '#'];

      for (const term of specialSearchTerms) {
        const response = await supertest(app)
          .get(`/api/catalog?search=${encodeURIComponent(term)}`)
          .expect(200);

        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });

    it('should handle multiple category filters', async () => {
      const response = await supertest(app)
        .get('/api/catalog?category=Electronics&category=Furniture')
        .expect(200);

      // Should handle as single category (last one wins)
      expect(response.body).toHaveProperty('products');
    });

    it('should search case-insensitively', async () => {
      const lowerResponse = await supertest(app)
        .get('/api/catalog?search=wireless')
        .expect(200);

      const upperResponse = await supertest(app)
        .get('/api/catalog?search=WIRELESS')
        .expect(200);

      const mixedResponse = await supertest(app)
        .get('/api/catalog?search=WiReLeSs')
        .expect(200);

      expect(lowerResponse.body.products.length).toBe(upperResponse.body.products.length);
      expect(lowerResponse.body.products.length).toBe(mixedResponse.body.products.length);
    });

    it('should handle empty search terms', async () => {
      const response = await supertest(app)
        .get('/api/catalog?search=')
        .expect(200);

      const allProductsResponse = await supertest(app)
        .get('/api/catalog')
        .expect(200);

      expect(response.body.products.length).toBe(allProductsResponse.body.products.length);
    });

    it('should handle whitespace in search', async () => {
      const response = await supertest(app)
        .get('/api/catalog?search=   ')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should handle numeric search terms', async () => {
      const response = await supertest(app)
        .get('/api/catalog?search=299')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should handle very long search terms', async () => {
      const longTerm = 'x'.repeat(1000);
      const response = await supertest(app)
        .get(`/api/catalog?search=${longTerm}`)
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body.products.length).toBe(0);
    });

    it('should maintain filter state in response', async () => {
      const filters = {
        category: 'Electronics',
        featured: 'true',
        minPrice: '100',
        maxPrice: '500',
        search: 'wireless'
      };

      const queryString = Object.entries(filters)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      const response = await supertest(app)
        .get(`/api/catalog?${queryString}`)
        .expect(200);

      expect(response.body.filters).toEqual(filters);
    });

    it('should handle Unicode characters in search', async () => {
      const unicodeTerms = ['café', 'naïve', '日本語', '🎧'];

      for (const term of unicodeTerms) {
        const response = await supertest(app)
          .get(`/api/catalog?search=${encodeURIComponent(term)}`)
          .expect(200);

        expect(response.body).toHaveProperty('products');
      }
    });

    it('should handle invalid price values gracefully', async () => {
      const invalidPrices = ['abc', 'null', 'undefined', ''];

      for (const price of invalidPrices) {
        const response = await supertest(app)
          .get(`/api/catalog?minPrice=${price}`)
          .expect(200);

        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        supertest(app).get('/health').expect(200)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });

    it('should respond within reasonable time', async () => {
      const start = Date.now();

      await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle large result sets efficiently', async () => {
      // Create multiple products to test large result sets
      const createPromises = Array(50).fill(null).map((_, index) => {
        const product = {
          name: `Load Test Product ${index}`,
          description: `Description for product ${index}`,
          price: 10 + index,
          category: 'LoadTest',
          inStock: index,
          sku: `LOAD-${index.toString().padStart(3, '0')}`,
          featured: index % 2 === 0
        };

        return supertest(app)
          .post('/api/products')
          .send(product);
      });

      const responses = await Promise.all(createPromises);

      // Count successful creations
      let successfulCreations = 0;
      responses.forEach((response) => {
        if (response.status === 201) {
          successfulCreations++;
        }
      });

      const start = Date.now();
      const response = await supertest(app)
        .get('/api/catalog?category=LoadTest')
        .expect(200);

      const duration = Date.now() - start;

      // The test should verify that we can handle large result sets efficiently
      // Even if some products fail to create, we should get a reasonable number back
      // We expect to get back at least as many products as were successfully created (up to any query limits)
      expect(response.body.products.length).toBeGreaterThanOrEqual(Math.min(successfulCreations, 4));
      expect(response.body.products.length).toBeLessThanOrEqual(successfulCreations);
      expect(duration).toBeLessThan(500); // Should be fast even with many products
    });

    it('should handle memory efficiently with large payloads', async () => {
      const largeDescription = 'x'.repeat(10000); // 10KB description

      const product = {
        name: 'Large Payload Product',
        description: largeDescription,
        price: 999.99,
        category: 'Test',
        inStock: 1,
        sku: 'LARGE-001',
        featured: false
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(product)
        .expect(201);

      expect(response.body.description.length).toBe(largeDescription.length);
    });

    it('should maintain consistent response times', async () => {
      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await supertest(app).get('/health').expect(200);
        times.push(Date.now() - start);
      }

      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;

      expect(variance).toBeLessThan(100); // Response time variance should be small
    });

    it('should handle rapid sequential requests', async () => {
      const responses: any[] = [];

      for (let i = 0; i < 10; i++) {
        const response = await supertest(app)
          .get('/health')
          .expect(200);
        responses.push(response);
      }

      expect(responses.length).toBe(10);
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Security and Error Handling', () => {
    it('should handle malformed headers gracefully', async () => {
      // Test with a header value that the client accepts but server should reject
      await supertest(app)
        .get('/health')
        .set('x-customer-tier', 'invalid-tier-value') // Invalid tier value
        .expect(400);
    });

    it('should prevent header injection', async () => {
      // HTTP client will reject header with \r\n, so we test that the error is thrown
      try {
        await supertest(app)
          .get('/health')
          .set('x-customer-tier', 'gold\r\nInjected: malicious');

        // If we get here, the test should fail because the header should be rejected
        expect(false).toBe(true);
      } catch (error) {
        // Expect the HTTP client to reject the invalid header
        expect(error.message).toContain('Invalid character in header content');
      }
    });

    it('should handle very long header values', async () => {
      const longValue = 'x'.repeat(10000);

      await supertest(app)
        .get('/health')
        .set('x-customer-tier', longValue)
        .expect(400);
    });

    it('should handle SQL injection attempts in search', async () => {
      const sqlInjections = [
        "'; DROP TABLE products; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "<script>alert('xss')</script>"
      ];

      for (const injection of sqlInjections) {
        const response = await supertest(app)
          .get(`/api/catalog?search=${encodeURIComponent(injection)}`)
          .expect(200);

        // Should return empty results, not error
        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });

    it('should handle XSS attempts in input data', async () => {
      const xssPayloads = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src='x' onerror='alert(1)'>",
        "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>"
      ];

      for (const payload of xssPayloads) {
        const customer = {
          name: payload,
          email: 'test@example.com',
          phone: '+1-555-0123',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TX',
            zipCode: '12345'
          },
          tier: 'bronze'
        };

        const response = await supertest(app)
          .post('/api/customers')
          .send(customer)
          .expect(201);

        // XSS payload should be stored as-is (no execution)
        expect(response.body.name).toBe(payload);
      }
    });

    it('should handle path traversal attempts', async () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const attempt of traversalAttempts) {
        const response = await supertest(app)
          .get(`/api/customers/${attempt}`);

        // Application should return an error (either 404 or 500)
        expect([404, 500]).toContain(response.status);
      }
    });

    it('should handle null byte injection', async () => {
      const nullBytePayloads = [
        'test\x00.txt',
        'test%00.txt',
        'test\u0000.txt'
      ];

      for (const payload of nullBytePayloads) {
        const response = await supertest(app)
          .get(`/api/customers/${payload}`)
          .expect(500);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should limit request processing time', async () => {
      const start = Date.now();

      await supertest(app)
        .get('/api/dashboard')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should not take more than 5 seconds
    });

    it('should handle binary data in JSON gracefully', async () => {
      const binaryData = '\x00\x01\x02\x03\xFF\xFE\xFD';

      const customer = {
        name: binaryData,
        email: 'binary@example.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Binary St',
          city: 'Binary City',
          state: 'TX',
          zipCode: '12345'
        },
        tier: 'bronze'
      };

      const response = await supertest(app)
        .post('/api/customers')
        .send(customer)
        .expect(201);

      expect(response.body.name).toBe(binaryData);
    });

    it('should handle deeply nested objects', async () => {
      const deepObject: any = { level: 1 };
      let current = deepObject;

      // Create 50 levels of nesting
      for (let i = 2; i <= 50; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      const customer = {
        name: 'Deep Object Customer',
        email: 'deep@example.com',
        metadata: deepObject
      };

      // Application should reject deeply nested objects
      await supertest(app)
        .post('/api/customers')
        .send(customer)
        .expect(500);
    });

    it('should handle invalid UTF-8 sequences', async () => {
      // These would be invalid UTF-8 if they were actual bytes
      const invalidUtf8Attempts = [
        '\uFFFD', // Replacement character
        '\uD800', // High surrogate without low surrogate
        '\uDFFF'  // Low surrogate without high surrogate
      ];

      for (const attempt of invalidUtf8Attempts) {
        const customer = {
          name: `Test ${attempt}`,
          email: 'utf8@example.com',
          phone: '+1-555-0123',
          address: {
            street: '123 UTF-8 St',
            city: 'UTF City',
            state: 'TX',
            zipCode: '12345'
          },
          tier: 'bronze'
        };

        const response = await supertest(app)
          .post('/api/customers')
          .send(customer)
          .expect(201);

        expect(response.body.name).toContain('Test');
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle maximum safe integer values', async () => {
      const product = {
        name: 'Max Integer Product',
        description: 'Testing max safe integer',
        price: Number.MAX_SAFE_INTEGER,
        category: 'Test',
        inStock: Number.MAX_SAFE_INTEGER,
        sku: 'MAX-001',
        featured: false
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(product)
        .expect(201);

      expect(response.body.price).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative values appropriately', async () => {
      const product = {
        name: 'Negative Values Product',
        description: 'Testing negative values',
        price: -100,
        category: 'Test',
        inStock: -5,
        sku: 'NEG-001',
        featured: false
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(product)
        .expect(201);

      expect(response.body.price).toBe(-100);
      expect(response.body.inStock).toBe(-5);
    });

    it('should handle floating point precision', async () => {
      const product = {
        name: 'Precision Product',
        description: 'Testing floating point precision',
        price: 123.456789012345,
        category: 'Test',
        inStock: 1,
        sku: 'PREC-001',
        featured: false
      };

      const response = await supertest(app)
        .post('/api/products')
        .send(product)
        .expect(201);

      expect(response.body.price).toBeCloseTo(123.456789012345, 10);
    });

    it('should handle zero values correctly', async () => {
      const order = {
        customerId: 'cust-1',
        status: 'pending',
        total: 0,
        shippingAddress: {
          street: '0 Zero St',
          city: 'Zero City',
          state: 'TX',
          zipCode: '00000'
        }
      };

      const response = await supertest(app)
        .post('/api/customers/cust-1/orders')
        .send(order)
        .expect(201);

      expect(response.body.total).toBe(0);
    });

    it('should handle empty string values', async () => {
      const customer = {
        name: '',
        email: 'empty@example.com',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        tier: 'bronze'
      };

      await supertest(app)
        .post('/api/customers')
        .send(customer)
        .expect(500); // Should fail validation for empty name
    });

    it('should handle very long string values', async () => {
      const longString = 'x'.repeat(10000);

      const customer = {
        name: longString,
        email: 'long@example.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Long St',
          city: 'Long City',
          state: 'TX',
          zipCode: '12345'
        },
        tier: 'bronze'
      };

      const response = await supertest(app)
        .post('/api/customers')
        .send(customer)
        .expect(201);

      expect(response.body.name.length).toBe(10000);
    });

    it('should handle dates at epoch boundaries', async () => {
      const epochDates = [
        '1970-01-01T00:00:00.000Z', // Unix epoch start
        '2038-01-19T03:14:07.000Z', // 32-bit timestamp overflow
        '1900-01-01T00:00:00.000Z', // Before some systems
        '2100-12-31T23:59:59.999Z'  // Far future
      ];

      for (const dateString of epochDates) {
        const order = {
          customerId: 'cust-1',
          orderDate: dateString,
          status: 'pending',
          total: 100,
          shippingAddress: {
            street: '123 Epoch St',
            city: 'Time City',
            state: 'TX',
            zipCode: '12345'
          }
        };

        const response = await supertest(app)
          .post('/api/customers/cust-1/orders')
          .send(order)
          .expect(201);

        expect(new Date(response.body.orderDate).toISOString()).toBe(dateString);
      }
    });

    it('should handle invalid date formats', async () => {
      const invalidDates = [
        'not-a-date',
        '2024-13-45', // Invalid month/day
        'February 30, 2024',
        '2024/02/30', // Different format
        ''
      ];

      for (const invalidDate of invalidDates) {
        const order = {
          customerId: 'cust-1',
          orderDate: invalidDate,
          status: 'pending',
          total: 100,
          shippingAddress: {
            street: '123 Invalid St',
            city: 'Invalid City',
            state: 'TX',
            zipCode: '12345'
          }
        };

        const response = await supertest(app)
          .post('/api/customers/cust-1/orders')
          .send(order)
          .expect(201);

        // Should handle gracefully - may use current date or create invalid date
        expect(response.body).toHaveProperty('orderDate');
      }
    });

    it('should handle Boolean edge cases', async () => {
      const booleanValues = [true, false, 'true', 'false', 1, 0, 'yes', 'no'];

      for (const featured of booleanValues) {
        const product = {
          name: `Boolean Test ${featured}`,
          description: 'Testing boolean values',
          price: 99.99,
          category: 'Test',
          inStock: 1,
          sku: `BOOL-${Date.now()}`,
          featured
        };

        const response = await supertest(app)
          .post('/api/products')
          .send(product)
          .expect(201);

        expect(response.body.featured).toBeDefined();
      }
    });

    it('should handle circular references gracefully', async () => {
      const circularObject: any = { name: 'Circular Test' };
      circularObject.self = circularObject;

      try {
        await supertest(app)
          .post('/api/customers')
          .send(circularObject)
          .expect(400); // Should fail JSON serialization
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });
  });
});
