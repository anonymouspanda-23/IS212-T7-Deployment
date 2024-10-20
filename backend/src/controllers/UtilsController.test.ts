import { Context } from "koa";
import UtilsController from "./UtilsController";

describe("UtilsController", () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = {
      body: {},
    } as unknown as Context;
  });

  it("should set the error message in ctx.body", () => {
    const errorMessage: any = "Some error occurred"; // Use an appropriate error message
    UtilsController.throwAPIError(ctx, errorMessage);
    expect(ctx.body).toEqual({ error: errorMessage });
  });
});
