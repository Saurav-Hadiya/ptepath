// bcrypt helpers — implemented in auth step
export async function hashPassword(plain: string): Promise<string> {
  return '';
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return false;
}
