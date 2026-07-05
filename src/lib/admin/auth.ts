/** Credenciales admin (hardcoded — app estática) */
export const ADMIN_CEDULA = "1718451691";
export const ADMIN_CODE = "0011";

const SESSION_KEY = "ventas-calc:admin-auth";

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function loginAdmin(cedula: string, code: string): boolean {
  const ok =
    cedula.trim() === ADMIN_CEDULA && code.trim() === ADMIN_CODE;
  if (ok) sessionStorage.setItem(SESSION_KEY, "1");
  return ok;
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
