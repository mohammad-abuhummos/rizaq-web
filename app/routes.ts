import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("register/step1", "routes/register/step1.tsx"),
  route("register/otp", "routes/register/otp.tsx"),
  route("register/role", "routes/register/role.tsx"),
  route("register/details", "routes/register/details.tsx"),
  route("register/documents", "routes/register/documents.tsx"),
  route("register/payout", "routes/register/payout.tsx"),
] satisfies RouteConfig;
