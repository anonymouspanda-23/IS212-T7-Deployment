import { errMsg } from "@/helpers";
import { Context } from "koa";

class UtilsController {
  public static throwAPIError(ctx: Context, errorMessage: errMsg) {
    ctx.body = { error: errorMessage };
  }
}

export default UtilsController;
