const STORAGE_KEY = "teamAppointmentBoard";

let appointments = [];
let appointmentToCancel = null;

const sampleAppointments = [{
        id: 1,
        title: "Client Project Discussion",
        description: "Discuss requirements and project timeline with the client.",
        date: "2026-09-18",
        startTime: "10:00",
        endTime: "11:00",
        status: "scheduled"
    },
    {
        id: 2,
        title: "Design Review",
        description: "Review the latest UI screens with the design team.",
        date: "2026-09-18",
        startTime: "12:00",
        endTime: "13:00",
        status: "scheduled"
    },
    {
        id: 3,
        title: "Sprint Planning",
        description: "Plan tasks and priorities for the upcoming sprint.",
        date: "2026-09-19",
        startTime: "09:30",
        endTime: "10:30",
        status: "completed"
    },
    {
        id: 4,
        title: "Candidate Interview",
        description: "Technical interview for the frontend developer position.",
        date: "2026-09-19",
        startTime: "14:00",
        endTime: "15:00",
        status: "cancelled"
    }
];

const appointmentList = document.getElementById("appointmentList");
const emptyState = document.getElementById("emptyState");
const appointmentModal = document.getElementById("appointmentModal");
const confirmModal = document.getElementById("confirmModal");
const appointmentForm = document.getElementById("appointmentForm");
const addAppointmentBtn = document.getElementById("addAppointmentBtn");
const closeModalBtn = document.getElementById("closeModal");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const modalOverlay = document.getElementById("modalOverlay");
const dateFilter = document.getElementById("dateFilter");
const statusFilter = document.getElementById("statusFilter");
const clearFiltersBtn = document.getElementById("clearFilters");
const totalCount = document.getElementById("totalCount");
const scheduledCount = document.getElementById("scheduledCount");
const completedCount = document.getElementById("completedCount");
const cancelledCount = document.getElementById("cancelledCount");
const appointmentResultText = document.getElementById("appointmentResultText");
const formError = document.getElementById("formError");
const toast = document.getElementById("toast");
const keepAppointmentBtn = document.getElementById("keepAppointmentBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

function initializeApp() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        try {
            appointments = JSON.parse(savedData);

            if (!Array.isArray(appointments)) {
                appointments = [...sampleAppointments];
                saveAppointments();
            }
        } catch (error) {
            appointments = [...sampleAppointments];
            saveAppointments();
        }
    } else {
        appointments = [...sampleAppointments];
        saveAppointments();
    }

    renderAppointments();
}

function saveAppointments() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appointments)
    );
}

function renderAppointments() {
    appointmentList.innerHTML = "";

    const selectedDate = dateFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredAppointments = appointments.filter(function(appointment) {
        const matchesDate =
            selectedDate === "" ||
            appointment.date === selectedDate;

        const matchesStatus =
            selectedStatus === "all" ||
            appointment.status === selectedStatus;

        return matchesDate && matchesStatus;
    });

    filteredAppointments.sort(function(a, b) {
        const first = a.date + " " + a.startTime;
        const second = b.date + " " + b.startTime;

        return first.localeCompare(second);
    });

    if (filteredAppointments.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
    }

    filteredAppointments.forEach(function(appointment) {
        const card = createAppointmentCard(appointment);
        appointmentList.appendChild(card);
    });

    appointmentResultText.textContent =
        filteredAppointments.length +
        " appointment" +
        (filteredAppointments.length !== 1 ? "s" : "") +
        " found";

    updateStatistics();
}

function createAppointmentCard(appointment) {
    const card = document.createElement("div");

    card.className =
        "appointment-card " + appointment.status;

    const formattedDate = formatDate(appointment.date);
    const formattedStart = formatTime(appointment.startTime);
    const formattedEnd = formatTime(appointment.endTime);

    let actionButtons = "";

    if (appointment.status === "scheduled") {
        actionButtons = `
            <button
                class="action-btn edit-btn"
                onclick="editAppointment(${appointment.id})">
                Edit
            </button>

            <button
                class="action-btn complete-btn"
                onclick="completeAppointment(${appointment.id})">
                ✓ Complete
            </button>

            <button
                class="action-btn cancel-btn"
                onclick="openCancelConfirmation(${appointment.id})">
                Cancel
            </button>
        `;
    }

    card.innerHTML = `
        <div class="card-top">
            <div>
                <h3 class="card-title">
                    ${escapeHTML(appointment.title)}
                </h3>
            </div>

            <span class="status status-${appointment.status}">
                ${appointment.status}
            </span>
        </div>

        <p class="description">
            ${
                appointment.description
                    ? escapeHTML(appointment.description)
                    : "No description provided."
            }
        </p>

        <div class="appointment-info">
            <div class="info-item">
                📅 ${formattedDate}
            </div>

            <div class="info-item">
                🕒 ${formattedStart} - ${formattedEnd}
            </div>
        </div>

        <div class="card-actions">
            ${actionButtons}
        </div>
    `;

    return card;
}

addAppointmentBtn.addEventListener("click", function() {
    resetForm();

    document.getElementById("modalTitle").textContent =
        "Add Appointment";

    appointmentModal.classList.remove("hidden");

    document.getElementById("title").focus();
});

function closeAppointmentModal() {
    appointmentModal.classList.add("hidden");
    resetForm();
}

closeModalBtn.addEventListener(
    "click",
    closeAppointmentModal
);

cancelModalBtn.addEventListener(
    "click",
    closeAppointmentModal
);

modalOverlay.addEventListener(
    "click",
    closeAppointmentModal
);

function resetForm() {
    appointmentForm.reset();

    document.getElementById("appointmentId").value = "";

    formError.textContent = "";
    formError.classList.add("hidden");
}

appointmentForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const appointmentId =
        document.getElementById("appointmentId").value;

    const title =
        document.getElementById("title").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const date =
        document.getElementById("appointmentDate").value;

    const startTime =
        document.getElementById("startTime").value;

    const endTime =
        document.getElementById("endTime").value;

    if (
        title === "" ||
        date === "" ||
        startTime === "" ||
        endTime === ""
    ) {
        showFormError(
            "Please fill in all required fields."
        );

        return;
    }

    if (endTime <= startTime) {
        showFormError(
            "End time must be later than start time."
        );

        return;
    }

    const currentId =
        appointmentId !== "" ?
        Number(appointmentId) :
        null;

    const conflict =
        checkTimeConflict(
            date,
            startTime,
            endTime,
            currentId
        );

    if (conflict) {
        showFormError(
            "This time slot overlaps with another appointment. Please choose a different time."
        );

        return;
    }

    if (currentId !== null) {
        const appointment =
            appointments.find(function(item) {
                return item.id === currentId;
            });

        if (!appointment) {
            showFormError(
                "Appointment could not be found."
            );

            return;
        }

        appointment.title = title;
        appointment.description = description;
        appointment.date = date;
        appointment.startTime = startTime;
        appointment.endTime = endTime;

        saveAppointments();
        renderAppointments();
        closeAppointmentModal();

        showToast(
            "Appointment updated successfully.",
            "success"
        );
    } else {
        const newAppointment = {
            id: generateId(),
            title: title,
            description: description,
            date: date,
            startTime: startTime,
            endTime: endTime,
            status: "scheduled"
        };

        appointments.push(newAppointment);

        saveAppointments();
        renderAppointments();
        closeAppointmentModal();

        showToast(
            "Appointment added successfully.",
            "success"
        );
    }
});

function checkTimeConflict(
    date,
    startTime,
    endTime,
    currentId
) {
    return appointments.some(function(appointment) {
        if (appointment.status === "cancelled") {
            return false;
        }

        if (
            currentId !== null &&
            appointment.id === currentId
        ) {
            return false;
        }

        if (appointment.date !== date) {
            return false;
        }

        const overlaps =
            startTime < appointment.endTime &&
            endTime > appointment.startTime;

        return overlaps;
    });
}

function editAppointment(id) {
    const appointment =
        appointments.find(function(item) {
            return item.id === id;
        });

    if (!appointment) {
        showToast(
            "Appointment not found.",
            "error"
        );

        return;
    }

    if (appointment.status !== "scheduled") {
        showToast(
            "Only scheduled appointments can be edited.",
            "error"
        );

        return;
    }

    document.getElementById("modalTitle").textContent =
        "Edit Appointment";

    document.getElementById("appointmentId").value =
        appointment.id;

    document.getElementById("title").value =
        appointment.title;

    document.getElementById("description").value =
        appointment.description;

    document.getElementById("appointmentDate").value =
        appointment.date;

    document.getElementById("startTime").value =
        appointment.startTime;

    document.getElementById("endTime").value =
        appointment.endTime;

    formError.textContent = "";
    formError.classList.add("hidden");

    appointmentModal.classList.remove("hidden");
}

function completeAppointment(id) {
    const appointment =
        appointments.find(function(item) {
            return item.id === id;
        });

    if (!appointment) {
        showToast(
            "Appointment not found.",
            "error"
        );

        return;
    }

    if (appointment.status !== "scheduled") {
        showToast(
            "Only scheduled appointments can be completed.",
            "error"
        );

        return;
    }

    appointment.status = "completed";

    saveAppointments();
    renderAppointments();

    showToast(
        "Appointment marked as completed.",
        "success"
    );
}

function openCancelConfirmation(id) {
    const appointment =
        appointments.find(function(item) {
            return item.id === id;
        });

    if (!appointment) {
        showToast(
            "Appointment not found.",
            "error"
        );

        return;
    }

    if (appointment.status !== "scheduled") {
        showToast(
            "Only scheduled appointments can be cancelled.",
            "error"
        );

        return;
    }

    appointmentToCancel = id;

    confirmModal.classList.remove("hidden");
}

keepAppointmentBtn.addEventListener("click", function() {
    appointmentToCancel = null;

    confirmModal.classList.add("hidden");
});

confirmCancelBtn.addEventListener("click", function() {
    if (appointmentToCancel === null) {
        return;
    }

    const appointment =
        appointments.find(function(item) {
            return item.id === appointmentToCancel;
        });

    if (!appointment) {
        confirmModal.classList.add("hidden");

        appointmentToCancel = null;

        showToast(
            "Appointment not found.",
            "error"
        );

        return;
    }

    appointment.status = "cancelled";

    saveAppointments();
    renderAppointments();

    confirmModal.classList.add("hidden");

    appointmentToCancel = null;

    showToast(
        "Appointment cancelled successfully.",
        "success"
    );
});

dateFilter.addEventListener(
    "change",
    function() {
        renderAppointments();
    }
);

statusFilter.addEventListener(
    "change",
    function() {
        renderAppointments();
    }
);

clearFiltersBtn.addEventListener(
    "click",
    function() {
        dateFilter.value = "";
        statusFilter.value = "all";

        renderAppointments();
    }
);

function updateStatistics() {
    totalCount.textContent =
        appointments.length;

    const scheduled =
        appointments.filter(function(appointment) {
            return appointment.status === "scheduled";
        });

    const completed =
        appointments.filter(function(appointment) {
            return appointment.status === "completed";
        });

    const cancelled =
        appointments.filter(function(appointment) {
            return appointment.status === "cancelled";
        });

    scheduledCount.textContent =
        scheduled.length;

    completedCount.textContent =
        completed.length;

    cancelledCount.textContent =
        cancelled.length;
}

function showFormError(message) {
    formError.textContent = message;

    formError.classList.remove("hidden");
}

function showToast(message, type) {
    toast.textContent = message;

    toast.className =
        "toast " + type + " show";

    setTimeout(function() {
        toast.className = "toast";
    }, 3000);
}

function formatDate(dateString) {
    const date =
        new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        "en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function formatTime(timeString) {
    const parts = timeString.split(":");

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    const date = new Date();

    date.setHours(
        hours,
        minutes,
        0,
        0
    );

    return date.toLocaleTimeString(
        "en-US", {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function generateId() {
    return Date.now();
}

function escapeHTML(value) {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

confirmModal.addEventListener(
    "click",
    function(event) {
        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {
            confirmModal.classList.add("hidden");
            appointmentToCancel = null;
        }
    }
);

document.addEventListener(
    "keydown",
    function(event) {
        if (event.key === "Escape") {
            appointmentModal.classList.add("hidden");
            confirmModal.classList.add("hidden");
            appointmentToCancel = null;
            resetForm();
        }
    }
);

initializeApp();