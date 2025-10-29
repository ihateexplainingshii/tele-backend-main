### **High-Priority Missing Endpoints (Essential for Core UX)**

1.  **GET a single Appointment, Doctor, or Receptionist by ID.**
    *   **Missing:** You have `GET /appointments` (list all) but no `GET /appointments/{id}` to view the details of a single appointment. The same applies to doctors and receptionists.
    *   **Why it's needed:** A user will often click on an item in a list (like an upcoming appointment) to see a dedicated "Details" page. This requires an endpoint to fetch the full data for that specific item.
    *   **Proposed Endpoints:**
        *   `GET /api/v1/appointments/{id}`
        *   `GET /api/v1/doctors/{id}`
        *   `GET /api/v1/receptionists/{id}`

2.  **DELETE Receptionist.**
    *   **Missing:** You can add a receptionist (`POST /receptionists`) but there is no corresponding `DELETE /receptionists/{id}`.
    *   **Why it's needed:** A Hospital Admin needs the ability to remove staff members who no longer work at the hospital.
    *   **Proposed Endpoint:**
        *   `DELETE /api/v1/receptionists/{id}`

3.  **Endpoint to get data for booking forms (e.g., list of doctors by specialization).**
    *   **Missing:** The `GET /doctors` endpoint is good, but for booking an appointment, a patient needs a streamlined way to find the right doctor. They might select a hospital, then a specialization, and *then* see a list of available doctors.
    *   **Why it's needed:** The frontend booking form will feel slow and clunky if it has to download the entire list of *all* doctors in the country just to filter them client-side.
    *   **Proposed Improvement:** Ensure the existing `GET /doctors` endpoint has robust filtering capabilities that can be chained together. For example: `GET /doctors?hospitalId=...&specialization=...`

---

### **Medium-Priority Missing Endpoints (Important for a Polished Experience)**

4.  **DELETE Patient.**
    *   **Missing:** There is no way for a Hospital Admin to remove a patient record from their hospital.
    *   **Why it's needed:** For data privacy (GDPR-style "right to be forgotten") or cleaning up records, an admin needs a way to disassociate a patient from their hospital. This typically wouldn't delete the `User` account but would delete the `Patient` profile.
    *   **Proposed Endpoint:**
        *   `DELETE /api/v1/patients/{id}`

5.  **A "Forgot Password" / "Reset Password" Flow.**
    *   **Missing:** There is no functionality for users who have forgotten their password. This is a standard feature in any modern application.
    *   **Why it's needed:** Without it, users who forget their password are permanently locked out unless they contact support, which is a poor user experience.
    *   **Proposed Endpoints:**
        *   `POST /api/v1/auth/forgot-password` (User submits their email).
        *   `POST /api/v1/auth/reset-password` (User submits a token from the reset email along with their new password).

6.  **Endpoint to change the current user's password.**
    *   **Missing:** An authenticated user has no way to change their own password from a "Settings" or "Profile" page.
    *   **Why it's needed:** This is a basic security feature that users expect.
    *   **Proposed Endpoint:**
        *   `PATCH /api/v1/auth/change-password`

7.  **Endpoint for file uploads (Profile Pictures).**
    *   **Missing:** The current `PATCH` endpoints for users/doctors/patients only handle JSON data. There's no dedicated endpoint to handle multipart/form-data for file uploads.
    *   **Why it's needed:** To allow users to upload profile pictures, or patients to upload documents (like lab results).
    *   **Proposed Endpoint:**
        *   `POST /api/v1/users/{id}/avatar` (or similar, like `PATCH /patients/{id}/profile-picture`)

---

### **Low-Priority / "Nice-to-Have" Endpoints**

8.  **Resend Verification/Invitation Email.**
    *   **Missing:** If an invitation email is lost or expires, there's no way for an admin to resend it.
    *   **Why it's needed:** Improves the admin UX by preventing them from having to delete and re-create an invitation.
    *   **Proposed Endpoint:**
        *   `POST /api/v1/users/resend-invite`

### **Summary Table of Recommendations**

| Priority | Proposed Endpoint                             | User Role(s)                | Description                                        |
| :------- | :-------------------------------------------- | :-------------------------- | :------------------------------------------------- |
| **High** | `GET /appointments/{id}`                      | Patient, Doctor, Receptionist | Get details of a single appointment.             |
| **High** | `GET /doctors/{id}`                           | All Authenticated           | Get details of a single doctor profile.            |
| **High** | `GET /receptionists/{id}`                     | Hospital Admin              | Get details of a single receptionist profile.      |
| **High** | `DELETE /receptionists/{id}`                  | Hospital Admin              | Remove a receptionist from a hospital.             |
| Med      | `DELETE /patients/{id}`                       | Hospital Admin              | Remove a patient from a hospital.                  |
| Med      | `POST /auth/forgot-password`                  | Public                      | Initiate the password reset process.               |
| Med      | `POST /auth/reset-password`                   | Public (with token)         | Set a new password using a reset token.            |
| Med      | `PATCH /auth/change-password`                 | All Authenticated           | Change the current user's password.                |
| Med      | `POST /users/{id}/avatar`                     | User, Admin                 | Upload a profile picture.                          |
| Low      | `POST /users/resend-invite`                   | Admin, Hospital Admin       | Resend an expired or lost invitation email.        |
Explain
