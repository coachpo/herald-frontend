# Shadcn/UI Adoption Plan

## 1. Goal
Replace custom Tailwind CSS classes with standard [shadcn/ui](https://ui.shadcn.com/) components to improve UI consistency, accessibility, and maintainability while preserving existing backend integration and theme logic.

## 2. Configuration & Setup

### `tailwind.config.ts`
- **Action:** Ensure configuration includes `tailwindcss-animate` plugin.
- **Theme:** Extend the theme to map shadcn's CSS variables (`--radius`, `--popover`, etc.) to the existing design tokens or defaults.
- **Path:** `frontend/tailwind.config.ts` (needs creation/update).

### `globals.css`
- **Action:** Add required shadcn CSS variables to `:root` and `.dark` blocks.
- **Keep:** Existing `data-theme` attribute logic for light/dark mode switching.
- **Add:** `--radius` variable (suggest `0.5rem` to match existing rounded-xl/2xl look).

## 3. Component Mapping & Strategy

### A. Authentication Pages
**Target Files:** `frontend/app/(auth)/*`, `frontend/components/LoginForm.tsx`

| Existing Element | Shadcn Component | Notes |
| :--- | :--- | :--- |
| Container Box | `Card` | Use `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. |
| Email/Password Input | `Input` | Standardize focus rings and padding. |
| Labels | `Label` | Improve accessibility. |
| Submit Button | `Button` | Use `disabled={busy}` and add a spinner icon for loading state. |
| Error Alert | `Alert` | Variant `destructive` with `AlertTitle` and `AlertDescription`. |
| "Forgot Password" Link | `Button` | Variant `link` + `asChild` with Next.js `<Link>`. |

### B. App Shell & Navigation
**Target Files:** `frontend/components/AppShell.tsx`, `frontend/components/ThemeToggle.tsx`

| Existing Element | Shadcn Component | Notes |
| :--- | :--- | :--- |
| Header Container | `header` | Keep standard HTML, use standard border utility classes. |
| User Menu | `DropdownMenu` | Replace text/button combo. Triggers on email click. Options: "Account", "Log out". |
| Theme Toggle | `DropdownMenu` | Replace cycle button. Icons for Sun/Moon/System. |
| Nav Links | `Button` | Variant `ghost` (inactive) or `secondary` (active). `justify-start` for alignment. |
| Main Layout | `Resizable` (Optional) | Could use `ResizablePanel` for sidebar, but CSS Grid is fine for now. |

### C. Dashboard Home
**Target Files:** `frontend/app/(dashboard)/page.tsx`

| Existing Element | Shadcn Component | Notes |
| :--- | :--- | :--- |
| "Email not verified" | `Alert` | Variant `warning` (custom variant needed or use `default` with yellow styling). |
| Quick Action Cards | `Card` | Hover effects via `hover:bg-muted/50`. |
| "Getting started" | `Card` | Simple content card. |

### D. Messages Page
**Target Files:** `frontend/app/(dashboard)/messages/page.tsx`

| Existing Element | Shadcn Component | Notes |
| :--- | :--- | :--- |
| Search Bar | `Input` | Add search icon via `lucide-react`. |
| Endpoint Filter | `Select` | Replace native `<select>`. |
| Batch Delete | `Card` | Encapsulate the "danger zone". |
| "Delete" Confirm | `AlertDialog` | **Critical UX improvement** over immediate action. |
| Messages List | `Table` | **Major Change:** Switch from list divs to a proper `Table` component for better data density. |
| Status Indicators | `Badge` | Variants: `default` (sent), `destructive` (failed), `outline` (pending). |

### E. Ingest Endpoints Page
**Target Files:** `frontend/app/(dashboard)/ingest-endpoints/page.tsx`

| Existing Element | Shadcn Component | Notes |
| :--- | :--- | :--- |
| Create Input Group | `Input` + `Button` | Use `flex` gap. |
| "Created" Success | `Alert` | Variant `success` (custom) or `default` with green styling. |
| Copy Buttons | `Button` | Size `icon`, variant `ghost`. Tooltip for "Copy" label. |
| Endpoint List Items | `Card` | Small cards for each endpoint. |
| Revoke/Archive | `AlertDialog` | Prevent accidental revocation. |
| "Revoked" Tag | `Badge` | Variant `destructive`. |

### F. Rules Page
**Target Files:** `frontend/app/(dashboard)/rules/page.tsx`

| Existing Element | Shadcn Component | Notes |
| :--- | :--- | :--- |
| Create Rule Form | `Card` | Structure the complex form. |
| "Enabled" | `Switch` | Replace checkbox for clearer binary state. |
| Channel Select | `Select` | Better UX for dropdowns. |
| Ingest Endpoints | `ToggleGroup` | Multi-select buttons for endpoints. |
| Payload Template | `Textarea` | Standard component. |
| Rule Tester | `Card` | Separate section. |
| Test Results | `ScrollArea` | For large JSON payloads. |
| Delete Rule | `AlertDialog` | Confirmation dialog. |

### G. Shared/Utility
- **Toast Notifications:** Replace inline error/success messages with `Sonner` or `Toaster` for a cleaner UI.
- **Icons:** Standardize on `lucide-react` (standard with shadcn).

## 4. Components to Install
Run the following to initialize the library:

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card alert badge select dropdown-menu dialog alert-dialog table switch textarea toggle-group scroll-area tooltip separator
```

## 5. Phased Implementation Plan

1.  **Foundation:** Initialize shadcn, configure `globals.css` and `tailwind.config.ts`.
2.  **Phase 1 - Shell & Auth:** Implement `AppShell`, `ThemeToggle`, and `LoginForm`. These are isolated and high-impact.
3.  **Phase 2 - Core Primitives:** Update `DashboardPage` and simple shared components.
4.  **Phase 3 - CRUD Pages:** Refactor `IngestEndpoints` and `Rules`. Focus on replacing `window.confirm` with `AlertDialog`.
5.  **Phase 4 - Complex Data:** Refactor `MessagesPage` to use `Table` and advanced filtering.
