# Teammate 2 — Handoff Document
## Features: Add Tool + My Tools (Listing, Delete, Incoming Requests)

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

### Test user
Register a new user at http://localhost:5173/register (or use an existing account).

---

## 2. What's Already Done (DON'T MODIFY)

| File | Purpose |
|------|---------|
| `src/api/api.js` | All API calls — you'll USE these, not modify |
| `src/context/AuthContext.jsx` | Auth state (token, user). Access via `useAuth()` |
| `src/components/Navbar.jsx` | Top navbar with logout |
| `src/components/Sidebar.jsx` | Left sidebar with nav links |
| `src/components/ToolCard.jsx` | Reusable tool card for listings |
| `src/components/ProtectedRoute.jsx` | Route guard — redirects to login if not authenticated |
| `src/App.jsx` | Routes already wired for `/add-tool` and `/my-tools` |
| `src/App.css` | Complete styling — all CSS classes you need are here |
| Backend (entire `lendit-backend/`) | Fully built. All endpoints work. Don't touch. |

---

## 3. YOUR FILES TO IMPLEMENT

### File 1: `src/pages/AddToolPage.jsx`
**Current state:** Stub with "Coming soon" placeholder
**Route:** `/add-tool` (already wired in App.jsx)

#### What to build:
A form that lets the logged-in user list a new tool for sharing.

#### Form fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Tool Name | text input | Yes | |
| Description | textarea | No | |
| Category | dropdown/select | Yes | Populated from API |
| Photo | file input | No | Single image upload |
| Blocked Dates | date picker(s) | No | Dates when tool is unavailable |

#### API functions to use (already in `src/api/api.js`):

```javascript
// Fetch categories for the dropdown
import { getCategories, addTool } from '../api/api';

// Get categories — returns array of { id, name }
const res = await getCategories();
// res.data = [{ id: 1, name: "Power Tools" }, { id: 2, name: "Garden Tools" }, ...]

// Submit new tool — multipart/form-data
const formData = new FormData();
formData.append('tool', new Blob([JSON.stringify({
  name: 'Drill Machine',
  description: 'Powerful cordless drill',
  categoryId: 1,
  blockedDates: ['2026-03-15', '2026-03-16']  // optional, array of "YYYY-MM-DD"
})], { type: 'application/json' }));
formData.append('photo', photoFile);  // optional, from file input

const res = await addTool(formData);
// res.data = ToolResponse object (see below)
```

#### Backend endpoint details:
```
POST /api/tools
Content-Type: multipart/form-data

Parts:
  - "tool" (required): JSON blob with ToolRequest fields
  - "photo" (optional): image file

ToolRequest JSON:
{
  "name": "Drill Machine",        // required, string
  "description": "Cordless drill", // optional, string
  "categoryId": 1,                 // required, number
  "blockedDates": ["2026-03-15"]   // optional, array of date strings
}

Response (ToolResponse):
{
  "id": 5,
  "name": "Drill Machine",
  "description": "Cordless drill",
  "photoUrl": "/uploads/abc123.jpg",
  "categoryName": "Power Tools",
  "categoryId": 1,
  "ownerName": "John Doe",
  "ownerId": 1,
  "ownerRating": 4.5,
  "distance": null,
  "available": true
}
```

#### After successful submission:
Navigate to `/my-tools` using `useNavigate()` from react-router-dom.

#### Available CSS classes (in App.css):
- `.auth-card` — white card container with shadow (reuse for the form wrapper)
- `.form-group` — standard field wrapper with label + input styling
- `.form-group label` — styled labels
- `.form-group input`, `.form-group textarea`, `.form-group select` — styled inputs
- `.btn-primary`, `.btn-full` — teal submit button, full width
- `.error-message` — red error banner
- `.success-message` — green success banner

#### Installed npm packages you can use:
- `react-datepicker` — for blocked dates selection
- `react-icons` — for icons (e.g., `FiUpload`, `FiCalendar`)

---

### File 2: `src/pages/MyToolsPage.jsx`
**Current state:** Stub with "Coming soon" placeholder
**Route:** `/my-tools` (already wired in App.jsx)

#### What to build:
A page with **two sections**:
1. **My Listed Tools** — all tools the logged-in user has listed, with ability to delete
2. **Incoming Booking Requests** — all booking requests other users have made on your tools, with approve/reject/complete actions

---

#### SECTION 1: My Listed Tools

##### API functions to use:

```javascript
import { getMyTools, deleteTool } from '../api/api';

// Fetch my tools
const res = await getMyTools();
// res.data = array of ToolResponse objects

// Delete a tool
await deleteTool(toolId);
```

##### Backend endpoint details:
```
GET /api/tools/my-tools
→ Returns: ToolResponse[] (array of tools owned by the logged-in user)

DELETE /api/tools/{toolId}
→ Returns: 200 OK (empty body)
→ Only the owner can delete their own tool
```

##### ToolResponse shape (each tool in the array):
```json
{
  "id": 5,
  "name": "Drill Machine",
  "description": "Cordless drill",
  "photoUrl": "/uploads/abc123.jpg",
  "categoryName": "Power Tools",
  "categoryId": 1,
  "ownerName": "John Doe",
  "ownerId": 1,
  "ownerRating": 4.5,
  "distance": null,
  "available": true
}
```

##### UI suggestions for Section 1:
- Reuse the `ToolCard` component: `import ToolCard from '../components/ToolCard'`
- Add a Delete button per tool (use `.btn-danger` CSS class)
- Show empty state if no tools: "You haven't listed any tools yet"
- Add a link/button to `/add-tool`

---

#### SECTION 2: Incoming Booking Requests

Show all booking requests that other users have made on the logged-in user's tools, with approve/reject/complete buttons.

##### API functions to use:

```javascript
import { getMyToolBookings, updateBookingStatus } from '../api/api';

// Get all bookings on my tools (I am the tool OWNER)
const res = await getMyToolBookings();
// res.data = BookingResponse[] (array)

// Approve a booking
await updateBookingStatus(bookingId, 'APPROVED');

// Reject a booking
await updateBookingStatus(bookingId, 'REJECTED');

// Mark as completed (after tool is returned)
await updateBookingStatus(bookingId, 'COMPLETED');
```

##### Backend endpoint details:
```
GET /api/bookings/my-tools
→ Returns: BookingResponse[] (bookings where logged-in user is the tool OWNER)

PATCH /api/bookings/{bookingId}/status?status=APPROVED
PATCH /api/bookings/{bookingId}/status?status=REJECTED
PATCH /api/bookings/{bookingId}/status?status=COMPLETED
→ Returns: updated BookingResponse
→ Only the tool owner can change booking status
```

##### BookingResponse shape (each item):
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
  "status": "PENDING",
  "canReview": false
}
```

##### Booking statuses:
| Status | Meaning | Actions Available |
|--------|---------|-------------------|
| `PENDING` | Waiting for you to approve | **Approve** or **Reject** |
| `APPROVED` | You approved the booking | **Mark Completed** |
| `REJECTED` | You rejected the booking | No actions |
| `COMPLETED` | Tool returned, booking done | No actions |

##### UI suggestions for Section 2:
- Show each request as a card with: tool name, borrower name, dates, status badge
- Color-code status: PENDING=yellow, APPROVED=green, REJECTED=red, COMPLETED=blue
- For PENDING bookings: show "Approve" (`.btn-primary`) and "Reject" (`.btn-danger`) buttons
- For APPROVED bookings: show "Mark Completed" (`.btn-secondary`) button
- Show empty state if no requests: "No incoming requests yet"
- Refresh the list after any status change

---

#### Available CSS classes for both sections:
- `.tools-grid` — responsive grid layout for cards
- `.tool-card` — individual card (ToolCard component uses this)
- `.btn-primary` — teal button (approve)
- `.btn-secondary` — light blue button (mark completed)
- `.btn-danger` — red button for delete/reject
- `.empty-state` — centered empty message
- `.page-placeholder` — centered container (replace this with your real content)
- `.auth-card` — white card with shadow (use for request cards)

---

## 4. Categories Available in Database
These are seeded automatically when backend starts:

| ID | Name |
|----|------|
| 1 | Power Tools |
| 2 | Garden Tools |
| 3 | Construction Tools |
| 4 | Cleaning Tools |
| 5 | Automotive Tools |
| 6 | Electrical Tools |
| 7 | Miscellaneous |

---

## 5. Important Notes

1. **Authentication is automatic.** The JWT token is stored in localStorage and attached to every API request by the Axios interceptor in `api.js`. You don't need to handle auth headers manually.

2. **Photo uploads:** The backend stores uploaded photos in a `/uploads/` directory and returns the URL as `/uploads/filename.jpg`. To display images, prefix with `http://localhost:8080`. Example: `http://localhost:8080/uploads/abc123.jpg`

3. **multipart/form-data is tricky.** The `addTool()` function in api.js already sets the correct content type. But the "tool" part must be a JSON Blob:
   ```javascript
   formData.append('tool', new Blob([JSON.stringify(toolData)], { type: 'application/json' }));
   ```

4. **Date format:** Backend expects dates as `"YYYY-MM-DD"` strings (ISO format). Use `toISOString().split('T')[0]` to convert JS Date objects.

5. **Don't modify** App.jsx, api.js, App.css, AuthContext, or any backend files.

6. **You need 2 test accounts** to test incoming requests:
   - User A: lists a tool via Add Tool
   - User B: books User A's tool (from the Home page → Tool Details page)
   - User A: sees the request on My Tools → Incoming Requests section
   - User A: approves/rejects/completes the booking

7. **Test by:**
   - Navigate to `/add-tool`, fill the form, submit
   - Navigate to `/my-tools`, verify the tool appears in "My Listed Tools"
   - Click delete, verify it's removed
   - Log in as User B, book User A's tool
   - Log back in as User A, check "Incoming Requests" section
   - Approve a request → status changes to APPROVED
   - Mark completed → status changes to COMPLETED

---

## 6. Quick Reference — File Locations

```
lendit-frontend/src/
├── api/
│   └── api.js              ← DON'T MODIFY (has addTool, getMyTools, deleteTool,
│                               getCategories, getMyToolBookings, updateBookingStatus)
├── components/
│   └── ToolCard.jsx         ← REUSE in MyToolsPage (Section 1)
├── context/
│   └── AuthContext.jsx      ← DON'T MODIFY (use useAuth() for user info)
├── pages/
│   ├── AddToolPage.jsx      ← YOUR FILE — implement the add tool form
│   └── MyToolsPage.jsx      ← YOUR FILE — tool listing + delete + incoming requests
└── App.css                  ← DON'T MODIFY (CSS classes are ready for you)
```
