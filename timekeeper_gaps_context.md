# Development Context: Timekeeper App (Supabase Integration) - v2

## 1. Project Status Summary
The migration from Mock-based systems to a live **Supabase** backend is progressing. Core authentication, schema synchronization, and client factory logic are operational. Recent updates have successfully transitioned the **Home Screen** and **Schedule Screen** to dynamic data.

## 2. Technical Foundation
- **Backend:** Supabase (Auth, PostgreSQL, Realtime).
- **Frontend:** React + Vite + TypeScript.
- **Client Logic:** `createTimekeeperClient` acts as the bridge.
- **State Management:** Custom store (Zustand-like pattern).

## 3. Completed Implementations
- **Dynamic Home Screen:** The profile section now fetches and displays real-time kid names, ages, and streak data from the database.
- **Functional Scheduling:** The Schedule Screen now supports CRUD operations for Routines and Tasks. Date headers are dynamic, buttons have been resized for accessibility, and modals self-close upon successful actions.

## 4. Remaining High-Priority Gaps

### A. Focus Logic & Connection
- **Connection Awareness:** Implement a functional check for laptop connectivity status before enabling/disabling "Focus" blocks.

### B. Scheduling System Refinements
- **Preset Routines:** Add logic for "Preset Routines" (e.g., Morning Routine, Homework Time) to the creation flow.
- **Validation:** Enforce the constraint to block task creation if no routine is currently active.

### C. Insights & Rewards
- **Data Hydration:** Replace mock data in the Insights dashboard and Rewards page with live database queries.
- **Actions:** Fix the "Export" button on Insights and the "+New" button on the Rewards page.

### D. Settings & Alerts
- **Persistence:** Allow users to change "Quiet Hours" and ensure settings persist to the database.
- **Device Pairing:** Implement "Pair device" logic. **New Requirement:** The system must distinguish between device types (specifically **Watch** vs. **Laptop**) during the pairing process.
- **Dynamic Rules:** Ensure alert rules (like "Miss-rule") update in real-time when settings are modified.

## 5. Prompt for Implementation
> "Using the provided context, please implement the remaining missing logic for the **Insights**, **Rewards**, and **Settings** screens.
>
> 1. **Insights & Rewards:** Replace all remaining mock data with live queries from Supabase. Enable functional 'Export' (Insights) and '+New' (Rewards) buttons.
> 2. **Settings Persistence:** Implement database persistence for 'Quiet Hours' and ensure real-time updates for alert rules.
> 3. **Device Pairing:** Implement the 'Pair new device' workflow. Ensure the logic can distinguish and store the device type specifically as either a 'Watch' or a 'Laptop'.
> 4. **Logic Guards:** Implement a check to ensure a routine exists before allowing task additions and implement connection awareness for laptop-dependent Focus blocks.
> 5. **State Sync:** Ensure all remaining UI interactions correctly update the custom store and reflect the live database state."
