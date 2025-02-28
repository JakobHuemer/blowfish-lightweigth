---
title: Userstories
description: Userstories
authors:
  - jakob
---

# 2. **As a Helper, I want to browse open tasks so that I can find work opportunities and earn money.**

**Tasks:**

- Create the database structure for storing tasks.
- Implement backend logic to retrieve open tasks from the database.
- Create a UI to display a list of open tasks with summary details.
- Add a button for viewing full task details.

---

# 3. **As a Helper, I want to view detailed information about a task so that I can decide whether to apply.**

**Tasks:**

- Implement backend logic to retrieve full details for a specific task.
- Create a task details UI that shows the title, description, payment, and location.
- Connect the task details UI to the task list so that clicking a task opens its details view.

---

# 4. **As a Helper, I want to apply for a task so that I can offer my assistance.**

**Tasks:**

- Add an "Apply" button to the task details view.
- When the helper clicks "Apply," store their application in the database.
- Automatically create a chat session between the helper and the client upon application.
- Ensure the chat session remains active until the task is completed or the helper is rejected.
- Prevent multiple applications for the same task by the same user.
- Notify the client of the new application and active chat session.

---

# 5. **As a Client, I want to see all applicants for my task so that I can choose the best helper.**

**Tasks:**

- Implement backend logic to retrieve all applicants for a task.
- Create a UI in the task management dashboard to display a list of applicants.
- Display summary info for each applicant (name, rating, etc.).
- Add a button to view detailed application info if needed.

---

# 6. **As a Client, I want to chat with applicants so that I can discuss task details and assess their suitability.**

**Tasks:**

- Implement backend logic for sending and retrieving chat messages.
- Create a UI for real-time chat within the task details view.
- Ensure the chat session is active from the moment of application until the task is completed or the helper is rejected.
- Display the chat history in the task view.

---

# 7. **As a Client, I want to accept or reject an applicant so that I can select the best helper for my task.**

**Tasks:**

- Implement backend logic for accepting or rejecting a helper’s application.
- Add "Accept" and "Reject" buttons within the “See Task Applicants” UI.
- When a helper is accepted, automatically mark all other pending applications (and their chat sessions) as rejected.
- Update the accepted chat session to indicate that the helper is now confirmed.
- Notify the helper of the acceptance or rejection decision.

---

# 8. **As a Helper, I want to confirm or decline an accepted task so that I can finalize my commitment.**

**Tasks:**

- Notify the helper that their application has been accepted by the client.
- Present "Accept Task" and "Decline Task" buttons in the chat or task details view.
- Implement backend logic to finalize task acceptance when the helper clicks "Accept Task."
- If the helper declines, mark the chat session as closed and notify the client immediately.
- Ensure the chat remains active until the task is completed or explicitly closed.

---

# 9. **As a Client, I want to manage my tasks so that I can monitor their status and update details if necessary.**

**Tasks:**

- Create a "Manage Tasks" UI/dashboard listing all tasks created by the client.
- Implement backend logic to retrieve a client’s tasks.
- Allow selection of a task to view its details.
- Add a "Close Task" button to mark a task as completed.

---

# 10. **As a Client, I want to update a task before selecting a helper so that I can modify task details as needed.**

**Tasks:**

- Allow the client to select a task from the "Manage Tasks" dashboard.
- Implement backend logic to update a task’s title, description, and other details.
- Create a UI for editing a task.
- Prevent editing once an applicant has been accepted.

---

# 11. **As a Helper, I want to view the tasks I have applied for so that I can track my application status.**

**Tasks:**

- Display a list of tasks the helper has applied for.
- Implement backend logic to fetch applied task data.
- Show the current application status (Pending, Accepted, Rejected) for each task.

---

# 12. **As a Helper, I want to cancel my application at any time so that I can withdraw if my circumstances change.**

**Tasks:**

- Implement a "Cancel Application" button in the task details or application view.
- Update the application status in the database upon cancellation.
- Notify the client that the helper has canceled their application.
- Close the associated chat session when the application is canceled.

---

# 13. **As a Client, I want to rate the helper after task completion so that I can provide feedback on their work.**

**Tasks:**

- Implement a rating system for helpers.
- Create a UI element for leaving a rating on the task details or completion view.
- Store the rating in the database.
- Update the helper’s profile with the new rating.

---

# 14. **As a Helper, I want to rate the client after task completion so that I can provide feedback on the experience.**

**Tasks:**

- Implement a rating system for clients.
- Create a UI element for leaving a rating on the task details or completion view.
- Store the rating in the database.
- Update the client’s profile with the new rating.

---

# 15. **As a User, I want to view my rating history so that I can track my performance and feedback over time.**

**Tasks:**

- Display a list of received and given ratings on the user profile.
- Implement backend logic to fetch the rating history.
- Calculate and display the average rating.
- Create a UI for viewing detailed rating history.

---

# 16. **As a Helper, I want to view my history of completed tasks so that I can keep track of my work experience.**

**Tasks:**

- Display a list of completed tasks for the helper.
- Implement backend logic to fetch completed task data.
- Show associated ratings and task details for each completed task.

---

# 17. **As a User, I want to register and log in so that I can securely access my account.**

**Tasks:**

- Create a user registration and login system.
- Implement secure password storage and session management.
- Provide password reset functionality.
- Validate user credentials against the PostgreSQL database.

---

# 18. **As a Developer, I want to deploy the application using Docker so that the system is easily reproducible and scalable.**

**Tasks:**

- Create Docker files for the JavaFX application.
- Configure Docker Compose (or Podman Compose) for the Java backend and PostgreSQL.
- Implement automated database migrations on startup.
- Package the application for deployment via Docker.

---

# 19. **As a User, I want a smooth and responsive UI so that I can navigate the platform easily and without delays.**

**Tasks:**

- Design and implement a responsive UI layout for all screens.
- Ensure proper error handling and loading states.
- Optimize performance for quick user interactions.
- Test the UI across different devices and screen sizes.
