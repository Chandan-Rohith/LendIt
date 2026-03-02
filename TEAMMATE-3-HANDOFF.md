# Teammate 3 — Handoff Document
## Features: Tool Details + Booking, My Orders, Reviews

---

## 1. Project Setup

### Prerequisites
- Node.js installed
- MySQL running with database `lendit_db` (port 3306, user: root, password: panduorange)
- Java 21 + Maven installed

### Running the app
```bash
# Terminal 1 — Backend
cd lendit-backend
mvn spring-boot:run
# Runs on http://localhost:8080

# Terminal 2 — Frontend
cd lendit-frontend
npm run dev
# Runs on http://localhost:5173
```

### Test setup
You'll need **2 user accounts** to test bookings (one to list a tool, one to book it).
Register two users at http://localhost:5173/register with different emails.

---

## 2. What's Already Done (DON'T MODIFY)

| File | Purpose |
|------|---------|
| `src/api/api.js` | All API calls — you'll USE these, not modify |
| `src/context/AuthContext.jsx` | Auth state. Access via `useAuth()` hook |
| `src/components/Navbar.jsx` | Top navbar |
| `src/components/Sidebar.jsx` | Left sidebar with nav links |
| `src/components/ToolCard.jsx` | Reusable tool card component |
| `src/components/ReviewForm.jsx` | **REUSABLE review form** — already built, you just wire it |
| `src/components/ProtectedRoute.jsx` | Route guard |
| `src/App.jsx` | Routes already wired for `/tools/:id` and `/my-orders` |
| `src/App.css` | Complete styling — all CSS classes you need are here |
| Backend (entire `lendit-backend/`) | Fully built. All endpoints work. Don't touch. |

---

## 3. YOUR FILES TO IMPLEMENT

---

### File 1: `src/pages/ToolDetailsPage.jsx`
**Current state:** Stub with "Coming soon" placeholder
**Route:** `/tools/:id` (already wired in App.jsx)

#### What to build:
A detail page showing one tool's full info, a calendar with blocked dates, and a booking form.

#### How users reach this page:
From the Home page, clicking any ToolCard navigates to `/tools/{id}`.

#### API functions to use:

```javascript
import { getToolById, getBlockedDates, createBooking } from '../api/api';
import { useParams } from 'react-router-dom';

// Get route param
const { id } = useParams();

// Fetch tool details
const toolRes = await getToolById(id);
// toolRes.data = ToolResponse (see shape below)

// Fetch blocked dates for calendar
const datesRes = await getBlockedDates(id);
// datesRes.data = ["2026-03-15", "2026-03-16", ...] (array of date strings)

// Create a booking
const bookingRes = await createBooking({
  toolId: Number(id),
  startDate: '2026-04-01',   // "YYYY-MM-DD" format
  endDate: '2026-04-03'      // "YYYY-MM-DD" format
});
// bookingRes.data = BookingResponse (see shape below)
```

#### Backend endpoint details:

```
GET /api/tools/{toolId}
→ Returns: ToolResponse

GET /api/tools/{toolId}/blocked-dates
→ Returns: string[] (array of "YYYY-MM-DD" date strings)

POST /api/bookings
Body: { "toolId": 5, "startDate": "2026-04-01", "endDate": "2026-04-03" }
→ Returns: BookingResponse
→ Fails if dates overlap with existing bookings or blocked dates
```

#### ToolResponse shape:
```json
{
  "id": 5,
  "name": "Drill Machine",
  "description": "Cordless drill for home use",
  "photoUrl": "/uploads/abc123.jpg",
  "categoryName": "Power Tools",
  "categoryId": 1,
  "ownerName": "John Doe",
  "ownerId": 1,
  "ownerRating": 4.5,
  "distance": 3.2,
  "available": true
}
```

#### UI suggestions:
- Show tool image (prefix URL: `http://localhost:8080${tool.photoUrl}`)
- Show tool name, description, category, owner name, owner rating, distance
- Calendar/date picker showing blocked dates as disabled (use `react-calendar` or `react-datepicker` — both installed)
- Start date + End date pickers for booking
- "Book Now" button that calls `createBooking()`
- Success message after booking, or error if dates conflict
- Don't let user book their own tool (compare `tool.ownerId` with `useAuth().user.userId`)

#### Installed npm packages:
- `react-calendar` — calendar component (can highlight blocked dates)
- `react-datepicker` — date range picker
- `react-icons` — icons (FiStar, FiMapPin, FiCalendar, etc.)

---

### File 2: `src/pages/MyOrdersPage.jsx`
**Current state:** Stub with "Coming soon" placeholder
**Route:** `/my-orders` (already wired in App.jsx)

#### What to build:
A page listing all bookings the logged-in user has **made** (as a borrower), with the ability to leave reviews for completed bookings.

#### API functions to use:

```javascript
import { getMyOrders } from '../api/api';

const res = await getMyOrders();
// res.data = BookingResponse[] (array)
```

#### BookingResponse shape (each item):
```json
{
  "id": 12,
  "toolId": 5,
  "toolName": "Drill Machine",
  "toolPhotoUrl": "/uploads/abc123.jpg",
  "ownerName": "John Doe",
  "ownerId": 1,
  "borrowerName": "Jane Smith",
  "borrowerId": 2,
  "startDate": "2026-04-01",
  "endDate": "2026-04-03",
  "status": "APPROVED",
  "canReview": true
}
```

#### Booking statuses:
| Status | Meaning |
|--------|---------|
| `PENDING` | Waiting for tool owner to approve |
| `APPROVED` | Owner approved the booking |
| `REJECTED` | Owner rejected the booking |
| `COMPLETED` | Booking period ended, tool returned |

#### Review integration:
The `ReviewForm` component is **already built**. Import and use it:

```jsx
import ReviewForm from '../components/ReviewForm';

// Show ReviewForm only when canReview is true
{booking.canReview && (
  <ReviewForm
    bookingId={booking.id}
    onReviewSubmitted={() => {
      // Refresh the list or hide the form
      fetchMyOrders();
    }}
  />
)}
```

#### ReviewForm sends this to backend:
```json
POST /api/reviews
{
  "bookingId": 12,
  "rating": 4,           // 1-5, required
  "remarks": "Great tool, worked perfectly",  // optional (also used for complaints)
  "damageReport": false  // optional, boolean
}
```

**NOTE:** The review form should send `remarks` (string) and `damageReport` (boolean). We consolidated complaint text into the `remarks` field, so use a single "Remarks / Complaint" textarea for both.

#### UI suggestions:
- List each booking as a card showing: tool name, tool image, dates, status badge, owner name
- Color-code status: PENDING=yellow, APPROVED=green, REJECTED=red, COMPLETED=blue
- Show "Leave Review" expandable section for completed bookings where `canReview === true`
- Show a message after review is submitted

---

## 4. Available CSS Classes (in App.css — don't modify)

| Class | Purpose |
|-------|---------|
| `.auth-card` | White card container with shadow |
| `.form-group` | Form field wrapper |
| `.btn-primary` | Teal button |
| `.btn-secondary` | Light blue button |
| `.btn-danger` | Red button |
| `.btn-full` | Full-width button |
| `.error-message` | Red error banner |
| `.success-message` | Green success banner |
| `.tools-grid` | Responsive grid for cards |
| `.tool-card` | Card styling |
| `.empty-state` | Centered empty message |
| `.loading` | Loading spinner text |
| `.review-form` | Review form container (used by ReviewForm component) |
| `.star-rating` | Star rating row |
| `.star.filled` | Filled star color |

---

## 5. Important Notes

1. **Authentication is automatic.** JWT token is in localStorage and auto-attached to all API requests by the Axios interceptor. No manual auth work needed.

2. **Photo URLs:** Backend returns paths like `/uploads/abc.jpg`. Display with: `http://localhost:8080${photoUrl}`

3. **Date format:** Backend uses `"YYYY-MM-DD"` strings. Convert JS Date: `date.toISOString().split('T')[0]`

4. **You need 2 test accounts:**
   - User A: lists a tool (via Add Tool page, built by Teammate 2)
   - User B: books User A's tool (via your Tool Details page)
   - User A: approves the booking (via My Tools page, built by Teammate 2)
   - User B: leaves a review on completed booking (via your My Orders page)

5. **canReview field:** The backend sets `canReview: true` on a BookingResponse only when the booking is COMPLETED and a review hasn't been submitted yet. Use this flag to show/hide the ReviewForm.

6. **Self-booking prevention:** The backend rejects bookings where the borrower is the tool owner. But add a frontend check too — hide the booking form if `tool.ownerId === user.userId`.

7. **Don't modify** App.jsx, api.js, App.css, AuthContext, MyToolsPage.jsx, or any backend files.

8. **MyToolsPage.jsx belongs to Teammate 2.** They handle tool listing, deletion, and incoming booking requests. You do NOT need to touch that file.

---

## 6. Quick Reference — File Locations

```
lendit-frontend/src/
├── api/
│   └── api.js                  ← DON'T MODIFY (has getToolById, getBlockedDates,
│                                   createBooking, getMyOrders, submitReview)
├── components/
│   ├── ToolCard.jsx             ← REUSE for displaying tools
│   └── ReviewForm.jsx           ← REUSE for the review form (may need minor field name fix)
├── context/
│   └── AuthContext.jsx          ← DON'T MODIFY (useAuth() gives { user, token, ... })
├── pages/
│   ├── ToolDetailsPage.jsx      ← YOUR FILE — tool details + booking form
│   └── MyOrdersPage.jsx         ← YOUR FILE — booking list + reviews
└── App.css                      ← DON'T MODIFY (CSS classes ready for you)
```

---

## 7. Testing Checklist

- [ ] Open a tool from Home page → Tool Details loads with correct info
- [ ] Blocked dates visible on calendar/date picker
- [ ] Book a tool with valid dates → success message
- [ ] Try booking with conflicting dates → error message
- [ ] Try booking own tool → prevented
- [ ] My Orders shows all bookings with correct statuses
- [ ] Leave review on completed booking → review submitted
- [ ] canReview disappears after review is submitted
