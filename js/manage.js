const BASE_URL = "https://deadline-desk-backend.onrender.com";
const container = document.getElementById('manage-container');
const msgContainer = document.getElementById('message-container');

// Store fetched subjects globally so we can find them for editing
let subjectsData = [];

/**
 * Shows a message in the UI.
 * @param {string} msg - The text to display
 * @param {boolean} isError - True for red background, False for green
 */
function showMessage(msg, isError = false) {
    msgContainer.textContent = msg;
    msgContainer.className = 'message ' + (isError ? 'error' : 'success');
    // Hide automatically after 3 seconds
    setTimeout(() => {
        msgContainer.style.display = 'none';
    }, 3000);
}

/**
 * Fetches the subjects from the backend and calls render function.
 */
async function fetchAndRenderSubjects() {
    try {
        const response = await fetch(`${BASE_URL}/subjects`);
        if (!response.ok) throw new Error('Failed to fetch');
        subjectsData = await response.json();
        renderSubjects();
    } catch (error) {
        console.error("Error fetching subjects:", error);
        container.innerHTML = '';
        const errText = document.createElement('p');
        errText.style.color = 'var(--danger)';
        errText.textContent = 'Error loading subjects. Is the backend running?';
        container.appendChild(errText);
    }
}

/**
 * Renders the list of subjects dynamically into DOM nodes.
 */
function renderSubjects() {
    // Clear container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if (subjectsData.length === 0) {
        const emptyText = document.createElement('p');
        emptyText.textContent = "No subjects found.";
        container.appendChild(emptyText);
        return;
    }

    subjectsData.forEach(subject => {
        // Main card element
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.id = `card-${subject.id}`;

        // Title
        const title = document.createElement('h3');
        title.textContent = subject.name;
        card.appendChild(title);

        // Priority Badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `badge priority-${subject.priority}`;
        priorityBadge.textContent = subject.priority;
        card.appendChild(priorityBadge);

        // Status Badge
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge status-${subject.status}`;
        statusBadge.textContent = subject.status;
        card.appendChild(statusBadge);

        // Deadline
        const deadlineP = document.createElement('p');
        deadlineP.textContent = `Deadline: ${subject.deadline}`;
        card.appendChild(deadlineP);

        // Actions div
        const actionsDiv = document.createElement('div');
        actionsDiv.style.marginTop = '1rem';

        // Toggle Status Button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = subject.status === 'pending' ? 'Mark Done' : 'Mark Pending';
        toggleBtn.addEventListener('click', () => toggleStatus(subject.id));
        actionsDiv.appendChild(toggleBtn);

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => showEditForm(subject, card));
        actionsDiv.appendChild(editBtn);

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.backgroundColor = 'var(--danger)';
        deleteBtn.addEventListener('click', () => deleteSubject(subject.id, card));
        actionsDiv.appendChild(deleteBtn);

        card.appendChild(actionsDiv);

        // Container to hold the inline edit form when active
        const editFormContainer = document.createElement('div');
        editFormContainer.id = `edit-container-${subject.id}`;
        card.appendChild(editFormContainer);

        container.appendChild(card);
    });
}

/**
 * Toggles the subject status using PATCH.
 * @param {number} id - Subject ID
 */
async function toggleStatus(id) {
    try {
        const response = await fetch(`${BASE_URL}/subjects/${id}`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            showMessage("Status updated successfully.");
            // Re-fetch to get updated state and re-render
            fetchAndRenderSubjects();
        } else {
            const data = await response.json();
            showMessage(data.error || "Failed to update status", true);
        }
    } catch (error) {
        console.error("Error toggling status:", error);
    }
}

/**
 * Deletes a subject.
 * @param {number} id - Subject ID
 * @param {HTMLElement} cardElement - The DOM element of the card to remove
 */
async function deleteSubject(id, cardElement) {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
        const response = await fetch(`${BASE_URL}/subjects/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage("Subject deleted successfully.");
            // Remove card from DOM immediately instead of re-fetching
            if (cardElement && cardElement.parentNode) {
                cardElement.parentNode.removeChild(cardElement);
            }
            // Update local array
            subjectsData = subjectsData.filter(s => s.id !== id);
        } else {
            const data = await response.json();
            showMessage(data.error || "Failed to delete subject", true);
        }
    } catch (error) {
        console.error("Error deleting subject:", error);
    }
}

/**
 * Dynamically builds and shows the edit form inside the card.
 * @param {Object} subject - The subject to edit
 * @param {HTMLElement} card - The parent card
 */
function showEditForm(subject, card) {
    const editContainer = document.getElementById(`edit-container-${subject.id}`);
    
    // Clear any existing form first
    while (editContainer.firstChild) {
        editContainer.removeChild(editContainer.firstChild);
    }

    // Build form div
    const formDiv = document.createElement('div');
    formDiv.className = 'edit-form';

    // Name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name:';
    nameLabel.style.display = 'block';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = subject.name;
    nameInput.style.width = '100%';
    nameInput.style.marginBottom = '0.5rem';

    // Deadline input
    const deadlineLabel = document.createElement('label');
    deadlineLabel.textContent = 'Deadline:';
    deadlineLabel.style.display = 'block';
    const deadlineInput = document.createElement('input');
    deadlineInput.type = 'date';
    deadlineInput.value = subject.deadline;
    deadlineInput.style.width = '100%';
    deadlineInput.style.marginBottom = '0.5rem';

    // Priority input
    const priorityLabel = document.createElement('label');
    priorityLabel.textContent = 'Priority:';
    priorityLabel.style.display = 'block';
    const prioritySelect = document.createElement('select');
    prioritySelect.style.width = '100%';
    prioritySelect.style.marginBottom = '1rem';
    
    ['high', 'medium', 'low'].forEach(level => {
        const opt = document.createElement('option');
        opt.value = level;
        opt.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        if (subject.priority === level) opt.selected = true;
        prioritySelect.appendChild(opt);
    });

    // Action buttons container
    const btnDiv = document.createElement('div');
    
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.backgroundColor = 'var(--success)';
    saveBtn.addEventListener('click', () => saveEdit(subject.id, nameInput.value, deadlineInput.value, prioritySelect.value));
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.backgroundColor = '#6b7280'; // gray
    cancelBtn.addEventListener('click', () => {
        // Remove the form on cancel
        while (editContainer.firstChild) {
            editContainer.removeChild(editContainer.firstChild);
        }
    });

    btnDiv.appendChild(saveBtn);
    btnDiv.appendChild(cancelBtn);

    // Append all elements to form container
    formDiv.appendChild(nameLabel);
    formDiv.appendChild(nameInput);
    formDiv.appendChild(deadlineLabel);
    formDiv.appendChild(deadlineInput);
    formDiv.appendChild(priorityLabel);
    formDiv.appendChild(prioritySelect);
    formDiv.appendChild(btnDiv);

    editContainer.appendChild(formDiv);
}

/**
 * Submits the updated data using PUT request.
 * @param {number} id - Subject ID
 * @param {string} name - New name
 * @param {string} deadline - New deadline
 * @param {string} priority - New priority
 */
async function saveEdit(id, name, deadline, priority) {
    if (!name || !deadline || !priority) {
        showMessage("All fields are required.", true);
        return;
    }

    const payload = {
        name: name,
        deadline: deadline,
        priority: priority
    };

    try {
        const response = await fetch(`${BASE_URL}/subjects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 200) {
            showMessage("Subject updated successfully.");
            // Re-fetch from DB and update DOM
            fetchAndRenderSubjects();
        } else {
            const data = await response.json();
            showMessage(data.error || "Failed to update subject.", true);
        }
    } catch (error) {
        console.error("Error saving edit:", error);
        showMessage("Network error.", true);
    }
}

// Initial fetch on load
window.addEventListener('DOMContentLoaded', fetchAndRenderSubjects);
