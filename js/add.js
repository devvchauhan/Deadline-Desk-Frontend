const BASE_URL = "https://deadline-desk-backend.onrender.com";

const form = document.getElementById('add-subject-form');
const msgContainer = document.getElementById('message-container');

// Error spans
const nameError = document.getElementById('name-error');
const deadlineError = document.getElementById('deadline-error');
const priorityError = document.getElementById('priority-error');

/**
 * Displays an alert message at the top of the form.
 * @param {string} msg - The message to show
 * @param {boolean} isError - True for red error, False for green success
 */
function showMessage(msg, isError = false) {
    msgContainer.textContent = msg;
    msgContainer.className = 'message ' + (isError ? 'error' : 'success');
}

/**
 * Resets inline error text and hides the error spans.
 */
function clearErrors() {
    nameError.style.display = 'none';
    deadlineError.style.display = 'none';
    priorityError.style.display = 'none';
    msgContainer.style.display = 'none';
}

/**
 * Handles the form submission logic.
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload
    clearErrors();

    // Get input values
    const name = document.getElementById('name').value.trim();
    const deadline = document.getElementById('deadline').value;
    const priority = document.getElementById('priority').value;

    let isValid = true;

    // Frontend Validations
    if (!name) {
        nameError.textContent = "Subject name is required.";
        nameError.style.display = 'block';
        isValid = false;
    }

    if (!deadline) {
        deadlineError.textContent = "Deadline is required.";
        deadlineError.style.display = 'block';
        isValid = false;
    } else {
        // Check past date
        const today = new Date();
        today.setHours(0,0,0,0);
        const selectedDate = new Date(deadline);
        
        if (selectedDate < today) {
            deadlineError.textContent = "Deadline must not be a past date.";
            deadlineError.style.display = 'block';
            isValid = false;
        }
    }

    if (!priority) {
        priorityError.textContent = "Priority is required.";
        priorityError.style.display = 'block';
        isValid = false;
    }

    if (!isValid) return;

    // Payload for POST request
    const payload = {
        name: name,
        deadline: deadline,
        priority: priority
    };

    try {
        const response = await fetch(`${BASE_URL}/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.status === 201) {
            // Success
            showMessage("Subject added successfully!");
            form.reset(); // Clear all inputs
        } else {
            // Error from backend
            showMessage(data.error || "Failed to add subject.", true);
        }
    } catch (error) {
        console.error("Error adding subject:", error);
        showMessage("Network error. Make sure the backend is running.", true);
    }
});
