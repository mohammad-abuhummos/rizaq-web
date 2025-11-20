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

  // Direct Selling (Listings) Routes
  route("direct-selling", "routes/direct-selling._index.tsx"),
  route("direct-selling/new", "routes/direct-selling.new.tsx"),
  route("direct-selling/:id", "routes/direct-selling.$id.tsx"),

  // Tender Routes
  route("tenders", "routes/tenders._index.tsx"),
  route("tenders/new", "routes/tenders.new.tsx"),
  route("tenders/:id", "routes/tenders.$id.tsx"),

  // Chat & Messages Routes
  route("messages", "routes/messages.tsx"),
  route("chat/:conversationId", "routes/chat.$conversationId.tsx"),

  // Notifications Route
  route("notifications", "routes/notifications.tsx"),
] satisfies RouteConfig;
