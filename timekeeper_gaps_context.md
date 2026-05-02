# Development Context: Timekeeper App (Supabase Integration)

## 1. Project Status Summary
We have successfully migrated the core infrastructure from a Mock-based system to a live **Supabase** backend. The authentication flow, schema synchronization, and client factory logic are now operational. The application uses a custom store (Zustand-like pattern) for state management.

## 2. Technical Foundation
- **Backend:** Supabase (Auth, PostgreSQL, Realtime).
- **Frontend:** React + Vite + TypeScript.
- **Client Logic:** `createTimekeeperClient` acts as the bridge.
- **Current State:** The app bootstraps correctly, but several UI components are still consuming hardcoded "Mock" values or lack functional event handlers.

## 3. High-Priority Gaps for Implementation

### A. Home Screen & Focus Logic
- **Dynamic Profile:** Replace static "Munene, 8yrs" and hardcoded Streaks/Stars with real data from the `kids` table.
- **Connection Awareness:** Implement a check for laptop connectivity status before enabling/disabling "Focus" blocks.

### B. Scheduling System (Critical)
- **Routine Management:**
    - Implement the ability to create, delete, and list Routines.
    - Add "Preset Routines" (e.g., Morning Routine, Homework Time).
    - **Constraint:** Block task creation if no routine is active.
- **Task Management:** Implement adding and deleting tasks.
- **UI/UX:**
    - Make '+New' and 'Add Task' buttons larger/more accessible.
    - Ensure modals (`addTask`, `addRoutine`) close automatically on success.
    - Make the date header dynamic to show the current day.

### C. Insights & Rewards
- **Data Hydration:** Replace mock data in the Insights dashboard and Rewards page with live database queries.
- **Actions:** Fix the "Export" button on Insights and the "+New" button on the Rewards page.

### D. Settings & Alerts
- **Persistence:** Allow users to change "Quiet Hours" and ensure settings persist to the database.
- **Connectivity:** Implement the "Pair device" button logic.
- **Dynamic Rules:** Ensure alert rules (like "Miss-rule") update in real-time when settings are modified.

## 4. Prompt for Implementation
> "Using the provided context, please implement the missing logic for the **Schedule Screen** and **Home Screen**. 
> 
> 1. Update the **Home Screen** to fetch and display the actual kid's name, age, and streak data from Supabase.
> 2. On the **Schedule Screen**, implement the CRUD logic for Routines and Tasks using the `createTimekeeperClient`. Ensure the '+New' and 'Add Task' buttons are enlarged, modals self-close on save, and a 'Delete' option is added for both.
> 3. Implement a check to ensure a routine exists before a task can be added.
> 4. Ensure all state updates are reflected in the custom store."
