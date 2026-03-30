import { JwtUserPayload } from "./auth.js"
declare global{
namespace Express {
  interface Request {
    user?:JwtUserPayload;
    }
  }
}
export {}