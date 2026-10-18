# QuickNotes Data Model

## 1. Overview

QuickNotes is a note-taking application where users can create and organize notes using tags.

The database uses four main entities:

- **Users:** Stores account information.
- **Notes:** Stores the notes created by users.
- **Tags:** Stores labels that help users categorize notes.
- **Note_Tags:** Connects notes to tags through a many-to-many relationship.

The proposed database is PostgreSQL, a relational SQL database.

## 2. Database Tables

### 2.1 Users

The `users` table stores registered user accounts.

| Column        | Data Type    | Constraints                         | Description              |
| ------------- | ------------ | ----------------------------------- | ------------------------ |
| id            | BIGINT       | Primary key                         | Unique user identifier   |
| name          | VARCHAR(100) | NOT NULL                            | User's display name      |
| email         | VARCHAR(255) | NOT NULL, UNIQUE                    | User's email address     |
| password_hash | VARCHAR(255) | NOT NULL                            | Securely hashed password |
| created_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation time    |

### 2.2 Notes

The `notes` table stores notes belonging to users.

| Column     | Data Type    | Constraints                         | Description            |
| ---------- | ------------ | ----------------------------------- | ---------------------- |
| id         | BIGINT       | Primary key                         | Unique note identifier |
| user_id    | BIGINT       | NOT NULL, Foreign key               | User who owns the note |
| title      | VARCHAR(100) | NOT NULL                            | Note title             |
| body       | TEXT         | NOT NULL, DEFAULT ''                | Note content           |
| created_at | TIMESTAMPTZ  | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Note creation time     |
| updated_at | TIMESTAMPTZ  | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update time       |

### 2.3 Tags

The `tags` table stores labels used to organize notes.

| Column  | Data Type   | Constraints           | Description           |
| ------- | ----------- | --------------------- | --------------------- |
| id      | BIGINT      | Primary key           | Unique tag identifier |
| user_id | BIGINT      | NOT NULL, Foreign key | User who owns the tag |
| name    | VARCHAR(50) | NOT NULL              | Tag name              |

A unique constraint on `(user_id, name)` prevents a user from creating duplicate tags with the same name.

### 2.4 Note_Tags

The `note_tags` table connects notes and tags.

| Column  | Data Type | Constraints                        | Description    |
| ------- | --------- | ---------------------------------- | -------------- |
| note_id | BIGINT    | Primary key component, Foreign key | Connected note |
| tag_id  | BIGINT    | Primary key component, Foreign key | Connected tag  |

The composite primary key `(note_id, tag_id)` prevents the same tag from being attached to the same note more than once.

## 3. Relationships

### One-to-many: Users and Notes

One user can create many notes, but each note belongs to one user.

The `notes.user_id` foreign key references `users.id`.

### One-to-many: Users and Tags

One user can create many tags, but each tag belongs to one user.

The `tags.user_id` foreign key references `users.id`.

### Many-to-many: Notes and Tags

One note can have many tags, and one tag can be attached to many notes.

The `note_tags` junction table implements this many-to-many relationship.

Its `note_id` and `tag_id` columns reference the primary keys of `notes` and `tags`.

## 4. SQL CREATE TABLE Statements

The following statements create the four tables with primary keys, foreign keys, and appropriate constraints.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_note_title
        CHECK (CHAR_LENGTH(TRIM(title)) BETWEEN 1 AND 100)
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,

    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_tags_user_name
        UNIQUE (user_id, name),

    CONSTRAINT chk_tag_name
        CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 1 AND 50)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

The `ON DELETE CASCADE` rules automatically remove dependent records when their parent records are deleted.

For example, deleting a note also deletes its corresponding rows in `note_tags`.

## 5. SQL Queries

### Query 1: Retrieve all notes belonging to a user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

This query retrieves a user's notes, displaying the most recently updated notes first.

### Query 2: Retrieve notes with their tags using JOIN

```sql
SELECT
    n.id AS note_id,
    n.title,
    n.body,
    t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt
    ON n.id = nt.note_id
LEFT JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id;
```

The `LEFT JOIN` operations return notes even when they do not have any tags.

A note with multiple tags can appear in multiple result rows.

### Query 3: Count the notes belonging to each user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n
    ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

This query counts each user's notes. The `LEFT JOIN` ensures that users with no notes are also included.

### Query 4: Find notes containing a search phrase

```sql
SELECT id, title, body
FROM notes
WHERE user_id = 1
  AND (
      title ILIKE '%meeting%'
      OR body ILIKE '%meeting%'
  )
ORDER BY updated_at DESC;
```

PostgreSQL's `ILIKE` performs a case-insensitive text match. This query searches for the word `meeting` in titles and note bodies.

## 6. Indexes

The following index improves queries that retrieve a user's notes ordered by the most recent update:

```sql
CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);
```

The index helps PostgreSQL locate notes belonging to a particular user and return them in the requested order without necessarily sorting every matching row.

The database already creates indexes for primary key and unique constraints. Additional indexes should be selected based on actual query patterns and performance measurements.

## 7. SQL vs NoSQL

For QuickNotes, I would choose PostgreSQL, a relational SQL database.

### Why SQL is suitable

1. **Relationships:** Users, notes, and tags have clear relationships that foreign keys can enforce.
2. **Data integrity:** Primary keys, unique constraints, and foreign keys help prevent invalid or duplicate records.
3. **Transactions:** SQL transactions can keep related changes consistent.
4. **Flexible queries:** JOIN, filtering, grouping, and sorting support common note-management features.
5. **Structured data:** The application's core entities have predictable fields and relationships.

### When NoSQL might be useful

A NoSQL database could be useful if the application later needed to store large quantities of highly variable documents or support specialized distributed data-access patterns.

However, NoSQL would introduce different trade-offs for enforcing relationships and maintaining consistency.

### Final decision

PostgreSQL is the preferred starting point because QuickNotes has structured entities, ownership rules, and many-to-many relationships. It provides a strong foundation for reliable data storage and future growth.
