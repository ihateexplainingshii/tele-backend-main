import { IUser } from "./model/userModel";

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Add your user type here
    }
  }
}
