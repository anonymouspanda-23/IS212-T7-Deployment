import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Employee from '@/models/Employee';
import path from "path";
import { readFileSync } from "fs";
import { hashPassword } from "@/tests/utils";
import { app } from "@/index";
import request from "supertest";
import { Server } from "http";
import { errMsg } from "@/helpers";

// Unmock mongoose and Employee model specifically for this test file
jest.unmock('mongoose');
jest.unmock('@/models/Employee');

describe('Employee Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mockServer: Server;

  const filePath = path.resolve("@/../script/employee.json");
  const fileContent = readFileSync(filePath, "utf-8");
  const employees = JSON.parse(fileContent);

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    mockServer = app.listen();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    mockServer.close();
  });

  beforeEach(async () => {
    // Clear all collections
    await Employee.deleteMany();

    const EMPLOYEE_LIMIT = 10; // Adjust this value as needed

    // Populate table
    for (let i = 0; i < Math.min(EMPLOYEE_LIMIT, employees.length); i++) {
      const employeeData = employees[i];
      employeeData.hashedPassword = await hashPassword("password123");
      await Employee.create(employeeData);
    }
  }, 60000); // Set limit to 1 min. Default is 5 sec.

  describe('getEmployeeByEmail', () => {
    it('should return employee data when credentials are valid', async () => {
      const requestBody = {
        staffEmail: 'jack.sim@allinone.com.sg',
        staffPassword: 'password123'
      };

      const expectedResponse = {
        staffId: 130002,
        name: 'Jack Sim',
        dept: 'CEO',
        position: 'MD',
        email: 'jack.sim@allinone.com.sg',
        reportingManager: 130002,
        role: 1,
      };

      const response = await request(mockServer)
        .post("/api/v1/login")
        .send(requestBody)

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(expectedResponse);
    });

    it('should return error for non-existent user', async () => {
      const requestBody = {
        staffEmail: 'nonexistent@lurence.org',
        staffPassword: 'test-password'
      };

      const expectedResponse = {
        "error": errMsg.USER_DOES_NOT_EXIST
      };

      const response = await request(mockServer)
        .post("/api/v1/login")
        .send(requestBody)

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(expectedResponse);
    });
  });
});