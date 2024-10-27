import { Context } from 'koa';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import EmployeeController from '@/controllers/EmployeeController';
import EmployeeService from '@/services/EmployeeService';
import EmployeeDb from '@/database/EmployeeDb';
import { generateMockEmployee } from '@/tests/mockData';
import Employee from '@/models/Employee';
import { errMsg } from "@/helpers";

// Unmock mongoose and Employee model specifically for this test file
jest.unmock('mongoose');
jest.unmock('@/models/Employee');
describe('Employee Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let employeeController: EmployeeController;
  let ctx: Context;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Initialize the controller with its dependencies
    const employeeDb = new EmployeeDb();
    const employeeService = new EmployeeService(employeeDb);
    employeeController = new EmployeeController(employeeService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Employee.deleteMany({});

    // Create test data
    const mockEmployee1 = await generateMockEmployee();
    const mockEmployee2 = await generateMockEmployee({
      staffId: 2,
      email: "subordinate@lurence.org",
      reportingManager: 1,
      reportingManagerName: "John Doe",
      role: 3
    });

    await Employee.create([mockEmployee1, mockEmployee2]);

    // Reset mock context
    ctx = {
      method: 'POST',
      query: {},
      body: {},
      request: { body: {} },
      response: {},
    } as Context;
  });

  describe('getEmployeeByEmail', () => {
    it('should return employee data when credentials are valid', async () => {
      ctx.request.body = {
        staffEmail: 'subordinate@lurence.org',
        staffPassword: 'test-password'
      };

      await employeeController.getEmployeeByEmail(ctx);

      expect(ctx.body).toMatchObject({
        staffId: 2,
        name: 'John Doe',
        dept: 'Development',
        position: 'Developer',
        email: 'subordinate@lurence.org',
        reportingManager: 1,
        reportingManagerName: 'John Doe',
        role: 3
      });
    });

    it('should return error for non-existent user', async () => {
      ctx.request.body = {
        staffEmail: 'nonexistent@lurence.org',
        staffPassword: 'test-password'
      };

      await employeeController.getEmployeeByEmail(ctx);

      expect(ctx.body).toEqual({
        error: errMsg.USER_DOES_NOT_EXIST
      });
    });
  });
});