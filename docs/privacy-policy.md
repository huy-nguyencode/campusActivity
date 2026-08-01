# Privacy Policy

**Last updated: July 2026**

Campus Spots ("the app") is a crowd-tracking app for Temple University students. This privacy policy explains what data is collected, how it is used, and your rights.

---

## What We Collect

### Location Data
- The app requests access to your device's location **while the app is in use**.
- Your location is used on-device to detect nearby campus places.
- When you submit a check-in, your current coordinates and GPS accuracy are sent to our servers **only to verify you are near the place**. They are validated in memory and **not stored** in our database.
- Your precise location history is never retained.

### Anonymous Usage Data
- When you use the app, you are automatically signed in with an **anonymous account** via Firebase Authentication.
- This anonymous ID is used to record check-ins (e.g., "this place is busy") and enforce cooldown periods to prevent spam.
- Anonymous IDs are **not linked to your name, email, Apple ID, or any other personal information**.

### Check-In Data
- When you submit a check-in, the following is stored in our database:
  - Your anonymous user ID
  - The place you checked into
  - Your busy level rating (Not Busy / Moderate / Very Busy)
  - The timestamp of the check-in
- Check-in data is used solely to calculate crowd levels.
- Check-ins older than 90 minutes are automatically deleted by a scheduled cleanup job.

---

## What We Do NOT Collect

- Your name, email address, or any identifying information
- Your location history or movement patterns
- Device identifiers or advertising IDs
- Any data when the app is not in use

---

## Third-Party Services

The app uses the following third-party services, each with their own privacy practices:

- **Firebase (Google)** — database, authentication, and cloud functions. [Firebase Privacy Policy](https://firebase.google.com/support/privacy)
- **Expo** — app framework and build infrastructure. [Expo Privacy Policy](https://expo.dev/privacy)

---

## Data Retention

- Check-in records are retained for up to 90 minutes, then deleted.
- Cooldown records expire after 90 minutes and are cleaned up periodically.
- Anonymous auth IDs persist on your device until you clear app data; they are not linked to personal identity.

---

## Children's Privacy

This app is intended for university students (18+) and is not directed at children under 13. We do not knowingly collect data from children.

---

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/huy-nguyencode/campusActivity/issues
