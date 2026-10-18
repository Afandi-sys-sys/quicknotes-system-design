# QuickNotes System Design

## 1. Project Description

QuickNotes is a simple web-based note-taking application that demonstrates how a frontend communicates with a REST API.

The application allows users to load notes from an API, create new notes, and delete notes. It uses HTML for structure, CSS for styling, and JavaScript for API requests and interactivity.

The project also includes documentation describing a proposed production REST API, relational database design, and scalable system architecture.

## 2. Technologies Used

- HTML5
- CSS3
- JavaScript (async/await and Fetch API)
- JSONPlaceholder practice API
- PostgreSQL for the proposed database design
- Git and GitHub for version control

## 3. Features

- Load up to 10 sample posts using a GET request.
- Create notes using a POST request.
- Delete notes using a DELETE request.
- Display loading, success, error, and empty states.
- Validate note titles and limit them to 100 characters.
- Disable relevant buttons while requests are running.
- Display returned content safely using `textContent`.
- Provide responsive styling for smaller screens.

## 4. How to Run the Application

### Requirements

- A modern web browser.
- An internet connection.
- A code editor such as Visual Studio Code or Antigravity.
- An optional local development server, such as the VS Code Live Server extension.

### Steps

1. Clone or download this repository.
2. Open the project folder in your code editor.
3. Start a local development server, or open `index.html` in your browser.
4. Click **Load notes** to retrieve sample posts.
5. Enter a title and optional body, then click **Create note**.
6. Click **Delete** to remove a note from the current displayed list.

The application uses the following practice API:

`https://jsonplaceholder.typicode.com/posts`

An internet connection is required for API requests.

## 5. Important API Limitation

JSONPlaceholder is a testing API. It simulates creating and deleting posts but does not permanently save these changes on its server.

Consequently, a newly created post may disappear after refreshing the page, and deleted sample posts may reappear when the application loads the original server data again.

This application demonstrates API request handling; it does not provide permanent note storage.

## 6. Project Documentation

The project includes three design documents:

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, authentication, validation, and error handling.
- [Data Model](docs/data-model.md) — Database tables, relationships, SQL statements, indexes, and the SQL versus NoSQL decision.
- [System Architecture](docs/architecture.md) — Functional and non-functional requirements, architecture diagram, capacity estimates, request flows, and architectural trade-offs.

## 7. What I Learned

Through this project, I learned how to:

1. Use the Fetch API and async/await to send HTTP requests and handle responses.
2. Use GET, POST, and DELETE methods when interacting with a REST API.
3. Handle loading, success, empty, and error states in a web application.
4. Validate user input and use `textContent` to display content safely.
5. Design REST API endpoints with appropriate HTTP status codes and JSON structures.
6. Model relational data using primary keys, foreign keys, constraints, and many-to-many relationships.
7. Estimate application traffic and storage requirements for a growing user base.
8. Use Git and GitHub to track changes and maintain project history.

## 8. Future Improvements

- Connect the application to a real backend and persistent database.
- Add user registration and authentication.
- Allow users to edit notes.
- Add note search and tag management.
- Add automated tests for API requests and validation.
- Deploy the application so that it can be accessed online.

## 9. Author

Created as a learning project to practise API integration, database design, system architecture, and version control.
