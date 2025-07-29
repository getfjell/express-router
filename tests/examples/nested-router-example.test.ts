/**
 * Nested Router Example Tests
 *
 * Comprehensive tests to verify the nested router example functionality.
 * Tests cover hierarchical data initialization, CRUD operations for organizations,
 * departments, and employees, nested routing structure, custom endpoints, and error handling.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { runNestedRouterExample } from '../../examples/nested-router-example';
import type { Department, Employee, Organization } from '../../examples/nested-router-example';

describe('Nested Router Example', () => {
  let app: any;
  let supertest: any;

  beforeEach(async () => {
    const result = await runNestedRouterExample();
    app = result.app;
    supertest = request(app);
  });

  afterEach(() => {
    // Clean up any test data if needed
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      await expect(runNestedRouterExample()).resolves.toBeDefined();
    });

    it('should return app with proper structure', async () => {
      const result = await runNestedRouterExample();

      // Verify the example returns the expected structure
      expect(result).toHaveProperty('app');

      // Verify app is an Express application
      expect(result.app).toBeDefined();
      expect(typeof result.app.listen).toBe('function');
    });
  });

  describe('Sample Data Initialization', () => {
    it('should initialize with sample organizations', async () => {
      const response = await supertest.get('/api/organizations');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check for expected sample organizations
      const techCorp = response.body.find((org: Organization) => org.name === 'TechCorp Solutions');
      const greenFuture = response.body.find((org: Organization) => org.name === 'Green Future Initiative');

      expect(techCorp).toBeDefined();
      expect(techCorp.type).toBe('enterprise');
      expect(techCorp.industry).toBe('Technology');

      expect(greenFuture).toBeDefined();
      expect(greenFuture.type).toBe('nonprofit');
      expect(greenFuture.industry).toBe('Environmental');
    });

    it('should initialize with sample departments', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check for expected sample departments
      const engineering = response.body.find((dept: Department) => dept.name === 'Engineering');
      const marketing = response.body.find((dept: Department) => dept.name === 'Marketing');

      expect(engineering).toBeDefined();
      expect(engineering.budget).toBe(2000000);
      expect(engineering.headCount).toBe(25);

      expect(marketing).toBeDefined();
      expect(marketing.budget).toBe(800000);
      expect(marketing.headCount).toBe(12);
    });

    it('should initialize with sample employees', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/dept-1/employees');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check for expected sample employees
      const alice = response.body.find((emp: Employee) => emp.name === 'Alice Johnson');
      expect(alice).toBeDefined();
      expect(alice.position).toBe('Senior Software Engineer');
      expect(alice.salary).toBe(120000);
    });
  });

  describe('Organization Operations (Primary Router)', () => {
    it('should get all organizations', async () => {
      const response = await supertest.get('/api/organizations');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify organization structure
      const org = response.body[0];
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('type');
      expect(org).toHaveProperty('founded');
      expect(org).toHaveProperty('industry');
      expect(org).toHaveProperty('key');
      expect(org).toHaveProperty('events');
    });

    it('should get specific organization by ID', async () => {
      const response = await supertest.get('/api/organizations/org-1');
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('org-1');
      expect(response.body.name).toBe('TechCorp Solutions');
      expect(response.body.type).toBe('enterprise');
    });

    it('should return 404 for non-existent organization', async () => {
      const response = await supertest.get('/api/organizations/non-existent');
      expect(response.status).toBe(404);
    });

    it('should create new organization', async () => {
      const newOrg = {
        name: 'New Tech Startup',
        type: 'startup' as const,
        founded: new Date('2023-01-01'),
        industry: 'AI/ML'
      };

      const response = await supertest
        .post('/api/organizations')
        .send(newOrg);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newOrg.name);
      expect(response.body.type).toBe(newOrg.type);
      expect(response.body.industry).toBe(newOrg.industry);
      expect(response.body.id).toBeDefined();
      expect(response.body.key).toBeDefined();
      expect(response.body.events.created.at).toBeDefined();
    });

    it('should update existing organization', async () => {
      const updates = {
        name: 'TechCorp Solutions Updated',
        type: 'startup' as const
      };

      const response = await supertest
        .put('/api/organizations/org-1')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.type).toBe(updates.type);
      expect(response.body.industry).toBe('Technology'); // Should remain unchanged
      expect(response.body.events.updated.at).toBeDefined();
    });

    it('should return 404 when updating non-existent organization', async () => {
      const response = await supertest
        .put('/api/organizations/non-existent')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should delete organization', async () => {
      const response = await supertest.delete('/api/organizations/org-2');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'org-2');
      expect(response.body).toHaveProperty('name', 'Green Future Initiative');

      // Verify organization is deleted
      const getResponse = await supertest.get('/api/organizations/org-2');
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent organization', async () => {
      const response = await supertest.delete('/api/organizations/non-existent');
      expect(response.status).toBe(404);
    });
  });

  describe('Department Operations (Contained Router)', () => {
    it('should get all departments for an organization', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify department structure
      const dept = response.body[0];
      expect(dept).toHaveProperty('id');
      expect(dept).toHaveProperty('name');
      expect(dept).toHaveProperty('budget');
      expect(dept).toHaveProperty('headCount');
      expect(dept).toHaveProperty('organizationId');
      expect(dept).toHaveProperty('key');
      expect(dept).toHaveProperty('events');
    });

    it('should get specific department by ID', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/dept-1');
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('dept-1');
      expect(response.body.name).toBe('Engineering');
      expect(response.body.budget).toBe(2000000);
      expect(response.body.organizationId).toBe('org-1');
    });

    it('should return 404 for non-existent department', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/non-existent');
      expect(response.status).toBe(404);
    });

    it('should create new department in organization', async () => {
      const newDept = {
        name: 'Research & Development',
        budget: 1500000,
        headCount: 15
      };

      const response = await supertest
        .post('/api/organizations/org-1/departments')
        .send(newDept);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newDept.name);
      expect(response.body.budget).toBe(newDept.budget);
      expect(response.body.headCount).toBe(newDept.headCount);
      expect(response.body.organizationId).toBe('org-1');
      expect(response.body.id).toBeDefined();
      expect(response.body.key).toBeDefined();
      expect(response.body.events.created.at).toBeDefined();
    });

    it('should update existing department', async () => {
      const updates = {
        name: 'Engineering Department Updated',
        budget: 2500000
      };

      const response = await supertest
        .put('/api/organizations/org-1/departments/dept-1')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.budget).toBe(updates.budget);
      expect(response.body.headCount).toBe(25); // Should remain unchanged
      expect(response.body.events.updated.at).toBeDefined();
    });

    it('should return 404 when updating non-existent department', async () => {
      const response = await supertest
        .put('/api/organizations/org-1/departments/non-existent')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should delete department', async () => {
      const response = await supertest.delete('/api/organizations/org-1/departments/dept-2');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'dept-2');
      expect(response.body).toHaveProperty('name', 'Marketing');

      // Verify department is deleted
      const getResponse = await supertest.get('/api/organizations/org-1/departments/dept-2');
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent department', async () => {
      const response = await supertest.delete('/api/organizations/org-1/departments/non-existent');
      expect(response.status).toBe(404);
    });
  });

  describe('Employee Operations (Deeply Nested Router)', () => {
    it('should get all employees for a department', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/dept-1/employees');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify employee structure
      const emp = response.body[0];
      expect(emp).toHaveProperty('id');
      expect(emp).toHaveProperty('name');
      expect(emp).toHaveProperty('email');
      expect(emp).toHaveProperty('position');
      expect(emp).toHaveProperty('salary');
      expect(emp).toHaveProperty('hireDate');
      expect(emp).toHaveProperty('organizationId');
      expect(emp).toHaveProperty('departmentId');
      expect(emp).toHaveProperty('key');
      expect(emp).toHaveProperty('events');
    });

    it('should get specific employee by ID', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/dept-1/employees/emp-1');
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('emp-1');
      expect(response.body.name).toBe('Alice Johnson');
      expect(response.body.email).toBe('alice.johnson@techcorp.com');
      expect(response.body.position).toBe('Senior Software Engineer');
      expect(response.body.organizationId).toBe('org-1');
      expect(response.body.departmentId).toBe('dept-1');
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/dept-1/employees/non-existent');
      expect(response.status).toBe(404);
    });

    it('should create new employee in department', async () => {
      const newEmp = {
        name: 'Charlie Wilson',
        email: 'charlie.wilson@techcorp.com',
        position: 'Junior Developer',
        salary: 75000,
        hireDate: new Date('2023-06-01')
      };

      const response = await supertest
        .post('/api/organizations/org-1/departments/dept-1/employees')
        .send(newEmp);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newEmp.name);
      expect(response.body.email).toBe(newEmp.email);
      expect(response.body.position).toBe(newEmp.position);
      expect(response.body.salary).toBe(newEmp.salary);
      expect(response.body.organizationId).toBe('org-1');
      expect(response.body.departmentId).toBe('dept-1');
      expect(response.body.id).toBeDefined();
      expect(response.body.key).toBeDefined();
      expect(response.body.events.created.at).toBeDefined();
    });

    it('should update existing employee', async () => {
      const updates = {
        name: 'Alice Johnson Updated',
        position: 'Lead Software Engineer',
        salary: 140000
      };

      const response = await supertest
        .put('/api/organizations/org-1/departments/dept-1/employees/emp-1')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.position).toBe(updates.position);
      expect(response.body.salary).toBe(updates.salary);
      expect(response.body.email).toBe('alice.johnson@techcorp.com'); // Should remain unchanged
      expect(response.body.events.updated.at).toBeDefined();
    });

    it('should return 404 when updating non-existent employee', async () => {
      const response = await supertest
        .put('/api/organizations/org-1/departments/dept-1/employees/non-existent')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should delete employee', async () => {
      const response = await supertest.delete('/api/organizations/org-1/departments/dept-2/employees/emp-2');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'emp-2');
      expect(response.body).toHaveProperty('name', 'Bob Smith');

      // Verify employee is deleted
      const getResponse = await supertest.get('/api/organizations/org-1/departments/dept-2/employees/emp-2');
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent employee', async () => {
      const response = await supertest.delete('/api/organizations/org-1/departments/dept-1/employees/non-existent');
      expect(response.status).toBe(404);
    });
  });

  describe('Custom Endpoints', () => {
    it('should return full hierarchy', async () => {
      const response = await supertest.get('/api/hierarchy');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify hierarchy structure
      const org = response.body[0];
      expect(org).toHaveProperty('organization');
      expect(org).toHaveProperty('departments');
      expect(Array.isArray(org.departments)).toBe(true);

      if (org.departments.length > 0) {
        const dept = org.departments[0];
        expect(dept).toHaveProperty('department');
        expect(dept).toHaveProperty('employees');
        expect(Array.isArray(dept.employees)).toBe(true);
      }
    });

    it('should return statistics', async () => {
      const response = await supertest.get('/api/stats');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totals');
      expect(response.body).toHaveProperty('organizationTypes');
      expect(response.body).toHaveProperty('averageDepartmentBudget');
      expect(response.body).toHaveProperty('totalPayroll');

      // Verify stats structure
      expect(response.body.totals).toHaveProperty('organizations');
      expect(response.body.totals).toHaveProperty('departments');
      expect(response.body.totals).toHaveProperty('employees');
      expect(typeof response.body.averageDepartmentBudget).toBe('number');
      expect(typeof response.body.totalPayroll).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid organization ID in department routes', async () => {
      const response = await supertest.get('/api/organizations/invalid-org/departments');
      expect(response.status).toBe(404);
    });

    it('should handle invalid department ID in employee routes', async () => {
      const response = await supertest.get('/api/organizations/org-1/departments/invalid-dept/employees');
      expect(response.status).toBe(404);
    });

    it('should handle malformed request bodies', async () => {
      const response = await supertest
        .post('/api/organizations')
        .send({ invalid: 'data' });

      expect(response.status).toBe(500);
    });
  });

  describe('Nested Routing Structure', () => {
    it('should maintain proper parent-child relationships', async () => {
      // Create a new organization
      const newOrg = {
        name: 'Test Organization',
        type: 'startup' as const,
        founded: new Date('2023-01-01'),
        industry: 'Test'
      };

      const orgResponse = await supertest
        .post('/api/organizations')
        .send(newOrg);

      expect(orgResponse.status).toBe(201);
      const orgId = orgResponse.body.id;

      // Create a department in that organization
      const newDept = {
        name: 'Test Department',
        budget: 100000,
        headCount: 5
      };

      const deptResponse = await supertest
        .post(`/api/organizations/${orgId}/departments`)
        .send(newDept);

      expect(deptResponse.status).toBe(201);
      const deptId = deptResponse.body.id;
      expect(deptResponse.body.organizationId).toBe(orgId);

      // Create an employee in that department
      const newEmp = {
        name: 'Test Employee',
        email: 'test@example.com',
        position: 'Developer',
        salary: 50000,
        hireDate: new Date('2023-01-01')
      };

      const empResponse = await supertest
        .post(`/api/organizations/${orgId}/departments/${deptId}/employees`)
        .send(newEmp);

      expect(empResponse.status).toBe(201);
      expect(empResponse.body.organizationId).toBe(orgId);
      expect(empResponse.body.departmentId).toBe(deptId);
    });
  });
});
