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
import { NotFoundError } from '@fjell/lib';

// Define our hierarchical data models
export interface Organization extends Item<'organization'> {
  id: string;
  name: string;
  type: 'startup' | 'enterprise' | 'nonprofit';
  founded: Date;
  industry: string;
}

export interface Department extends Item<'department', 'organization'> {
  id: string;
  name: string;
  budget: number;
  headCount: number;
  organizationId: string;
}

export interface Employee extends Item<'employee', 'organization', 'department'> {
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
    if (!org) throw new NotFoundError('get', { kta: ['organization', '', '', '', '', ''], scopes: [] }, key);
    return org;
  },
  async create(item: Organization) {
    // Validate required fields
    if (!item.name || !item.type || !item.founded || !item.industry) {
      throw new Error('Missing required fields: name, type, founded, and industry are required');
    }

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
    if (!existing) throw new NotFoundError('update', { kta: ['organization', '', '', '', '', ''], scopes: [] }, key);
    const updated = {
      ...existing,
      ...updates,
      events: {
        ...existing.events,
        updated: { at: new Date() }
      }
    };
    mockOrgStorage.set(String(key.pk), updated);
    return updated;
  },
  async remove(key: PriKey<'organization'>) {
    const existing = mockOrgStorage.get(String(key.pk));
    if (!existing) throw new NotFoundError('remove', { kta: ['organization', '', '', '', '', ''], scopes: [] }, key);
    mockOrgStorage.delete(String(key.pk));
    return existing;
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
  async all(query?: any, locations?: any) {
    const departments = Array.from(mockDeptStorage.values());
    if (locations && locations.length >= 1) {
      const orgId = String(locations[0]?.lk || '');
      // Check if the parent organization exists
      const org = mockOrgStorage.get(orgId);
      if (!org) {
        throw new NotFoundError('get', { kta: ['organization', '', '', '', '', ''], scopes: [] }, { kt: 'organization', pk: orgId as UUID });
      }
      return departments.filter(dept => dept.organizationId === orgId);
    }
    return departments;
  },
  async get(key: ComKey<'department', 'organization'>) {
    const dept = mockDeptStorage.get(String(key.pk));
    if (!dept) throw new NotFoundError('get', { kta: ['department', '', '', '', '', ''], scopes: [] }, key);
    return dept;
  },
  async create(item: Department, context?: any) {
    const id = `dept-${Date.now()}`;
    const orgId = context?.locations?.[0]?.lk || item.organizationId || String((item.key as any)?.loc?.[0]?.lk || '');
    const newDept: Department = {
      ...item,
      id,
      organizationId: orgId,
      key: {
        kt: 'department',
        pk: id as UUID,
        loc: context?.locations || (item.key as any)?.loc || []
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
    if (!existing) throw new NotFoundError('update', { kta: ['department', '', '', '', '', ''], scopes: [] }, key);
    const updated = {
      ...existing,
      ...updates,
      events: {
        ...existing.events,
        updated: { at: new Date() }
      }
    };
    mockDeptStorage.set(String(key.pk), updated);
    return updated;
  },
  async remove(key: ComKey<'department', 'organization'>) {
    const existing = mockDeptStorage.get(String(key.pk));
    if (!existing) throw new NotFoundError('remove', { kta: ['department', '', '', '', '', ''], scopes: [] }, key);
    mockDeptStorage.delete(String(key.pk));
    return existing;
  },
  async find(finder: string, params: any, locations?: any) {
    const departments = Array.from(mockDeptStorage.values());
    let filtered = departments;

    if (locations && locations.length >= 1) {
      const orgId = String(locations[0]?.lk || '');
      filtered = filtered.filter(dept => dept.organizationId === orgId);
    }

    switch (finder) {
      case 'byBudget':
        return filtered.filter(dept => dept.budget >= params.minBudget);
      case 'byHeadCount':
        return filtered.filter(dept => dept.headCount >= params.minHeadCount);
      default:
        return filtered;
    }
  }
});

const createEmpOperations = () => ({
  async all(query?: any, locations?: any) {
    const employees = Array.from(mockEmpStorage.values());
    if (locations && locations.length >= 2) {
      // The locations array is: [{kt: 'department', lk: 'dept-1'}, {kt: 'organization', lk: 'org-1'}]
      const deptId = String(locations[0]?.lk || '');
      const orgId = String(locations[1]?.lk || '');

      // Check if the parent organization exists
      const org = mockOrgStorage.get(orgId);
      if (!org) {
        throw new NotFoundError('get', { kta: ['organization', '', '', '', '', ''], scopes: [] }, { kt: 'organization', pk: orgId as UUID });
      }

      // Check if the parent department exists
      const dept = mockDeptStorage.get(deptId);
      if (!dept) {
        throw new NotFoundError('get', { kta: ['department', '', '', '', '', ''], scopes: [] }, { kt: 'department', pk: deptId as UUID });
      }

      return employees.filter(emp => emp.organizationId === orgId && emp.departmentId === deptId);
    }
    return employees;
  },
  async get(key: ComKey<'employee', 'organization', 'department'>) {
    const emp = mockEmpStorage.get(String(key.pk));
    if (!emp) throw new NotFoundError('get', { kta: ['employee', '', '', '', '', ''], scopes: [] }, key);
    return emp;
  },
  async create(item: Employee, context?: any) {
    const id = `emp-${Date.now()}`;

    // Extract organization and department IDs from the locations context
    // The locations array is: [{kt: 'department', lk: 'dept-1'}, {kt: 'organization', lk: 'org-1'}]
    const deptId = context?.locations?.[0]?.lk || item.departmentId || String((item.key as any)?.loc?.[0]?.lk || '');
    const orgId = context?.locations?.[1]?.lk || item.organizationId || String((item.key as any)?.loc?.[1]?.lk || '');

    const newEmp: Employee = {
      ...item,
      id,
      organizationId: orgId,
      departmentId: deptId,
      key: {
        kt: 'employee',
        pk: id as UUID,
        loc: context?.locations || (item.key as any)?.loc || []
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
    if (!existing) throw new NotFoundError('update', { kta: ['employee', '', '', '', '', ''], scopes: [] }, key);
    const updated = {
      ...existing,
      ...updates,
      events: {
        ...existing.events,
        updated: { at: new Date() }
      }
    };
    mockEmpStorage.set(String(key.pk), updated);
    return updated;
  },
  async remove(key: ComKey<'employee', 'organization', 'department'>) {
    const existing = mockEmpStorage.get(String(key.pk));
    if (!existing) throw new NotFoundError('remove', { kta: ['employee', '', '', '', '', ''], scopes: [] }, key);
    mockEmpStorage.delete(String(key.pk));
    return existing;
  },
  async find(finder: string, params: any, locations?: any) {
    const employees = Array.from(mockEmpStorage.values());
    let filtered = employees;

    if (locations && locations.length >= 2) {
      const deptId = String(locations[0]?.lk || '');
      const orgId = String(locations[1]?.lk || '');
      filtered = filtered.filter(emp => emp.organizationId === orgId && emp.departmentId === deptId);
    }

    switch (finder) {
      case 'byDepartment':
        return filtered.filter(emp => emp.departmentId === params.departmentId);
      case 'byPosition':
        return filtered.filter(emp => emp.position.includes(params.position));
      default:
        return filtered;
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
  // GET    /api/organizations/:organizationPk    - Get specific organization
  // POST   /api/organizations                   - Create new organization
  // PUT    /api/organizations/:organizationPk    - Update organization
  // DELETE /api/organizations/:organizationPk    - Delete organization
  app.use('/api/organizations', orgRouter.getRouter());

  // Nested routes for departments within organizations:
  // GET    /api/organizations/:organizationPk/departments           - Get all departments for organization
  // GET    /api/organizations/:organizationPk/departments/:departmentPk   - Get specific department
  // POST   /api/organizations/:organizationPk/departments           - Create new department in organization
  // PUT    /api/organizations/:organizationPk/departments/:departmentPk   - Update department
  // DELETE /api/organizations/:organizationPk/departments/:departmentPk   - Delete department
  app.use('/api/organizations/:organizationPk/departments', deptRouter.getRouter());

  // Deeply nested routes for employees within departments within organizations:
  // GET    /api/organizations/:organizationPk/departments/:departmentPk/employees           - Get all employees for department
  // GET    /api/organizations/:organizationPk/departments/:departmentPk/employees/:employeePk    - Get specific employee
  // POST   /api/organizations/:organizationPk/departments/:departmentPk/employees           - Create new employee in department
  // PUT    /api/organizations/:organizationPk/departments/:departmentPk/employees/:employeePk    - Update employee
  // DELETE /api/organizations/:organizationPk/departments/:departmentPk/employees/:employeePk    - Delete employee
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
  console.log('      GET    /api/organizations/:organizationPk                            - Get specific organization');
  console.log('      POST   /api/organizations                                            - Create new organization');
  console.log('   🏬 Departments (Contained in Organizations):');
  console.log('      GET    /api/organizations/:organizationPk/departments                - List departments for organization');
  console.log('      GET    /api/organizations/:organizationPk/departments/:departmentPk  - Get specific department');
  console.log('      POST   /api/organizations/:organizationPk/departments                - Create department in organization');
  console.log('   👥 Employees (Contained in Departments):');
  console.log('      GET    /api/organizations/:organizationPk/departments/:departmentPk/employees       - List employees for department');
  console.log('      GET    /api/organizations/:organizationPk/departments/:departmentPk/employees/:employeePk - Get specific employee');
  console.log('      POST   /api/organizations/:organizationPk/departments/:departmentPk/employees       - Create employee in department');

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err.message);
    if (err instanceof NotFoundError || err.message.includes('not found') || err.message.includes('NotFoundError')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  });

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
