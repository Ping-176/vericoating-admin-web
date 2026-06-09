# Vericoating Admin Web Phase 1 PRD

## 1. Background

`vericoating-admin-web` is an independent admin system for the Vericoating / TUBO MATERIALS product catalog and sample request workflow.

The public website already reads product catalog data from Supabase. Phase 1 of the admin system focuses on letting internal administrators manage catalog content and incoming sample requests without changing the current product assets or document storage strategy.

## 2. Confirmed Scope

### In Scope

- Admin login
- Admin-only access control
- Chinese / English bilingual admin UI
- Dashboard
- Product management
- Dimension management
- Sample request management
- One admin role only
- Next.js + TypeScript + Tailwind CSS
- Visual style aligned with `vericoating-web`

### Out of Scope

- Bulk order management
- Payment gateway integration
- Logistics management
- Proforma invoice management
- Product image migration to Supabase Storage
- TDS / MSDS file migration to Supabase Storage
- Multi-role permissions
- Customer-facing account center

## 3. Tech Direction

### Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgREST / Supabase client
- lucide-react icons

### Suggested Route Structure

```txt
/[locale]/login
/[locale]/dashboard
/[locale]/products
/[locale]/products/new
/[locale]/products/[id]
/[locale]/dimensions
/[locale]/sample-requests
/[locale]/sample-requests/[id]
```

### Locale Strategy

- Supported locales: `zh`, `en`
- Default locale: `zh`
- URL-based locale is preferred for clarity and shareable links.
- Admin labels, menu text, buttons, status labels, validation messages, and empty states should all be localized.
- Product business data remains bilingual through existing database fields such as `name_en`, `name_zh`, `intro_en`, `intro_zh`.

## 4. Visual Direction

The admin UI should feel like an internal B2B operations tool, not a marketing page.

### Color Tokens

| Token | Value | Usage |
| --- | --- | --- |
| Primary | `#233F0F` | Sidebar, primary buttons, table header, active navigation |
| Accent | `#a7c72a` | Focus ring, highlights, active status, KPI accent |
| Accent Deep | `#4f6f12` | Secondary emphasis |
| Text Strong | `#182019` | Main text |
| Text Muted | `#636c64` | Secondary text |
| Border | `#dde1d8` | Table/card/input borders |
| Surface | `#ffffff` | Panels and forms |
| Page Background | `#f6f7f4` | Main app background |

### Layout Pattern

- Left sidebar navigation
- Top bar with current page title, locale switch, admin account menu
- Main content optimized for tables and forms
- 6px / 8px border radius
- Compact, scannable tables
- Drawer or detail page for secondary editing flows

## 5. Access Control

### Login Flow

1. Admin opens `/zh/login` or `/en/login`.
2. Admin signs in with email and password through Supabase Auth.
3. App fetches the user's `profiles` row.
4. If `profiles.role = 'admin'`, redirect to dashboard.
5. If user is not admin, show a no-access screen and allow logout.
6. If unauthenticated user visits protected routes, redirect to login.

### Permission Rule

Only users with `profiles.role = 'admin'` can access admin pages and mutate catalog/sample request data.

## 6. Dashboard

### Purpose

Give admins a quick operational overview.

### Cards

- Total products
- Published products
- Draft products
- Archived products
- Sample-enabled products
- New sample requests
- Sample requests under technical review
- Recently updated products

### Tables / Lists

- Latest sample requests
- Products missing important documents
- Recently changed products

### Acceptance Criteria

- Admin can understand catalog and sample request status within one screen.
- Dashboard numbers match Supabase data.
- Empty states are localized.

## 7. Product Management

### Source Tables

- `products`
- `product_images`
- `product_performance`
- `product_documents`
- `product_sample_specs`
- `categories`
- `applications`
- `finishes`
- `glosses`

### Product List

#### Filters

- Search by product ID, slug, English name, Chinese name, model
- Status: draft / published / archived
- Category
- Application
- Finish
- Gloss
- Sample available

#### Columns

- Main image
- Product ID (`legacy_id`)
- English name
- Chinese name
- Category
- Application
- Finish
- Gloss
- Sample status
- Publish status
- Sort
- Updated time
- Actions

#### Row Actions

- Edit
- Preview public product link
- Duplicate product, optional for later
- Archive / restore

### Product Edit Form

#### Section: Basic

- `legacy_id`
- `slug`
- `name_en`
- `name_zh`
- `intro_en`
- `intro_zh`
- `description_en`
- `description_zh`
- `price_usd`
- `model`
- `moq`
- `curing_schedule`
- `status`
- `sort`

#### Section: Dimensions

- `category_id`
- `application_id`
- `finish_id`
- `gloss_id`

#### Section: Sample Settings

- `sample_available`
- `sample_fee_usd`
- `sample_fee_deductible`
- `sample_lead_time`
- `sample_status`
- `unavailable_reason`
- sample specs from `product_sample_specs`

#### Section: Images

- Manage `product_images.url`
- Manage image slot and sort
- No upload in Phase 1
- Existing `/assets/...` paths remain valid

#### Section: Performance

- Manage rows in `product_performance`
- Fields: test item, standard method, test index, sort

#### Section: Documents

- Manage rows in `product_documents`
- Fields: document type, label, file URL, sort
- No Storage migration in Phase 1

#### Section: Advanced

- Structured editing for common `basic_info` keys where practical
- Structured editing for `packaging_delivery`
- JSON editor can be provided as an advanced fallback

### Product Validation

- `legacy_id` required and unique
- `slug` required and unique
- `name_en` required
- `price_usd` must be numeric when present
- `sample_fee_usd` must be numeric
- status must be draft / published / archived
- image slot should be 1 to 4

### Acceptance Criteria

- Admin can create, edit, publish, archive, and restore products.
- Product changes are reflected on the public website after cache revalidation interval.
- Child rows can be edited without orphaned records.
- Product list is usable on desktop and tablet widths.

## 8. Dimension Management

### Source Tables

- `categories`
- `applications`
- `finishes`
- `glosses`

### UI Pattern

One page with tabs:

- Categories
- Applications
- Finishes
- Glosses

### Fields

- `code`
- `name_en`
- `name_zh`
- `sort`

### Actions

- Create dimension
- Edit dimension
- Delete dimension
- Reorder by `sort`

### Validation

- `code` required and unique per dimension table
- `name_en` required
- `sort` must be integer

### Acceptance Criteria

- Admin can manage all four dimension types from one page.
- Product forms always use latest dimension options.
- Deleting a dimension does not delete products; related product foreign keys are set to null by existing database rules.

## 9. Sample Request Management

### Current State

The current Supabase schema does not yet contain a sample request table. Phase 1 requires adding one table for sample request records.

### Suggested Workflow

```txt
new -> technical_review -> preparing_sample -> dispatched -> completed
```

Alternative terminal status:

```txt
cancelled
```

### Sample Request List

#### Filters

- Search by request number, company, contact, email, product name
- Status
- Product
- Country
- Created date range

#### Columns

- Request number
- Product
- Company
- Contact
- Email
- Country
- Sample spec
- Status
- Created time
- Updated time
- Actions

### Sample Request Detail

#### Read-only Customer Fields

- Product
- Company
- Contact name
- Email
- Country
- Phone
- Address
- Sample spec
- Usage
- Courier
- Testing conditions
- Notes
- Created time

#### Editable Admin Fields

- Status
- Admin note

### Acceptance Criteria

- Admin can view all sample requests.
- Admin can update request status.
- Admin can add internal notes.
- Sample request records are protected from public reads unless explicitly needed later.

## 10. Data Model Change Design

### New Table: `sample_requests`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | uuid | yes | Primary key |
| `request_no` | text | yes | Human-readable unique request number, e.g. `SR-20260609-0001` |
| `product_id` | uuid | yes | FK to `products.id` |
| `user_id` | uuid | no | FK to `auth.users.id`, nullable for guest/front-end forms if needed |
| `company` | text | yes | Customer company |
| `contact_name` | text | yes | Contact person |
| `email` | text | yes | Contact email |
| `country` | text | no | Country/region |
| `phone` | text | no | Phone/WhatsApp |
| `address` | text | no | Shipping or contact address |
| `sample_spec` | text | no | Requested spec, e.g. `1kg`, `5kg` |
| `usage` | text | no | Intended application |
| `courier` | text | no | Preferred courier |
| `testing_conditions` | text | no | Testing/application conditions |
| `notes` | text | no | Customer notes |
| `status` | text | yes | See status values below |
| `admin_note` | text | no | Internal admin note |
| `created_at` | timestamptz | yes | Default now |
| `updated_at` | timestamptz | yes | Auto-updated |

### Status Values

| Status | Meaning |
| --- | --- |
| `new` | Newly submitted |
| `technical_review` | Under technical review |
| `preparing_sample` | Sample is being prepared |
| `dispatched` | Sample has been dispatched |
| `completed` | Request completed |
| `cancelled` | Request cancelled |

### Suggested Indexes

- `request_no`
- `product_id`
- `user_id`
- `status`
- `created_at`
- `email`

### Suggested RLS

| Actor | Permission |
| --- | --- |
| anon | insert only, if public sample forms should submit without login |
| authenticated customer | insert own request and optionally select own requests |
| admin | select / insert / update / delete all |

For the admin project itself, only admin access is required. The public website integration can decide whether sample forms require login or allow anonymous inserts.

### Suggested Grants

- Grant admin users full table access through RLS.
- If public sample request submission is enabled, grant `insert` to `anon`.
- If authenticated users can view their own requests, grant `select` and `insert` to `authenticated`.

## 11. Supabase Interface Requirements

### Existing Product Read

The public site currently uses product reads with nested relations and `status = published`.

The admin app needs broader access:

- Read all product statuses
- Insert products
- Update products
- Delete or archive products
- Manage child rows
- Manage dimensions
- Manage sample requests

### Environment Variables

Expected admin app environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Service role keys should not be used in browser code.

## 12. Navigation

### Sidebar Items

- Dashboard
- Products
- Dimensions
- Sample Requests

### Account Menu

- Current admin email
- Language switch
- Logout

## 13. Implementation Milestones

### Milestone 1: Project Setup

- Create Next.js + TypeScript + Tailwind project
- Add locale route structure
- Add design tokens
- Add base layout

### Milestone 2: Auth

- Supabase client setup
- Login page
- Protected routes
- Admin role check
- Logout

### Milestone 3: Product Management

- Product list
- Product detail/edit
- Child table editing
- Dimension selectors

### Milestone 4: Dimension Management

- Four dimension tabs
- CRUD forms
- Sorting

### Milestone 5: Sample Requests

- Supabase migration for `sample_requests`
- Sample request list
- Sample request detail
- Status updates
- Admin notes

### Milestone 6: QA

- Bilingual UI review
- RLS verification
- Form validation
- Desktop/tablet/mobile layout check
- Public website product data compatibility check

## 14. Open Decisions

- Should sample request submission be anonymous or login-required on the public website?
- Should admins hard-delete products, or should delete be replaced with archive only?
- Should product duplication be included in Phase 1 or reserved for Phase 2?
- Should sample request numbers be generated by database trigger or application logic?
- Should dashboard include public website preview links for products?

## 15. Phase 1 Definition of Done

- Admin can log in and access protected pages.
- Non-admin users cannot access admin pages.
- Admin can manage product catalog data used by the public website.
- Admin can manage catalog dimensions.
- Admin can view and process sample requests.
- UI is available in Chinese and English.
- Visual style matches Vericoating brand colors.
- No product assets or documents are migrated to Storage.
- No bulk order, payment, logistics, or PI functionality is included.
