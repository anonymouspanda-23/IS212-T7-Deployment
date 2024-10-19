import bcrpyt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrpyt.hash(password, saltRounds);
}