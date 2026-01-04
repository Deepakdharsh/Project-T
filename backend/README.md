## Turf Project Backend (Node.js + Express + TypeScript + MongoDB)

This backend is designed by analyzing the current **frontend UI flows** (catalog → slots → booking → admin management/check-in/analytics).  
The frontend currently uses local `mockData` (no `fetch/axios` yet), so these REST endpoints provide a clean, production-ready API to wire the UI to real data.

### Tech stack
- Node.js + Express
- TypeScript (ESM)
- MongoDB + Mongoose
- Zod validation (server-side)
- JWT auth + bcrypt passwords
- Helmet + CORS + express-rate-limit
- Centralized error handling

---

## Folder structure

- **`src/app.ts`**: Express app, middleware, route mounting
- **`src/server.ts`**: boot + Mongo connect
- **`src/models/*`**: Mongoose schemas
- **`src/services/*`**: business logic (booking rules, slot generation, analytics)
- **`src/controllers/*`**: HTTP mapping
- **`src/routes/*`**: route definitions
- **`src/middleware/*`**: auth, role checks, validation, rate-limit, errors

---

## Setup & run

1. From the repo root:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file (workspace blocks writing `.env*`, so copy manually):

- Copy `backend/env.example` → `backend/.env`

4. Start MongoDB locally (or point `MONGODB_URI` to your cluster).

5. Optional: seed initial data + an admin user:

```bash
npm run seed
```

Seed creates:
- Categories: Football / Cricket
- Games: 5v5 Football / 7v7 Football / Box Cricket
- Some example slots
- Example closure
- Admin user: `admin@local.test` with password `admin1234` (change for real usage)

6. Run the server:

```bash
npm run dev
```

Health check:
- `GET /health` → `{ "ok": true }`

Base API:
- `/api/v1/*`

---

## Authentication

### `POST /api/v1/auth/register`
Creates a normal user.

**Request**

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","name":"User","password":"password123"}'
```

**Response**

```json
{
  "user": { "id": "…", "email": "user@example.com", "name": "User", "role": "user" },
  "accessToken": "…"
}
```

### `POST /api/v1/auth/login`

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@local.test","password":"admin1234"}'
```

Response is the same shape as register.

Use the token:

```bash
export TOKEN="paste_jwt_here"
```

---

## Public catalog (used by booking UI)

### `GET /api/v1/catalog/categories`
**Response**

```json
{ "categories": [{ "id": "…", "name": "Football" }] }
```

### `GET /api/v1/catalog/games?categoryId=...`
**Response**

```json
{ "games": [{ "id": "…", "categoryId": "…", "name": "5v5 Football" }] }
```

### `GET /api/v1/catalog/slots?gameId=...&active=true`
**Response**

```json
{
  "slots": [
    { "id": "…", "gameId": "…", "time": "6:00 PM - 7:00 PM", "startHour": 18, "endHour": 19, "price": 60, "active": true }
  ]
}
```

### `GET /api/v1/catalog/closures?date=YYYY-MM-DD`
**Response**

```json
{
  "closures": [
    { "id": "…", "type": "partial", "date": "2026-01-05", "startHour": 18, "endHour": 20, "reason": "Maintenance", "note": "Pitch resurfacing" }
  ]
}
```

---

## Booking (used by checkout flow)

### `POST /api/v1/bookings`
Creates a booking (server validates: slots active, not closed by closures, not already booked).

**Request**

```bash
curl -s -X POST http://localhost:8080/api/v1/bookings \
  -H 'Content-Type: application/json' \
  -d '{
    "date":"2026-01-03",
    "gameId":"<GAME_ID>",
    "slotIds":["<SLOT_ID_1>","<SLOT_ID_2>"],
    "paymentMethod":"card",
    "guest":{"name":"Guest User","email":"guest@example.com"}
  }'
```

**Response**

```json
{
  "booking": {
    "id": "BK-1234",
    "date": "2026-01-03",
    "slots": ["6:00 PM - 7:00 PM"],
    "totalPrice": 60,
    "gameId": "…",
    "status": "Confirmed",
    "user": "Guest User",
    "checkedInAt": null
  }
}
```

### `GET /api/v1/bookings/:bookingId`
Fetch by booking code (used by admin check-in).

---

## Contact (used by `/contact` page)

### `POST /api/v1/contact`

```bash
curl -s -X POST http://localhost:8080/api/v1/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Deepak","email":"deepak@example.com","subject":"Support","message":"Need help"}'
```

**Response**

```json
{ "message": "Received", "id": "…", "createdAt": "…" }
```

---

## Admin (requires JWT + `role=admin`)

All admin endpoints require:
- `Authorization: Bearer <token>`

### Bookings
- `GET /api/v1/admin/bookings?date=&status=&gameId=`
- `PATCH /api/v1/admin/bookings/:bookingId/status`
- `POST /api/v1/admin/bookings/:bookingId/checkin`
- `DELETE /api/v1/admin/bookings/:bookingId`

Example:

```bash
curl -s http://localhost:8080/api/v1/admin/bookings \
  -H "Authorization: Bearer $TOKEN"
```

Update status:

```bash
curl -s -X PATCH http://localhost:8080/api/v1/admin/bookings/BK-1234/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"Cancelled"}'
```

Response:

```json
{ "booking": { "id": "BK-1234", "status": "Cancelled", "checkedInAt": null } }
```

Check-in:

```bash
curl -s -X POST http://localhost:8080/api/v1/admin/bookings/BK-1234/checkin \
  -H "Authorization: Bearer $TOKEN"
```

Response:

```json
{ "booking": { "id": "BK-1234", "status": "Checked In", "checkedInAt": "…" } }
```

### Slots
- `POST /api/v1/admin/slots`
- `POST /api/v1/admin/slots/generate`
- `PATCH /api/v1/admin/slots/:slotId`
- `DELETE /api/v1/admin/slots/:slotId`
- `DELETE /api/v1/admin/slots?gameId=...` (Remove All)

Create a slot:

```bash
curl -s -X POST http://localhost:8080/api/v1/admin/slots \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"gameId":"<GAME_ID>","startHour":18,"endHour":19,"price":60,"active":true}'
```

Response:

```json
{ "slot": { "id": "…", "gameId": "…", "time": "6:00 PM - 7:00 PM", "startHour": 18, "endHour": 19, "price": 60, "active": true } }
```

Generate example:

```bash
curl -s -X POST http://localhost:8080/api/v1/admin/slots/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"gameId":"<GAME_ID>","openHour":6,"closeHour":23,"durationMins":"60","dayPrice":1200,"peakPrice":1500,"peakStartHour":18,"replaceExisting":false}'
```

Remove all slots for a game:

```bash
curl -s -X DELETE "http://localhost:8080/api/v1/admin/slots?gameId=<GAME_ID>" \
  -H "Authorization: Bearer $TOKEN"
```

Response:

```json
{ "deletedCount": 12 }
```

### Closures
- `GET /api/v1/admin/closures`
- `POST /api/v1/admin/closures`
- `DELETE /api/v1/admin/closures/:closureId`

Create closure:

```bash
curl -s -X POST http://localhost:8080/api/v1/admin/closures \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"type":"partial","date":"2026-01-05","startHour":18,"endHour":20,"reason":"Maintenance","note":"Pitch resurfacing"}'
```

### Analytics
- `GET /api/v1/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD`

Example:

```bash
curl -s "http://localhost:8080/api/v1/admin/analytics?from=2026-01-01&to=2026-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

Response:

```json
{
  "analytics": {
    "totalRevenue": 120,
    "totalBookings": 2,
    "activeBookings": 2,
    "byStatus": { "Confirmed": 2 },
    "revenueByDate": { "2026-01-03": 120 },
    "revenueByGame": { "…gameId…": 120 }
  }
}
```
---

## Notes
- Payment is **not processed** here (the current frontend is a simulation). The backend validates bookings and reserves slots.
- If you want, I can also:
  - add refresh tokens + httpOnly cookies
  - add Swagger/OpenAPI docs
  - add pagination/search/sorting for admin tables
  - add role-based user bookings (`/api/v1/me/bookings`)


