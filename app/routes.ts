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
  
  // Auction Routes
  route("auctions", "routes/auctions._index.tsx"),
  route("auctions/new", "routes/auctions.new.tsx"),
  route("auctions/:auctionId", "routes/auctions.$auctionId.tsx"),
  route("auctions/:auctionId/join", "routes/auctions.$auctionId.join.tsx"),
  route("auctions/:auctionId/edit", "routes/auctions.$auctionId.edit.tsx"),
] satisfies RouteConfig;
