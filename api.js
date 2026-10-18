// QuickNotes API client
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Select HTML elements
const loadButton = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");

// Display status messages
function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Reusable request function
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  // DELETE requests may return an empty response.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Create a note element safely
function createNoteElement(note) {
  const listItem = document.createElement("li");
  listItem.className = "note";

  const title = document.createElement("h3");
  title.textContent = note.title || "Untitled note";

  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";

  // Save the note ID on the button.
  deleteButton.dataset.noteId = note.id;

  deleteButton.addEventListener("click", () => {
    deleteNote(note.id, listItem, deleteButton);
  });

  listItem.append(title, body, deleteButton);

  return listItem;
}

// Display notes on the page
function displayNotes(notes) {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No notes found.";
    notesList.appendChild(emptyMessage);
    return;
  }

  notes.forEach((note) => {
    notesList.appendChild(createNoteElement(note));
  });
}

// GET: Load the first 10 notes
async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...", "loading");

  try {
    const notes = await request(`${API_URL}?_limit=10`);

    displayNotes(notes);

    if (notes.length === 0) {
      setStatus("No notes are available.", "success");
    } else {
      setStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    console.error("Unable to load notes:", error);
    setStatus("Unable to load notes. Check your internet connection and try again.", "error");
  } finally {
    loadButton.disabled = false;
  }
}

// POST: Create a new note
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a note title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Creating note...", "loading");

  try {
    const newNote = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title,
        body: body,
        userId: 1
      })
    });

    // JSONPlaceholder simulates creation but does not save it permanently.
    notesList.prepend(createNoteElement(newNote));

    setStatus(
      `Note created successfully (status 201, ID ${newNote.id}).`,
      "success"
    );

    noteForm.reset();
  } catch (error) {
    console.error("Unable to create note:", error);
    setStatus("Unable to create the note. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

// DELETE: Remove a note
async function deleteNote(noteId, listItem, deleteButton) {
  deleteButton.disabled = true;
  setStatus("Deleting note...", "loading");

  try {
    await request(`${API_URL}/${noteId}`, {
      method: "DELETE"
    });

    // Remove it from the current page after a successful response.
    listItem.remove();

    if (notesList.children.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.textContent = "No notes found.";
      notesList.appendChild(emptyMessage);
    }

    setStatus("Note deleted successfully.", "success");
  } catch (error) {
    console.error("Unable to delete note:", error);
    setStatus("Unable to delete the note. Please try again.", "error");
    deleteButton.disabled = false;
  }
}

// Connect buttons and form to their functions
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
