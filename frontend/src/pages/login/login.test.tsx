import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@/tests/testUtils";
import Login from "@/pages/login/login";

describe("Login Component with Vitest", () => {
  afterEach(() => {
    cleanup();
  });

  it("should load the components and styles", async () => {
    // Arrange
    render(<Login />);
    const mainTitle = screen.getByText("SPM T7");
    const portalTitle = screen.getByText("WFH Portal");

    // Assert
    expect(mainTitle).toBeInTheDocument();
    expect(portalTitle).toBeInTheDocument();
    expect(portalTitle).toHaveStyle("text-align: center");
  });
});
