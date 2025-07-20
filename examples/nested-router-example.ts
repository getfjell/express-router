/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Nested Router Example
 *
 * This example demonstrates the usage of fjell-express-router for hierarchical data structures
 * using CItemRouter (Contained Item Router) alongside PItemRouter (Primary Item Router).
 * It shows how to create nested routes that handle parent-child relationships in data models.
 *
 * Perfect for understanding how to handle complex data hierarchies with fjell-express-router.
 *
 * Run this example with: npx tsx examples/nested-router-example.ts
 */

import express, { Application } from 'express';
import { ComKey, Item, PriKey, UUID } from '@fjell/core';
import { CItemRouter, createRegistry, PItemRouter } from '../src';

// Define our hierarchical data models
interface Organization extends Item<'organization'> {
  id: string;
  name: string;
  type: 'startup' | 'enterprise' | 'nonprofit';
  founded: Date;
  industry: string;
}

interface Department extends Item<'department', 'organization'> {
  id: string;
  name: string;
  budget: number;
  headCount: number;
  organizationId: string;
}

interface Employee extends Item<'employee', 'organization', 'department'> {
  id: string;
  name: string;
  email: string;
  position: string;
  salary: number;
  hireDate: Date;
  organizationId: string;
  departmentId: string;
}

// Mock storage
const mockOrgStorage = new Map<string, Organization>();
const mockDeptStorage = new Map<string, Department>();
const mockEmpStorage = new Map<string, Employee>();

// Initialize sample data
const initializeSampleData = () => {
  // Organizations
  const orgs: Organization[] = [
    {
      key: { kt: 'organization', pk: 'org-1' as UUID },
      id: 'org-1',
      name: 'TechCorp Solutions',
      type: 'enterprise',
      founded: new Date('2010-03-15'),
      industry: 'Technology',
      events: {
        created: { at: new Date('2010-03-15') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    },
    {
      key: { kt: 'organization', pk: 'org-2' as UUID },
      id: 'org-2',
      name: 'Green Future Initiative',
      type: 'nonprofit',
      founded: new Date('2018-07-22'),
      industry: 'Environmental',
      events: {
        created: { at: new Date('2018-07-22') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  // Departments
  const depts: Department[] = [
    {
      key: {
        kt: 'department',
        pk: 'dept-1' as UUID,
        loc: [{ kt: 'organization', lk: 'org-1' }]
      },
      id: 'dept-1',
      name: 'Engineering',
      budget: 2000000,
      headCount: 25,
      organizationId: 'org-1',
      events: {
        created: { at: new Date('2010-04-01') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    },
    {
      key: {
        kt: 'department',
        pk: 'dept-2' as UUID,
        loc: [{ kt: 'organization', lk: 'org-1' }]
      },
      id: 'dept-2',
      name: 'Marketing',
      budget: 800000,
      headCount: 12,
      organizationId: 'org-1',
      events: {
        created: { at: new Date('2010-05-15') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    },
    {
      key: {
        kt: 'department',
        pk: 'dept-3' as UUID,
        loc: [{ kt: 'organization', lk: 'org-2' }]
      },
      id: 'dept-3',
      name: 'Research',
      budget: 500000,
      headCount: 8,
      organizationId: 'org-2',
      events: {
        created: { at: new Date('2018-08-01') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  // Employees
  const employees: Employee[] = [
    {
      key: {
        kt: 'employee',
        pk: 'emp-1' as UUID,
        loc: [
          { kt: 'organization', lk: 'org-1' },
          { kt: 'department', lk: 'dept-1' }
        ]
      },
      id: 'emp-1',
      name: 'Alice Johnson',
      email: 'alice.johnson@techcorp.com',
      position: 'Senior Software Engineer',
      salary: 120000,
      hireDate: new Date('2015-09-01'),
      organizationId: 'org-1',
      departmentId: 'dept-1',
      events: {
        created: { at: new Date('2015-09-01') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    },
    {
      key: {
        kt: 'employee',
        pk: 'emp-2' as UUID,
        loc: [
          { kt: 'organization', lk: 'org-1' },
          { kt: 'department', lk: 'dept-2' }
        ]
      },
      id: 'emp-2',
      name: 'Bob Smith',
      email: 'bob.smith@techcorp.com',
      position: 'Marketing Manager',
      salary: 85000,
      hireDate: new Date('2017-03-15'),
      organizationId: 'org-1',
      departmentId: 'dept-2',
      events: {
        created: { at: new Date('2017-03-15') },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    }
  ];

  orgs.forEach(org => mockOrgStorage.set(org.id, org));
  depts.forEach(dept => mockDeptStorage.set(dept.id, dept));
  employees.forEach(emp => mockEmpStorage.set(emp.id, emp));

  console.log('📦 Initialized hierarchical sample data:');
  console.log(`   Organizations: ${orgs.length} records`);
  console.log(`   Departments: ${depts.length} records`);
  console.log(`   Employees: ${employees.length} records`);
};

// Create mock operations
const createOrgOperations = () => ({
  async all() {
    return Array.from(mockOrgStorage.values());
  },
  async get(key: PriKey<'organization'>) {
    const org = mockOrgStorage.get(String(key.pk));
    if (!org) throw new Error(`Organization not found: ${key.pk}`);
    return org;
  },
  async create(item: Organization) {
    const id = `org-${Date.now()}`;
    const newOrg: Organization = {
      ...item,
      id,
      key: { kt: 'organization', pk: id as UUID },
      events: {
        created: { at: new Date() },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    };
    mockOrgStorage.set(id, newOrg);
    return newOrg;
  },
  async update(key: PriKey<'organization'>, updates: Partial<Organization>) {
    const existing = mockOrgStorage.get(String(key.pk));
    if (!existing) throw new Error(`Organization not found: ${key.pk}`);
    const updated = { ...existing, ...updates };
    mockOrgStorage.set(String(key.pk), updated);
    return updated;
  },
  async remove(key: PriKey<'organization'>) {
    return mockOrgStorage.delete(String(key.pk));
  },
  async find(finder: string, params: any) {
    const orgs = Array.from(mockOrgStorage.values());
    switch (finder) {
      case 'byType':
        return orgs.filter(org => org.type === params.type);
      case 'byIndustry':
        return orgs.filter(org => org.industry === params.industry);
      default:
        return orgs;
    }
  }
});

const createDeptOperations = () => ({
  async all() {
    return Array.from(mockDeptStorage.values());
  },
  async get(key: ComKey<'department', 'organization'>) {
    const dept = mockDeptStorage.get(String(key.pk));
    if (!dept) throw new Error(`Department not found: ${key.pk}`);
    return dept;
  },
  async create(item: Department) {
    const id = `dept-${Date.now()}`;
    const newDept: Department = {
      ...item,
      id,
      key: {
        kt: 'department',
        pk: id as UUID,
        loc: (item.key as any)?.loc || []
      },
      events: {
        created: { at: new Date() },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    };
    mockDeptStorage.set(id, newDept);
    return newDept;
  },
  async update(key: ComKey<'department', 'organization'>, updates: Partial<Department>) {
    const existing = mockDeptStorage.get(String(key.pk));
    if (!existing) throw new Error(`Department not found: ${key.pk}`);
    const updated = { ...existing, ...updates };
    mockDeptStorage.set(String(key.pk), updated);
    return updated;
  },
  async remove(key: ComKey<'department', 'organization'>) {
    return mockDeptStorage.delete(String(key.pk));
  },
  async find(finder: string, params: any) {
    const depts = Array.from(mockDeptStorage.values());
    switch (finder) {
      case 'byOrganization':
        return depts.filter(dept => dept.organizationId === params.organizationId);
      case 'byBudgetRange':
        return depts.filter(dept => dept.budget >= params.min && dept.budget <= params.max);
      default:
        return depts;
    }
  }
});

const createEmpOperations = () => ({
  async all() {
    return Array.from(mockEmpStorage.values());
  },
  async get(key: ComKey<'employee', 'organization', 'department'>) {
    const emp = mockEmpStorage.get(String(key.pk));
    if (!emp) throw new Error(`Employee not found: ${key.pk}`);
    return emp;
  },
  async create(item: Employee) {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...item,
      id,
      key: {
        kt: 'employee',
        pk: id as UUID,
        loc: (item.key as any)?.loc || []
      },
      events: {
        created: { at: new Date() },
        updated: { at: new Date() },
        deleted: { at: null }
      }
    };
    mockEmpStorage.set(id, newEmp);
    return newEmp;
  },
  async update(key: ComKey<'employee', 'organization', 'department'>, updates: Partial<Employee>) {
    const existing = mockEmpStorage.get(String(key.pk));
    if (!existing) throw new Error(`Employee not found: ${key.pk}`);
    const updated = { ...existing, ...updates };
    mockEmpStorage.set(String(key.pk), updated);
    return updated;
  },
  async remove(key: ComKey<'employee', 'organization', 'department'>) {
    return mockEmpStorage.delete(String(key.pk));
  },
  async find(finder: string, params: any) {
    const employees = Array.from(mockEmpStorage.values());
    switch (finder) {
      case 'byDepartment':
        return employees.filter(emp => emp.departmentId === params.departmentId);
      case 'byPosition':
        return employees.filter(emp => emp.position.includes(params.position));
      default:
        return employees;
    }
  }
});

/**
 * Main function demonstrating nested fjell-express-router usage
 */
export const runNestedRouterExample = async (): Promise<{ app: Application }> => {
  console.log('🚀 Starting Nested Express Router Example...\n');

  initializeSampleData();

  const registry = createRegistry();

  // Create mock instances
  const mockOrgInstance = {
    operations: createOrgOperations(),
    options: {}
  } as any;

  const mockDeptInstance = {
    operations: createDeptOperations(),
    options: {}
  } as any;

  const mockEmpInstance = {
    operations: createEmpOperations(),
    options: {}
  } as any;

  const app: Application = express();
  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`, req.query);
    next();
  });

  // Create routers
  console.log('🛤️ Creating nested Express routers...');
  const orgRouter = new PItemRouter(mockOrgInstance, 'organization');
  const deptRouter = new CItemRouter(mockDeptInstance, 'department', orgRouter);
  const empRouter = new CItemRouter(mockEmpInstance, 'employee', deptRouter);

  // Mount the routers to create nested endpoints:
  // Primary routes for organizations:
  // GET    /api/organizations                    - Get all organizations
  // GET    /api/organizations/:orgPk            - Get specific organization
  // POST   /api/organizations                   - Create new organization
  // PUT    /api/organizations/:orgPk            - Update organization
  // DELETE /api/organizations/:orgPk            - Delete organization
  app.use('/api/organizations', orgRouter.getRouter());

  // Nested routes for departments within organizations:
  // GET    /api/organizations/:orgPk/departments           - Get all departments for organization
  // GET    /api/organizations/:orgPk/departments/:deptPk   - Get specific department
  // POST   /api/organizations/:orgPk/departments           - Create new department in organization
  // PUT    /api/organizations/:orgPk/departments/:deptPk   - Update department
  // DELETE /api/organizations/:orgPk/departments/:deptPk   - Delete department
  app.use('/api/organizations/:organizationPk/departments', deptRouter.getRouter());

  // Deeply nested routes for employees within departments within organizations:
  // GET    /api/organizations/:orgPk/departments/:deptPk/employees           - Get all employees for department
  // GET    /api/organizations/:orgPk/departments/:deptPk/employees/:empPk    - Get specific employee
  // POST   /api/organizations/:orgPk/departments/:deptPk/employees           - Create new employee in department
  // PUT    /api/organizations/:orgPk/departments/:deptPk/employees/:empPk    - Update employee
  // DELETE /api/organizations/:orgPk/departments/:deptPk/employees/:empPk    - Delete employee
  app.use('/api/organizations/:organizationPk/departments/:departmentPk/employees', empRouter.getRouter());

  // Additional hierarchy summary routes
  app.get('/api/hierarchy', async (req, res) => {
    try {
      const orgs = await mockOrgInstance.operations.all();
      const depts = await mockDeptInstance.operations.all();
      const employees = await mockEmpInstance.operations.all();

      const hierarchy = orgs.map((org: Organization) => {
        const orgDepts = depts.filter((dept: Department) => dept.organizationId === org.id);
        return {
          organization: org,
          departments: orgDepts.map((dept: Department) => {
            const deptEmployees = employees.filter((emp: Employee) => emp.departmentId === dept.id);
            return {
              department: dept,
              employees: deptEmployees
            };
          })
        };
      });

      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load hierarchy' });
    }
  });

  app.get('/api/stats', async (req, res) => {
    try {
      const orgs = await mockOrgInstance.operations.all();
      const depts = await mockDeptInstance.operations.all();
      const employees = await mockEmpInstance.operations.all();

      const stats = {
        totals: {
          organizations: orgs.length,
          departments: depts.length,
          employees: employees.length
        },
        organizationTypes: orgs.reduce((acc: any, org: Organization) => {
          acc[org.type] = (acc[org.type] || 0) + 1;
          return acc;
        }, {}),
        averageDepartmentBudget: depts.reduce((sum: number, dept: Department) => sum + dept.budget, 0) / depts.length,
        totalPayroll: employees.reduce((sum: number, emp: Employee) => sum + emp.salary, 0)
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate stats' });
    }
  });

  console.log('\n✅ Nested Express Router Example setup complete!');
  console.log('\n📚 Available nested endpoints:');
  console.log('   📊 GET /api/hierarchy                                                   - Full organizational hierarchy');
  console.log('   📈 GET /api/stats                                                       - Statistics summary');
  console.log('   🏢 Organizations (Primary):');
  console.log('      GET    /api/organizations                                            - List all organizations');
  console.log('      GET    /api/organizations/:orgPk                                     - Get specific organization');
  console.log('      POST   /api/organizations                                            - Create new organization');
  console.log('   🏬 Departments (Contained in Organizations):');
  console.log('      GET    /api/organizations/:orgPk/departments                         - List departments for organization');
  console.log('      GET    /api/organizations/:orgPk/departments/:deptPk                 - Get specific department');
  console.log('      POST   /api/organizations/:orgPk/departments                         - Create department in organization');
  console.log('   👥 Employees (Contained in Departments):');
  console.log('      GET    /api/organizations/:orgPk/departments/:deptPk/employees       - List employees for department');
  console.log('      GET    /api/organizations/:orgPk/departments/:deptPk/employees/:empPk - Get specific employee');
  console.log('      POST   /api/organizations/:orgPk/departments/:deptPk/employees       - Create employee in department');

  return { app };
};

// If this file is run directly, start the server
if (require.main === module) {
  runNestedRouterExample().then(({ app }) => {
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
      console.log(`\n🌟 Server running on http://localhost:${PORT}`);
      console.log('\n💡 Try these example requests:');
      console.log(`   curl http://localhost:${PORT}/api/hierarchy`);
      console.log(`   curl http://localhost:${PORT}/api/stats`);
      console.log(`   curl http://localhost:${PORT}/api/organizations`);
      console.log(`   curl http://localhost:${PORT}/api/organizations/org-1/departments`);
      console.log(`   curl http://localhost:${PORT}/api/organizations/org-1/departments/dept-1/employees`);
    });
  }).catch(console.error);
}
