// JWT helpers — implemented in auth step
export function signAccessToken(payload: object): string {
  return '';
}

export function signRefreshToken(payload: object): string {
  return '';
}

export function verifyAccessToken(token: string): object | null {
  return null;
}

export function verifyRefreshToken(token: string): object | null {
  return null;
}
