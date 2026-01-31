
export const routerVersion1 = "/api/v1"
export const isProductionEnv = process.env.NODE_ENV === "production"
export const baseUrl = isProductionEnv
  ? "https://event-management-backend-mk93.onrender.com"
  : "http://localhost:4000";