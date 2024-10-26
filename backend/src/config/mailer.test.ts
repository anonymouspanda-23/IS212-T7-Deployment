import nodemailer from "nodemailer";
import Mailer from "./mailer";

jest.mock("nodemailer");

describe("Mailer", () => {
  let mailerInstance: Mailer;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_AUTH_USER = "user@example.com";
    process.env.SMTP_AUTH_PASSWORD = "password";
  });

  it("should create a singleton instance of Mailer", () => {
    const firstInstance = Mailer.getInstance();
    const secondInstance = Mailer.getInstance();
    expect(firstInstance).toBe(secondInstance);
  });

  it("should create a transporter on first call to getTransporter", () => {
    const mockTransporter = { verify: jest.fn((cb) => cb(null, true)) };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    mailerInstance = Mailer.getInstance();
    const transporter = mailerInstance.getTransporter();
    expect(transporter).toEqual(mockTransporter);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      pool: true,
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_AUTH_USER,
        pass: process.env.SMTP_AUTH_PASSWORD,
      },
    });
    expect(mockTransporter.verify).toHaveBeenCalled();
  });
});
