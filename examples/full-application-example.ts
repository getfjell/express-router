/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Full Application Example
 *
 * This example demonstrates a complete Express.js application built with fjell-express-router,
 * showcasing a realistic e-commerce-like system with multiple interconnected entities,
 * business logic, middleware, error handling, and advanced routing patterns.
 *
 * Perfect for understanding how to build production-ready applications with fjell-express-router.
 *
 * Run this example with: npx tsx examples/full-application-example.ts
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import { ComKey, Item, PriKey, UUID } from '@fjell/core';
import { CItemRouter, createRegistry, PItemRouter } from '../src';

// ===== Data Models =====

interface Customer extends Item<'customer'> {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  registrationDate: Date;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface Product extends Item<'product'> {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: number;
  sku: string;
  featured: boolean;
}

interface Order extends Item<'order', 'customer'> {
  id: string;
  customerId: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface OrderItem extends Item<'orderItem', 'customer', 'order'> {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Review extends Item<'review', 'customer', 'product'> {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  title: string;
  content: string;
  reviewDate: Date;
  verified: boolean;
}

// ===== Mock Storage =====
const mockCustomerStorage = new Map<string, Customer>();
const mockProductStorage = new Map<string, Product>();
const mockOrderStorage = new Map<string, Order>();
const mockOrderItemStorage = new Map<string, OrderItem>();
const mockReviewStorage = new Map<string, Review>();

// ===== Sample Data Initialization =====
const initializeSampleData = () => {
  // Sample customers
  const customers: Customer[] = [
    {
      key: { kt: 'customer', pk: 'cust-1' as UUID },
      id: 'cust-1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      },
      registrationDate: new Date('2023-01-15'),
      tier: 'gold',
      events: {
        created: { at: new Date('2023-01-15') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    },
    {
      key: { kt: 'customer', pk: 'cust-2' as UUID },
      id: 'cust-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0456',
      address: {
        street: '456 Oak Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      registrationDate: new Date('2023-03-22'),
      tier: 'silver',
      events: {
        created: { at: new Date('2023-03-22') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  // Sample products
  const products: Product[] = [
    {
      key: { kt: 'product', pk: 'prod-1' as UUID },
      id: 'prod-1',
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
      price: 299.99,
      category: 'Electronics',
      inStock: 45,
      sku: 'WH-XM4-001',
      featured: true,
      events: {
        created: { at: new Date('2023-01-01') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    },
    {
      key: { kt: 'product', pk: 'prod-2' as UUID },
      id: 'prod-2',
      name: 'Ergonomic Office Chair',
      description: 'Comfortable ergonomic office chair with lumbar support and adjustable height',
      price: 459.99,
      category: 'Furniture',
      inStock: 23,
      sku: 'CHR-ERG-002',
      featured: false,
      events: {
        created: { at: new Date('2023-01-10') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  // Sample orders and order items
  const orders: Order[] = [
    {
      key: {
        kt: 'order',
        pk: 'order-1' as UUID,
        loc: [{ kt: 'customer', lk: 'cust-1' }]
      },
      id: 'order-1',
      customerId: 'cust-1',
      orderDate: new Date('2024-01-15'),
      status: 'delivered',
      total: 299.99,
      shippingAddress: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      },
      events: {
        created: { at: new Date('2024-01-15') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  const orderItems: OrderItem[] = [
    {
      key: {
        kt: 'orderItem',
        pk: 'oi-1' as UUID,
        loc: [
          { kt: 'customer', lk: 'cust-1' },
          { kt: 'order', lk: 'order-1' }
        ]
      },
      id: 'oi-1',
      orderId: 'order-1',
      productId: 'prod-1',
      quantity: 1,
      unitPrice: 299.99,
      totalPrice: 299.99,
      events: {
        created: { at: new Date('2024-01-15') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  const reviews: Review[] = [
    {
      key: {
        kt: 'review',
        pk: 'rev-1' as UUID,
        loc: [
          { kt: 'customer', lk: 'cust-1' },
          { kt: 'product', lk: 'prod-1' }
        ]
      },
      id: 'rev-1',
      customerId: 'cust-1',
      productId: 'prod-1',
      rating: 5,
      title: 'Excellent sound quality!',
      content: 'These headphones have amazing sound quality and the noise cancellation is perfect for my daily commute.',
      reviewDate: new Date('2024-01-20'),
      verified: true,
      events: {
        created: { at: new Date('2024-01-20') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  // Store in maps
  customers.forEach(c => mockCustomerStorage.set(c.id, c));
  products.forEach(p => mockProductStorage.set(p.id, p));
  orders.forEach(o => mockOrderStorage.set(o.id, o));
  orderItems.forEach(oi => mockOrderItemStorage.set(oi.id, oi));
  reviews.forEach(r => mockReviewStorage.set(r.id, r));

  console.log('📦 Initialized full application sample data:');
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Order Items: ${orderItems.length}`);
  console.log(`   Reviews: ${reviews.length}`);
};

// ===== Mock Operations =====
const createCustomerOperations = () => ({
  async all() { return Array.from(mockCustomerStorage.values()); },
  async get(key: PriKey<'customer'>) {
    const customer = mockCustomerStorage.get(key.pk);
    if (!customer) throw new Error(`Customer not found: ${key.pk}`);
    return customer;
  },
  async create(item: Customer) {
    const id = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...item,
      id,
      key: { kt: 'customer', pk: id as UUID },
      events: { created: { at: new Date() }, updated: { at: new Date() }, deleted: { at: null } }
    };
    mockCustomerStorage.set(id, newCustomer);
    return newCustomer;
  },
  async update(key: PriKey<'customer'>, updates: Partial<Customer>) {
    const existing = mockCustomerStorage.get(key.pk);
    if (!existing) throw new Error(`Customer not found: ${key.pk}`);
    const updated = { ...existing, ...updates };
    mockCustomerStorage.set(key.pk, updated);
    return updated;
  },
  async remove(key: PriKey<'customer'>) {
    return mockCustomerStorage.delete(key.pk);
  },
  async find(finder: string, params: any) {
    const customers = Array.from(mockCustomerStorage.values());
    switch (finder) {
      case 'byTier': return customers.filter(c => c.tier === params.tier);
      case 'byState': return customers.filter(c => c.address.state === params.state);
      default: return customers;
    }
  }
});

const createProductOperations = () => ({
  async all() { return Array.from(mockProductStorage.values()); },
  async get(key: PriKey<'product'>) {
    const product = mockProductStorage.get(key.pk);
    if (!product) throw new Error(`Product not found: ${key.pk}`);
    return product;
  },
  async create(item: Product) {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...item,
      id,
      key: { kt: 'product', pk: id as UUID },
      events: { created: { at: new Date() }, updated: { at: new Date() }, deleted: { at: null } }
    };
    mockProductStorage.set(id, newProduct);
    return newProduct;
  },
  async update(key: PriKey<'product'>, updates: Partial<Product>) {
    const existing = mockProductStorage.get(key.pk);
    if (!existing) throw new Error(`Product not found: ${key.pk}`);
    const updated = { ...existing, ...updates };
    mockProductStorage.set(key.pk, updated);
    return updated;
  },
  async remove(key: PriKey<'product'>) {
    return mockProductStorage.delete(key.pk);
  },
  async find(finder: string, params: any) {
    const products = Array.from(mockProductStorage.values());
    switch (finder) {
      case 'byCategory': return products.filter(p => p.category === params.category);
      case 'featured': return products.filter(p => p.featured);
      case 'inStock': return products.filter(p => p.inStock > 0);
      default: return products;
    }
  }
});

// Additional operations for contained items (simplified for brevity)
const createOrderOperations = () => ({
  async all() { return Array.from(mockOrderStorage.values()); },
  async get(key: ComKey<'order', 'customer'>) {
    const order = mockOrderStorage.get(key.pk);
    if (!order) throw new Error(`Order not found: ${key.pk}`);
    return order;
  },
  async create(item: Order) {
    const id = `order-${Date.now()}`;
    const newOrder: Order = {
      ...item,
      id,
      key: { kt: 'order', pk: id as UUID, loc: item.key?.loc || [] },
      events: { created: { at: new Date() }, updated: { at: new Date() }, deleted: { at: null } }
    };
    mockOrderStorage.set(id, newOrder);
    return newOrder;
  },
  async update(key: ComKey<'order', 'customer'>, updates: Partial<Order>) {
    const existing = mockOrderStorage.get(key.pk);
    if (!existing) throw new Error(`Order not found: ${key.pk}`);
    const updated = { ...existing, ...updates };
    mockOrderStorage.set(key.pk, updated);
    return updated;
  },
  async remove(key: ComKey<'order', 'customer'>) { return mockOrderStorage.delete(key.pk); },
  async find(finder: string, params: any) {
    const orders = Array.from(mockOrderStorage.values());
    switch (finder) {
      case 'byStatus': return orders.filter(o => o.status === params.status);
      case 'byCustomer': return orders.filter(o => o.customerId === params.customerId);
      default: return orders;
    }
  }
});

// ===== Middleware =====
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Application Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`🌐 ${req.method} ${req.path} - Started`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

const validateCustomerTier = (req: Request, res: Response, next: NextFunction) => {
  // Example business logic middleware
  const tier = req.headers['x-customer-tier'] as string;
  if (tier && !['bronze', 'silver', 'gold', 'platinum'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid customer tier' });
  }
  next();
};

/**
 * Main function demonstrating a full fjell-express-router application
 */
export const runFullApplicationExample = async (): Promise<{ app: Application }> => {
  console.log('🚀 Starting Full Application Example...\n');

  initializeSampleData();
  const registry = createRegistry();

  // Create mock instances
  const customerInstance = { operations: createCustomerOperations(), options: {} } as any;
  const productInstance = { operations: createProductOperations(), options: {} } as any;
  const orderInstance = { operations: createOrderOperations(), options: {} } as any;

  const app: Application = express();

  // ===== Global Middleware =====
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(validateCustomerTier);

  // ===== CORS and Security Headers =====
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-customer-tier');
    res.header('X-Powered-By', 'Fjell Express Router');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ===== Create Routers =====
  console.log('🛤️ Creating application routers...');
  const customerRouter = new PItemRouter(customerInstance, 'customer');
  const productRouter = new PItemRouter(productInstance, 'product');
  const orderRouter = new CItemRouter(orderInstance, 'order', customerRouter);

  // ===== API Routes =====

  // Health and system routes
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      data: {
        customers: mockCustomerStorage.size,
        products: mockProductStorage.size,
        orders: mockOrderStorage.size
      }
    });
  });

  // Core entity routes
  app.use('/api/customers', customerRouter.getRouter());
  app.use('/api/products', productRouter.getRouter());
  app.use('/api/customers/:customerPk/orders', orderRouter.getRouter());

  // Business logic routes
  app.get('/api/dashboard', async (req, res) => {
    try {
      const customers = await customerInstance.operations.all();
      const products = await productInstance.operations.all();
      const orders = await orderInstance.operations.all();

      const dashboard = {
        summary: {
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          revenue: orders.reduce((sum: number, order: Order) => sum + order.total, 0)
        },
        customerTiers: customers.reduce((acc: any, customer: Customer) => {
          acc[customer.tier] = (acc[customer.tier] || 0) + 1;
          return acc;
        }, {}),
        orderStatuses: orders.reduce((acc: any, order: Order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {}),
        featuredProducts: products.filter((product: Product) => product.featured),
        recentOrders: orders
          .sort((a: Order, b: Order) => b.orderDate.getTime() - a.orderDate.getTime())
          .slice(0, 10)
      };

      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  });

  // Product catalog with search and filtering
  app.get('/api/catalog', async (req, res) => {
    try {
      const { category, featured, minPrice, maxPrice, search } = req.query;
      let products = await productInstance.operations.all();

      if (category) {
        products = products.filter((p: Product) => p.category === category);
      }
      if (featured === 'true') {
        products = products.filter((p: Product) => p.featured);
      }
      if (minPrice) {
        products = products.filter((p: Product) => p.price >= Number(minPrice));
      }
      if (maxPrice) {
        products = products.filter((p: Product) => p.price <= Number(maxPrice));
      }
      if (search) {
        const searchTerm = String(search).toLowerCase();
        products = products.filter((p: Product) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm)
        );
      }

      res.json({
        products,
        totalCount: products.length,
        filters: { category, featured, minPrice, maxPrice, search }
      });
    } catch (error) {
      next(error);
    }
  });

  // Customer analytics
  app.get('/api/customers/:customerPk/analytics', async (req, res) => {
    try {
      const { customerPk } = req.params;
      const customer = await customerInstance.operations.get({ kt: 'customer', pk: customerPk });
      const customerOrders = await orderInstance.operations.find('byCustomer', { customerId: customerPk });

      const analytics = {
        customer: {
          id: customer.id,
          name: customer.name,
          tier: customer.tier,
          registrationDate: customer.registrationDate
        },
        orderStats: {
          totalOrders: customerOrders.length,
          totalSpent: customerOrders.reduce((sum: number, order: Order) => sum + order.total, 0),
          averageOrderValue: customerOrders.length > 0
            ? customerOrders.reduce((sum: number, order: Order) => sum + order.total, 0) / customerOrders.length
            : 0,
          ordersByStatus: customerOrders.reduce((acc: any, order: Order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {})
        },
        recentOrders: customerOrders
          .sort((a: Order, b: Order) => b.orderDate.getTime() - a.orderDate.getTime())
          .slice(0, 5)
      };

      res.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
  });

  console.log('\n✅ Full Application Example setup complete!');
  console.log('\n📚 Available endpoints:');
  console.log('   🏥 GET  /health                                    - System health check');
  console.log('   📊 GET  /api/dashboard                             - Business dashboard');
  console.log('   🛍️  GET  /api/catalog                              - Product catalog with filtering');
  console.log('   👥 REST /api/customers                             - Customer management');
  console.log('   🛒 REST /api/customers/:customerPk/orders          - Order management');
  console.log('   📦 REST /api/products                              - Product management');
  console.log('   📈 GET  /api/customers/:customerPk/analytics       - Customer analytics');

  return { app };
};

// If this file is run directly, start the server
if (require.main === module) {
  runFullApplicationExample().then(({ app }) => {
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`\n🌟 Full Application Server running on http://localhost:${PORT}`);
      console.log('\n💡 Try these example requests:');
      console.log(`   curl http://localhost:${PORT}/health`);
      console.log(`   curl http://localhost:${PORT}/api/dashboard`);
      console.log(`   curl http://localhost:${PORT}/api/catalog`);
      console.log(`   curl http://localhost:${PORT}/api/customers`);
      console.log(`   curl http://localhost:${PORT}/api/products`);
      console.log(`   curl "http://localhost:${PORT}/api/catalog?category=Electronics&featured=true"`);
    });
  }).catch(console.error);
}
