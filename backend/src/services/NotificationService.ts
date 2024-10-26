import Mailer from "@/config/mailer";
import { errMsg } from "@/helpers";
import EmployeeService from "@/services/EmployeeService";

interface ManagerDetails {
  name: string;
  email: string;
}

class NotificationService {
  private employeeService: EmployeeService;
  private mailer: Mailer;

  constructor(employeeService: EmployeeService, mailer: Mailer) {
    this.employeeService = employeeService;
    this.mailer = mailer;
  }

  private async getManagerDetails(managerId: number): Promise<ManagerDetails> {
    const managerDetails = await this.employeeService.getEmployee(managerId);
    if (!managerDetails) throw new Error("Manager details not found");

    return {
      name: `${managerDetails.staffFName} ${managerDetails.staffLName}`,
      email: managerDetails.email,
    };
  }

  private createEmailContent(
    manager: ManagerDetails,
    requestType: string,
    requestDates: [string, string][],
    requestReason: string,
  ): { text: string; html: string } {
    if (requestDates.length === 0) {
      throw new Error("No dates to send");
    }

    const textBody = this.createTextBody(
      manager,
      requestType,
      requestDates,
      requestReason,
    );
    const htmlBody = this.createHtmlBody(
      manager,
      requestType,
      requestDates,
      requestReason,
    );

    return { text: textBody, html: htmlBody };
  }

  private createTextBody(
    manager: ManagerDetails,
    requestType: string,
    requestDates: [string, string][],
    requestReason: string,
  ): string {
    let textBody = `Your ${requestType.toLowerCase()} for the following dates have been sent to ${manager.name}(${manager.email}):\n`;
    requestDates.forEach(([date, type]) => {
      textBody += `${date}, ${type}\n`;
    });
    textBody += `\nReason: ${requestReason}\n`;
    return textBody;
  }

  private createHtmlBody(
    manager: ManagerDetails,
    requestType: string,
    requestDates: [string, string][],
    requestReason: string,
  ): string {
    const tableRows = requestDates
      .map(
        ([date, type], index) => `
    <tr>
      <td style="border: 1px solid black; border-collapse: collapse;">${date}</td>
      <td style="border: 1px solid black; border-collapse: collapse;">${type}</td>
      ${index === 0 ? `<td style="border: 1px solid black; border-collapse: collapse;" rowspan="${requestDates.length}">${requestReason}</td>` : ""}
    </tr>
  `,
      )
      .join("");

    return `
    <html>
      <head></head>
      <body>
        <p>Your ${requestType.toLowerCase()} for the following dates have been sent to ${manager.name} (<a href="mailto:${manager.email}">${manager.email}</a>).</p>
        <table style="border: 1px solid black; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid black; border-collapse: collapse;">Requested Dates</th>
            <th style="border: 1px solid black; border-collapse: collapse;">Duration</th>
            <th style="border: 1px solid black; border-collapse: collapse;">Reason</th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;
  }

  private async sendEmail(
    emailSubject: string,
    staffEmail: string,
    content: { text: string; html: string },
  ): Promise<void> {
    const transporter = this.mailer.getTransporter();
    const staffName = staffEmail.split("@")[0];

    const mailOptions = {
      from: "noreply@lurence.org",
      to: `${staffName}@yopmail.com`,
      subject: emailSubject,
      text: content.text,
      html: content.html,
    };

    await transporter.sendMail(mailOptions);
  }

  public async pushRequestSentNotification(
    emailSubject: string,
    staffEmail: string,
    managerId: number,
    requestType: string,
    requestDates: any,
    requestReason: string,
  ): Promise<string> {
    try {
      const managerDetails = await this.getManagerDetails(managerId);
      const emailContent = this.createEmailContent(
        managerDetails,
        `WFH ${requestType}`,
        requestDates,
        requestReason,
      );
      await this.sendEmail(emailSubject, staffEmail, emailContent);
      return "Email sent successfully!";
    } catch (error) {
      return errMsg.FAILED_TO_SEND_EMAIL;
    }
  }

  public async notifyApproval(
    approveEmail: string,
    emailSubject: string,
    emailBodyContent: string,
    dateRange: Date[],
  ): Promise<any> {
    const [startDate, endDate] = dateRange;
    const emailContentHtml = this.approvalHtmlBody(
      startDate,
      endDate,
      emailBodyContent,
    );
    try {
      const emailContent = { text: "", html: emailContentHtml };
      await this.sendEmail(emailSubject, approveEmail, emailContent);
      return true;
    } catch (error) {
      return errMsg.FAILED_TO_SEND_EMAIL;
    }
  }

  private approvalHtmlBody(
    startDate: Date,
    endDate: Date,
    emailBodyContent: string,
  ): string {
    const tableRows = `
    <tr>
      <td style="border: 1px solid black; border-collapse: collapse;">${startDate} to ${endDate}</td>
    </tr>
  `;
    return `
    <html>
       <p>${emailBodyContent}</p>
      <body>
        <table style="border: 1px solid black; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid black; border-collapse: collapse;">Requested Dates</th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;
  }
}

export default NotificationService;
