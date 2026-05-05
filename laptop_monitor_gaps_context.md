### 1\. Security \& Enforcement Gaps

* Overlay Bypass: The current lockscreen (index.html) is a standard window with alwaysOnTop: true. It lacks "Kiosk Mode" or global shortcut intercepting, allowing users to minimize or bypass it using system keys (e.g., Win+D, Alt+Tab, Ctrl+Alt+Del).

* Immediate Unlock Loophole: The requestUnlock function in main.ts clears the local block state and drops the overlay immediately upon sending the request, rather than waiting for a caregiver's "Grant" response.

* Process Protection: There is no logic to prevent the child from simply closing the app via Task Manager or Activity Monitor to stop all tracking and blocking. This could be implemented by password-protection, as an example



### 2\. Communication \& Reliability Gaps

* Offline Data Loss: If the laptop loses Wi-Fi, pushHeartbeat logs an error to the console but does not queue the focus data to be sent later. This results in "blind spots" in the caregiver's reports.

* Passivity in System Events: System events like suspend or lock-screen only log to the console. They do not trigger an immediate status update to the cloud, causing a delay in the caregiver app reflecting the device's true state.

* Disruptive Unpairing: The unpair function triggers a full app.relaunch(), which is a heavy-handed user experience compared to a dynamic UI state reset.



### 3\. Monitoring \& Classification Gaps



* Fragile App Matching: The checkAppBlock logic uses a simple string includes() check on the app name. This is easily bypassed by renaming executables or folders (e.g., renaming Roblox.exe to Calculator.exe).

* *Missing Classification Engine: The UI displays categories (e.g., "Game", "Social"), but main.ts lacks the logic or database to map process names to these categories. Currently, it relies on the watcher to provide this data, which is undefined.

* Hardcoded Fallbacks: Multiple areas, including the Tray Menu and lock\_screen commands, fall back to hardcoded strings like "Brush Teeth" or "Focus Time" instead of dynamically syncing with the caregiver's active routine.



### 4\. UI \& Pairing Gaps

* Missing Assets: The main.ts code includes a fallback to a 16x16 solid square if the tray icons (tray-grey.png, tray-green.png) are missing from the assets folder.

* Settings.tsx (Settings Screen in the caregiver app): Verify logic flow for connection to the watch


