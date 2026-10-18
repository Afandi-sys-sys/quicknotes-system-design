# QuickNotes REST API Design

## 1. Overview

QuickNotes is a note-taking application that allows users to create, view, update, and delete notes. A production REST API would allow the frontend application to communicate with a backend server using HTTP methods and JSON data.

The API base URL is:

`https://api.quicknotes.example.com/v1`

The `.example.com` domain is a placeholder for documentation and is not a working production server.

## 2. REST API Endpoints

| HTTP Method | Endpoint         | Description                                    | Success Status |
| ----------- | ---------------- | ---------------------------------------------- | -------------- |
| POST        | `/auth/register` | Register a new user account.                   | 201 Created    |
| POST        | `/auth/login`    | Authenticate a user and start a session.       | 200 OK         |
| GET         | `/notes`         | Retrieve the authenticated user's notes.       | 200 OK         |
| GET         | `/notes/{id}`    | Retrieve one note by its ID.                   | 200 OK         |
| POST        | `/notes`         | Create a new note.                             | 201 Created    |
| PATCH       | `/notes/{id}`    | Update some fields of an existing note.        | 200 OK         |
| DELETE      | `/notes/{id}`    | Delete a note owned by the authenticated user. | 204 No Content |
| GET         | `/tags`          | Retrieve the user's tags.                      | 200 OK         |

## 3. Authentication and Authorization

Private endpoints require an authenticated user. The client sends an access token in the HTTP Authorization header:

`Authorization: Bearer <access-token>`

The server verifies the token and identifies the current user.

A user can only view, update, or delete notes that they own. Authentication identifies the user, while authorization determines whether that user has permission to perform an action.

## 4. Request and Response Examples

### 4.1 Create a note

**Request**

`POST /v1/notes`

Headers:

```http
Content-Type: application/json
Authorization: Bearer <access-token>
```

Request body:

```json
{
  "title": "My first note",
  "body": "Learning how REST APIs work."
}
```

**Successful response**

Status: `201 Created`

```json
{
  "id": 101,
  "userId": 25,
  "title": "My first note",
  "body": "Learning how REST APIs work.",
  "createdAt": "2026-10-18T10:30:00Z",
  "updatedAt": "2026-10-18T10:30:00Z"
}
```

The server creates the note, assigns its ID, associates it with the authenticated user, and returns the saved resource.

### 4.2 List notes

**Request**

`GET /v1/notes?limit=10&offset=0`

Headers:

```http
Authorization: Bearer <access-token>
```

**Successful response**

Status: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "userId": 25,
      "title": "My first note",
      "body": "Learning how REST APIs work.",
      "createdAt": "2026-10-18T10:30:00Z",
      "updatedAt": "2026-10-18T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

The `data` array contains the returned notes. The `pagination` object helps the client retrieve additional notes when needed.

## 5. Error Handling

The API uses appropriate HTTP status codes to communicate failures.

| Status                    | Meaning                                         | Example                                          |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| 400 Bad Request           | The request contains invalid data.              | A note title is missing.                         |
| 401 Unauthorized          | Authentication is missing or invalid.           | An expired access token is supplied.             |
| 403 Forbidden             | The user is authenticated but lacks permission. | A user attempts to access a restricted resource. |
| 404 Not Found             | The requested resource does not exist.          | A note ID cannot be found.                       |
| 500 Internal Server Error | An unexpected server error occurred.            | The server fails while processing a request.     |

### Example error response

Status: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "message": "Title is required."
      }
    ]
  }
}
```

Error responses use a consistent JSON structure so that the frontend can display useful messages.

## 6. Validation and Security

- Note titles are required and must not exceed 100 characters.
- Request bodies must contain valid JSON.
- The server validates all incoming data; frontend validation alone is insufficient.
- Private endpoints require authentication.
- Users can only modify notes they own.
- The API uses HTTPS to encrypt data in transit.
- The server applies request-size limits and rate limiting to reduce abuse.
- Error responses avoid exposing passwords, access tokens, or sensitive server details.

## 7. Relationship to the Practice Client

The assignment's frontend uses JSONPlaceholder:

`https://jsonplaceholder.typicode.com/posts`

It retrieves sample posts and demonstrates GET, POST, and DELETE requests. The production endpoints documented above describe a proposed QuickNotes backend; they are not implemented by JSONPlaceholder.

JSONPlaceholder simulates creating and deleting resources without permanently storing those changes. The frontend must therefore not assume that its POST and DELETE operations persist after a page refresh.
