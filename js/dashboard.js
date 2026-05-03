const BASE_URL = "http://127.0.0.1:5000";

// --- Pomodoro Timer Logic ---
let pomodoroInterval = null;
let secondsLeft = 25 * 60; // 25 minutes

const timeDisplay = document.getElementById('pomodoro-time');

/**
 * Updates the big text display for the pomodoro timer in MM:SS format.
 */
function updateTimerDisplay() {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${m}:${s}`;
}

// Start Timer
document.getElementById('pomodoro-start').addEventListener('click', () => {
    if (pomodoroInterval) return; // already running
    pomodoroInterval = setInterval(() => {
        if (secondsLeft > 0) {
            secondsLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;
            alert("Time to take a break!");
        }
    }, 1000);
});

// Pause Timer
document.getElementById('pomodoro-pause').addEventListener('click', () => {
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
});

// Reset Timer
document.getElementById('pomodoro-reset').addEventListener('click', () => {
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
    secondsLeft = 25 * 60;
    updateTimerDisplay();
});

// --- Dashboard Logic ---

/**
 * Shows an error message on the dashboard if fetch fails.
 * @param {string} msg The error message
 */
function showError(msg) {
    const msgContainer = document.getElementById('message-container');
    msgContainer.textContent = msg;
    msgContainer.className = 'message error';
}

/**
 * Fetches all subjects from the backend.
 */
async function fetchSubjects() {
    try {
        const response = await fetch(`${BASE_URL}/subjects`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const subjects = await response.json();
        renderStats(subjects);
        renderCards(subjects);
    } catch (error) {
        console.error("Failed to fetch subjects:", error);
        showError("Failed to load subjects. Ensure backend is running.");
    }
}

/**
 * Calculates and updates the 3 top stat cards.
 * @param {Array} subjects Array of subject objects
 */
function renderStats(subjects) {
    const total = subjects.length;
    let done = 0;
    
    // Count how many are done
    for (let i = 0; i < subjects.length; i++) {
        if (subjects[i].status === 'done') done++;
    }
    
    const pending = total - done;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-pending').textContent = pending;
}

/**
 * Renders the subjects as cards using pure DOM manipulation (createElement, appendChild).
 * @param {Array} subjects Array of subject objects
 */
function renderCards(subjects) {
    const container = document.getElementById('subjects-container');
    
    // Clear existing cards
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if (subjects.length === 0) {
        const emptyText = document.createElement('p');
        emptyText.textContent = "No subjects found.";
        container.appendChild(emptyText);
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subjects.forEach(subject => {
        // Create main card wrapper
        const card = document.createElement('div');
        card.className = 'subject-card';

        // Title
        const title = document.createElement('h3');
        title.textContent = subject.name;
        card.appendChild(title);

        // Badges container
        const badgesDiv = document.createElement('div');
        
        // Priority Badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `badge priority-${subject.priority}`;
        priorityBadge.textContent = subject.priority;
        badgesDiv.appendChild(priorityBadge);

        // Status Badge
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge status-${subject.status}`;
        statusBadge.textContent = subject.status;
        badgesDiv.appendChild(statusBadge);

        card.appendChild(badgesDiv);

        // Deadline
        const deadlineP = document.createElement('p');
        deadlineP.textContent = `Deadline: ${subject.deadline}`;
        card.appendChild(deadlineP);

        // Due Soon calculation
        const deadlineDate = new Date(subject.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        
        // Difference in days
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If deadline is within 3 days (and not deeply in the past) and is pending
        if (diffDays >= 0 && diffDays <= 3 && subject.status === 'pending') {
            const dueSoonBadge = document.createElement('span');
            dueSoonBadge.className = 'due-soon';
            dueSoonBadge.textContent = 'Due Soon';
            card.appendChild(dueSoonBadge);
        }

        container.appendChild(card);
    });
}

// Run on page load
window.addEventListener('DOMContentLoaded', () => {
    updateTimerDisplay();
    fetchSubjects();
});
