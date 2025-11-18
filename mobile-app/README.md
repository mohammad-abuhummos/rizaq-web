# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Transport Offers (Buyer)

This feature enables buyers to send transport offers to logistics providers and accept an offer for delivery.

### Accessing the screen

- From the home screen, tap the "Transport" button to open `app/transport.tsx`.

### API endpoints

- Create offer (body fields as JSON):

```bash
POST /api/transport/offers
{
  "transportRequestId": 0,
  "transporterId": 0,
  "offeredPrice": 0,
  "estimatedPickupDate": "2025-10-28T18:09:04.600Z",
  "estimatedDeliveryDate": "2025-10-28T18:09:04.600Z",
  "notes": "string",
  "status": "string"
}
```

- List offers by request:

```bash
GET /api/transport/requests/{requestId}/offers
```

- Accept an offer:

```bash
POST /api/transport/offers/{offerId}/accept
```

### Implementation

- Types in `types/transport.ts`.
- Service calls in `services/transport.ts`:
  - `createTransportOffer(dto)`
  - `listTransportOffers({ transportRequestId })`
  - `acceptTransportOffer(offerId)`
- UI in `app/transport.tsx`:
  - "Send Offer" form for buyers.
  - Divider (hr) then a "Show Offers" section with accept buttons.

### Related transport features (Requirements)

- Official pricing mode (Ministry): `POST /api/transport-prices/official` to set price bulletins by distance (km).
- Negotiated pricing: Open a chat room to negotiate with carriers, e.g.:
  - `POST /api/chat/open/{contextType}/{contextId}`
  - `POST /api/chat/messages`
  - `GET /api/chat/conversations/{id}/messages`
- Providers and vehicles:
  - `POST /api/transport` (create provider)
  - `GET /api/transport` (list providers)
  - `POST /api/transport/{id}/vehicles` (add vehicle)

### Transport Prices

- Regions list (dropdown):

```bash
GET /api/transport-prices/regions
```

Expected response shape (example):

```json
{
  "success": true,
  "data": ["دمشق", "ريف دمشق", "حمص", "حماة", "حلب", "اللاذقية", "طرطوس", "درعا", "السويداء", "القنيطرة", "دمشق - الزبلطاني", "ريف دمشق - رنكوس", "ريف دمشق - قطنا", "درعا - سوق الهال"],
  "message": null,
  "meta": null,
  "traceId": "...",
  "error": null
}
```

- Official price:

```bash
POST /api/transport-prices/official
{
  "fromRegion": "دمشق",
  "toRegion": "درعا",
  "distanceKm": 65
}
```

- Cheapest price:

```bash
POST /api/transport-prices/cheapest
{
  "fromRegion": "دمشق",
  "toRegion": "درعا",
  "distanceKm": 65
}
```

- Negotiation:

```bash
POST /api/transport-prices/negotiation
{
  "fromRegion": "دمشق",
  "toRegion": "درعا"
}
```

Implementation:
- Service: `services/transport-prices.ts` (regions/official/cheapest/negotiation)
- UI: `app/transport.tsx` → "Transport Prices" section with two region dropdowns, optional distance, and sub-buttons for each endpoint.

Notes:
- The offers listing endpoint is assumed as `GET /api/transport/offers` with optional filters; adjust if your backend differs.
- All requests are sent with Bearer auth if available (`utils/http.ts`).
