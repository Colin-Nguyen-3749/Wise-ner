// --- FIREBASE INITIALIZATION ---
// Place this at the very top of your script, before any db usage.
var db = null;

document.addEventListener('DOMContentLoaded', function() {
    // --- FIREBASE INITIALIZATION - MAIN INITIALIZATION ---
    // Remove duplicate initialization and ensure db is properly set
    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            // Initialize Firebase if not already initialized
            const firebaseConfig = {
                apiKey: "AIzaSyAc7GwpxMV1ydIqkzo7DydzpLbXM-KRv6s",
                authDomain: "wise-ner2.firebaseapp.com",
                projectId: "wise-ner2",
                storageBucket: "wise-ner2.firebasestorage.app",
                messagingSenderId: "935296650537",
                appId: "1:935296650537:web:8478e21a16769cbc5f3b38"
            };
            firebase.initializeApp(firebaseConfig);
        }
        
        // Ensure db is assigned after Firebase is initialized
        db = firebase.firestore();
        console.log("Firebase initialized successfully", db);
    } else {
        console.error("Firebase SDK not loaded. Make sure Firebase scripts are included in your HTML.");
        return;
    }

    var calendarEl = document.getElementById('calendar');
    var legendContainer = document.getElementById('legend-container');
    var eventCreateContainer = document.getElementById('event-create-container');
    var createEventForm = document.getElementById('create-event-form');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
        dayMaxEvents: false, // Disable event limit
        dayMaxEventRows: false, // Disable row limit
        moreLinkClick: 'popover', // Show popover when clicking more link
        eventDisplay: 'list-item', // Use list display for dots
        displayEventTime: false, // Don't show event times
        displayEventEnd: false, // Don't show event end times
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        eventClick: function(info) {
            // Only allow editing in day and week views
            if (calendar.view.type === 'timeGridDay' || calendar.view.type === 'timeGridWeek') {
                openEventEditModal(info.event);
            }
        },
        eventDidMount: function(info) {
            // Replace event content with just a colored dot in month view
            if (calendar.view.type === 'dayGridMonth') {
                info.el.innerHTML = '';
                info.el.style.cssText = `
                    width: 8px !important;
                    height: 8px !important;
                    border-radius: 50% !important;
                    margin: 1px !important;
                    padding: 0 !important;
                    background-color: ${info.event.backgroundColor} !important;
                    border: 1px solid ${info.event.borderColor || info.event.backgroundColor} !important;
                    min-height: 8px !important;
                    font-size: 0 !important;
                    display: inline-block !important;
                    position: relative !important;
                `;
                
                // Add tooltip with event details
                info.el.title = `${info.event.title}${info.event.start ? ' - ' + info.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`;
            } else {
                // In day/week views, make events clickable
                info.el.style.cursor = 'pointer';
                info.el.title = 'Click to edit this event';
            }
        },
        dateClick: function(info) {
            // Do nothing
        },
        select: function(info) {
            // Do nothing
        },
        datesSet: function() {
            setTimeout(function() {
                document.querySelectorAll('.fc-daygrid-day').forEach(function(cell) {
                    cell.onmouseenter = null;
                    cell.onmouseleave = null;
                    cell.onclick = null;

                    cell.addEventListener('mouseenter', function() {
                        cell.classList.add('linger-hover');
                        cell.classList.remove('linger-fade');
                    });

                    cell.addEventListener('mouseleave', function() {
                        cell.classList.add('linger-fade');
                        setTimeout(function() {
                            cell.classList.remove('linger-hover');
                            cell.classList.remove('linger-fade');
                        }, 400);
                    });

                    // Show event creation section on single day view
                    cell.addEventListener('click', function(e) {
                        var dateStr = cell.getAttribute('data-date');
                        calendar.changeView('timeGridDay', dateStr);
                    });
                });

                // Show/hide legend/event-create based on view
                var viewType = calendar.view.type;
                if (legendContainer && eventCreateContainer) {
                    if (viewType === 'timeGridDay') {
                        legendContainer.style.display = 'none';
                        eventCreateContainer.style.display = '';
                    } else {
                        legendContainer.style.display = '';
                        eventCreateContainer.style.display = 'none';
                    }
                }
            }, 0);
        },
        viewDidMount: function(arg) {
            // Also handle legend/event-create visibility when view changes
            if (legendContainer && eventCreateContainer) {
                if (arg.view.type === 'timeGridDay') {
                    legendContainer.style.display = 'none';
                    eventCreateContainer.style.display = '';
                } else {
                    legendContainer.style.display = '';
                    eventCreateContainer.style.display = 'none';
                }
            }
            
            // Reset form when changing views
            resetEventForm();
        }
    });
    calendar.render();

    // --- FIREBASE EVENT FUNCTIONS ---
    async function addEvent(event) {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        console.log("Adding event to Firestore:", event);
        // Add event to Firestore; UI will update via onSnapshot
        const docRef = await db.collection("events").add(event);
        console.log("Event added with ID:", docRef.id);
        return docRef.id;
    }
    
    async function updateEvent(eventId, eventData) {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        // Update event in Firestore
        await db.collection("events").doc(eventId).update(eventData);
    }
    
    async function deleteEvent(eventId) {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        await db.collection("events").doc(eventId).delete();
    }

    // --- FIREBASE LEGEND FUNCTIONS ---
    async function addLegendItem(legendItem) {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        await db.collection("legendItems").add(legendItem);
    }
    
    async function updateLegendItem(itemId, itemData) {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        await db.collection("legendItems").doc(itemId).update(itemData);
    }
    
    async function deleteLegendItem(itemId) {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        await db.collection("legendItems").doc(itemId).delete();
    }

    // --- REAL-TIME FIREBASE HOOKS ---
    function subscribeToEvents() {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        console.log("Setting up real-time event listener...");
        db.collection("events").onSnapshot(snapshot => {
            console.log("Received Firestore update, events count:", snapshot.size);
            // Remove all current events
            calendar.getEvents().forEach(ev => ev.remove());
            // Add all events from Firestore
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log("Loading event from Firestore:", data);
                
                // Convert ISO strings back to Date objects if they exist
                let startDate = null;
                let endDate = null;
                
                if (data.start) {
                    startDate = new Date(data.start);
                    console.log("Converted start date:", startDate);
                }
                if (data.end) {
                    endDate = new Date(data.end);
                    console.log("Converted end date:", endDate);
                }
                
                calendar.addEvent({
                    id: doc.id,
                    title: data.title,
                    start: startDate,
                    end: endDate,
                    allDay: false,
                    backgroundColor: data.backgroundColor || '#3788d8',
                    borderColor: data.borderColor || data.backgroundColor || '#3788d8',
                    textColor: data.textColor || '#ffffff',
                    extendedProps: {
                        category: data.category || '',
                        email: data.email || '',
                        location: data.location || '',
                        description: data.description || ''
                    }
                });
                console.log("Event added to calendar:", data.title);
            });
        }, error => {
            console.error("Error in Firestore listener:", error);
        });
    }

    function subscribeToLegendItems() {
        if (!db) {
            console.error("Firestore db is not initialized.");
            return;
        }
        console.log("Setting up real-time legend listener...");
        db.collection("legendItems").onSnapshot(snapshot => {
            console.log("Received Firestore legend update, items count:", snapshot.size);
            // Clear current legend items
            if (legendList) {
                legendList.innerHTML = '';
            }
            // Add all legend items from Firestore
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log("Loading legend item:", data.name);
                createLegendItemFromFirestore(data.color, data.name, doc.id);
            });
            updateCategoryDropdown();
        }, error => {
            console.error("Error in Firestore legend listener:", error);
        });
    }

    // --- DISPLAY EVENT HELPER ---
    function displayEvent(eventData) {
        // Prevent duplicates
        if (calendar.getEventById(eventData.id)) return;
        calendar.addEvent({
            id: eventData.id,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            allDay: false,
            backgroundColor: eventData.backgroundColor,
            borderColor: eventData.borderColor,
            textColor: eventData.textColor,
            extendedProps: {
                category: eventData.category,
                email: eventData.email,
                location: eventData.location,
                description: eventData.description
            }
        });
    }

    // --- HOOK UP REAL-TIME LOADING ON PAGE LOAD ---
    // Ensure db is initialized before calling subscribeToEvents
    if (db) {
        subscribeToEvents();
        subscribeToLegendItems();
    } else {
        console.error("Firestore db is not initialized. Events will not sync.");
    }

    // Handle event creation form submission
    if (createEventForm) {
        createEventForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // --- FIX: Only submit to Firestore on step 2, not on step 1 ---
            if (currentFormStep === 1) {
                var title = document.getElementById('event-title').value.trim();
                var startTime = document.getElementById('event-start').value.trim();
                var endTime = document.getElementById('event-end').value.trim();
                
                console.log("Step 1 validation - Title:", title, "Start:", startTime, "End:", endTime);
                
                // Validate required fields
                if (!title) {
                    alert('Please enter an event title');
                    return;
                }
                
                if (!startTime) {
                    alert('Please select a start time');
                    return;
                }
                
                if (!endTime) {
                    alert('Please select an end time');
                    return;
                }
                
                // Validate time logic
                var startParsed = parseTime(startTime);
                var endParsed = parseTime(endTime);
                
                if (!startParsed || !endParsed) {
                    alert('Please enter valid times');
                    return;
                }
                
                // Check if start time is after end time
                if (isStartTimeAfterEndTime(startParsed, endParsed)) {
                    alert('Start time cannot be after end time. Please adjust your times.');
                    return;
                }
                
                showFormStep2();
                // Do NOT reset form or submit to Firestore here!
                return; // <-- Prevents flashing past step 2
            }

            // If we're on step 2, create/update the event
            var title = document.getElementById('event-title').value.trim();
            var startTime = document.getElementById('event-start').value;
            var endTime = document.getElementById('event-end').value;
            var categorySelect = document.getElementById('event-category');
            var emailInput = document.getElementById('event-email');
            var locationInput = document.getElementById('event-location');
            var descriptionInput = document.getElementById('event-description');

            console.log("Step 2 - Creating/updating event");

            if (title) {
                // Show loading feedback
                var submitButton = createEventForm.querySelector('button[type="submit"]');
                var originalText = submitButton.textContent;
                submitButton.textContent = 'Saving...';
                submitButton.disabled = true;

                try {
                    // Get additional details
                    var location = locationInput ? locationInput.value.trim() : '';
                    var description = descriptionInput ? descriptionInput.value.trim() : '';
                    
                    // Determine if we're editing or creating
                    if (editingEvent) {
                        // Get selected category color
                        var eventColor = '#3788d8'; // default blue
                        var categoryName = 'Default';
                        if (categorySelect && categorySelect.value) {
                            var selectedOption = categorySelect.options[categorySelect.selectedIndex];
                            if (selectedOption.dataset.color) {
                                eventColor = selectedOption.dataset.color;
                                categoryName = selectedOption.textContent;
                            }
                        }
                        
                        // Parse times
                        var startDate = new Date(editingEvent.start);
                        var endDate = new Date(editingEvent.start);
                        
                        if (startTime) {
                            var startParsed = parseTime(startTime);
                            if (startParsed) {
                                startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            }
                        }
                        
                        if (endTime) {
                            var endParsed = parseTime(endTime);
                            if (endParsed) {
                                endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            }
                        }
                        
                        var contactEmail = emailInput ? emailInput.value.trim() : '';
                        
                        // Update event in Firestore
                        await updateEvent(editingEvent.id, {
                            title: title,
                            start: startDate.toISOString(),
                            end: endDate.toISOString(),
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                            textColor: '#ffffff',
                            category: categoryName,
                            email: contactEmail,
                            location: location,
                            description: description,
                            updatedAt: Date.now()
                        });
                        
                        console.log("Event updated successfully");
                        resetEventForm();
                    } else {
                        // Create new event
                        var currentDate = calendar.view.currentStart; // current day in view
                        var start = new Date(currentDate);
                        var end = new Date(currentDate);
                        
                        if (startTime) {
                            var startParsed = parseTime(startTime);
                            if (startParsed) {
                                start.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            }
                        }
                        if (endTime) {
                            var endParsed = parseTime(endTime);
                            if (endParsed) {
                                end.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            }
                        }
                        
                        // Get selected category color
                        var eventColor = '#3788d8'; // default blue
                        var categoryName = 'Default';
                        if (categorySelect && categorySelect.value) {
                            var selectedOption = categorySelect.options[categorySelect.selectedIndex];
                            if (selectedOption.dataset.color) {
                                eventColor = selectedOption.dataset.color;
                                categoryName = selectedOption.textContent;
                            }
                        }
                        
                        // Get email if provided
                        var contactEmail = emailInput ? emailInput.value.trim() : '';
                        
                        console.log("Creating event with data:", {
                            title: title,
                            start: start.toISOString(),
                            end: end.toISOString(),
                            backgroundColor: eventColor,
                            category: categoryName,
                            email: contactEmail
                        });
                        
                        // Add event to Firestore (not calendar directly - onSnapshot will handle that)
                        await addEvent({
                            title: title,
                            start: start.toISOString(),
                            end: end.toISOString(),
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                            textColor: '#ffffff',
                            category: categoryName,
                            email: contactEmail,
                            location: location,
                            description: description,
                            createdAt: Date.now()
                        });
                        
                        console.log("Event created successfully");
                        
                        // Reset form and go back to step 1 for new event creation
                        createEventForm.reset();
                        resetEventForm();
                        updateCategoryDropdown(); // Reset dropdown to default
                        
                        // Show success feedback
                        submitButton.textContent = 'Event Created!';
                        setTimeout(() => {
                            submitButton.textContent = 'Next';
                            submitButton.disabled = false;
                        }, 1500);
                    }
                } catch (error) {
                    console.error("Error saving event:", error);
                    alert("Error saving event. Please try again.");
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }
        });
    }

    // --- DELETE EVENT HANDLER (UI + FIREBASE) ---
    function handleDeleteEvent(eventId) {
        // Only remove from Firestore; UI will update via onSnapshot
        deleteEvent(eventId);
    }

    // --- Example: Hook delete button in event edit modal ---
    var submitButton = createEventForm ? createEventForm.querySelector('button[type="submit"]') : null;
    if (!document.getElementById('delete-event-btn') && submitButton) {
        var deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.id = 'delete-event-btn';
        deleteButton.textContent = 'Delete Event';
        deleteButton.style.backgroundColor = '#dc3545';
        deleteButton.style.color = '#fff';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '4px';
        deleteButton.style.padding = '6px 12px';
        deleteButton.style.fontSize = '1em';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.marginLeft = '8px';
        deleteButton.style.transition = 'background 0.2s';

        deleteButton.addEventListener('click', function() {
            if (editingEvent) {
                handleDeleteEvent(editingEvent.id);
                resetEventForm();
            }
        });

        deleteButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#c82333';
        });

        deleteButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#dc3545';
        });

        submitButton.parentNode.appendChild(deleteButton);
    }

    // --- DISPLAY EVENT HELPER ---
    function displayEvent(eventData) {
        calendar.addEvent({
            id: eventData.id,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            allDay: false,
            backgroundColor: eventData.backgroundColor,
            borderColor: eventData.borderColor,
            textColor: eventData.textColor,
            extendedProps: {
                category: eventData.category,
                email: eventData.email,
                location: eventData.location,
                description: eventData.description
            }
        });
    }

    // Local Storage Functions
    function saveEventsToStorage() {
        var events = calendar.getEvents().map(function(event) {
            return {
                id: event.id,
                title: event.title,
                start: event.start ? event.start.toISOString() : null,
                end: event.end ? event.end.toISOString() : null,
                allDay: event.allDay,
                backgroundColor: event.backgroundColor,
                borderColor: event.borderColor,
                textColor: event.textColor,
                extendedProps: event.extendedProps
            };
        });
        localStorage.setItem('wise-ner-events', JSON.stringify(events));
    }

    function loadEventsFromStorage() {
        var storedEvents = localStorage.getItem('wise-ner-events');
        if (storedEvents) {
            try {
                var events = JSON.parse(storedEvents);
                events.forEach(function(eventData) {
                    calendar.addEvent({
                        id: eventData.id,
                        title: eventData.title,
                        start: eventData.start ? new Date(eventData.start) : null,
                        end: eventData.end ? new Date(eventData.end) : null,
                        allDay: eventData.allDay,
                        backgroundColor: eventData.backgroundColor,
                        borderColor: eventData.borderColor,
                        textColor: eventData.textColor,
                        extendedProps: eventData.extendedProps
                    });
                });
            } catch (e) {
                console.error('Error loading events from storage:', e);
            }
        }
    }

    function createLegendItemFromFirestore(color, name, firestoreId) {
        // Make sure legendList exists
        if (!legendList) {
            console.error('Legend list not found');
            return;
        }

        var li = document.createElement('li');
        li.dataset.firestoreId = firestoreId; // Store Firestore ID for updates/deletes

        // Preset color options
        var colors = [
            "#ff0000ff", "#ff7300ff", "#ffae00ff", "#ffff00ff", "#48da74ff",
            "#4c9967ff", "#4f6de4ff", "#a45ff7ff", "#e97bffff",
            "#e2a6d0ff"
        ];

        // Color circle
        var colorCircle = document.createElement('span');
        colorCircle.className = 'legend-color-circle';
        colorCircle.style.background = color;
        colorCircle.style.marginRight = '8px';

        // Color menu (hidden by default)
        var colorMenu = document.createElement('div');
        colorMenu.className = 'legend-color-menu';
        colorMenu.style.display = 'none';

        colors.forEach(function(colorOption) {
            var colorOptionElement = document.createElement('span');
            colorOptionElement.className = 'legend-color-option';
            colorOptionElement.style.background = colorOption;
            colorOptionElement.setAttribute('data-color', colorOption);
            colorOptionElement.addEventListener('click', async function(e) {
                colorCircle.style.background = colorOption;
                colorMenu.style.display = 'none';
                // Update in Firestore instead of localStorage
                await updateLegendItem(firestoreId, {
                    color: colorOption,
                    name: name,
                    updatedAt: Date.now()
                });
            });
            colorMenu.appendChild(colorOptionElement);
        });

        // Show/hide color menu on circle click
        colorCircle.addEventListener('click', function(e) {
            e.stopPropagation();
            colorMenu.style.display = colorMenu.style.display === 'none' ? 'grid' : 'none';
        });

        // Hide color menu if clicking elsewhere
        document.addEventListener('click', function() {
            colorMenu.style.display = 'none';
        });

        // Category name display
        var nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.className = 'legend-name-text';
        nameSpan.style.flex = '1';
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.padding = '2px 6px';
        nameSpan.style.borderRadius = '4px';

        // Create input for editing
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'legend-name-input';
        nameInput.style.flex = '1';
        nameInput.style.fontSize = '1em';
        nameInput.style.border = '1px solid #ccc';
        nameInput.style.borderRadius = '4px';
        nameInput.style.padding = '2px 6px';

        // Double-click to edit
        nameSpan.addEventListener('dblclick', function() {
            li.replaceChild(nameInput, nameSpan);
            nameInput.value = nameSpan.textContent;
            nameInput.focus();
        });

        // Save on Enter or blur
        async function saveNameEdit() {
            var value = nameInput.value.trim() || 'Unnamed';
            nameSpan.textContent = value;
            li.replaceChild(nameSpan, nameInput);
            // Update in Firestore instead of localStorage
            await updateLegendItem(firestoreId, {
                color: color,
                name: value,
                updatedAt: Date.now()
            });
        }

        nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNameEdit();
            }
        });

        nameInput.addEventListener('blur', saveNameEdit);

        // Add delete functionality with right-click
        li.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (confirm('Delete this legend item?')) {
                // Delete from Firestore instead of just removing from UI
                deleteLegendItem(firestoreId);
            }
        });

        li.appendChild(colorCircle);
        li.appendChild(colorMenu);
        li.appendChild(nameSpan);
        legendList.appendChild(li);
    }

    function createLegendItem(color, name) {
        // This function now just calls the Firestore version
        createLegendItemFromFirestore(color, name, null);
    }

    // Legend functionality - Define variables first
    var legendList = document.getElementById('legend-list');
    var addKeyBtn = document.getElementById('add-key-btn');

    // Remove localStorage loading - now handled by Firebase
    // loadLegendFromStorage();

    // Global variable to track if we're editing an event
    var editingEvent = null;

    // Global variable to track current form step
    var currentFormStep = 1;

    // Function to open event edit modal
    function openEventEditModal(event) {
        editingEvent = event;
        
        // Reset to step 1
        showFormStep1();
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Edit Event';
        }
        
        // Add exit button if it doesn't exist
        if (!document.getElementById('edit-exit-btn')) {
            var exitButton = document.createElement('button');
            exitButton.type = 'button';
            exitButton.id = 'edit-exit-btn';
            exitButton.innerHTML = '&times;';
            exitButton.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                font-weight: bold;
                color: #666;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s, color 0.2s;
                z-index: 10;
            `;
            
            exitButton.addEventListener('click', function() {
                resetEventForm();
                // Return to appropriate view based on current calendar view
                if (calendar.view.type === 'timeGridDay') {
                    // Stay in day view but reset form
                } else {
                    // Go back to month view or previous view
                    calendar.changeView('dayGridMonth');
                }
            });
            
            exitButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
                this.style.color = '#333';
            });
            
            exitButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
                this.style.color = '#666';
            });
            
            // Make the event container positioned relative for absolute positioning
            eventCreateContainer.style.position = 'relative';
            eventCreateContainer.appendChild(exitButton);
        }
        
        // Populate form with event data
        var titleInput = document.getElementById('event-title');
        var startInput = document.getElementById('event-start');
        var endInput = document.getElementById('event-end');
        var categorySelect = document.getElementById('event-category');
        var emailInput = document.getElementById('event-email');
        var locationInput = document.getElementById('event-location');
        var descriptionInput = document.getElementById('event-description');
        
        if (titleInput) titleInput.value = event.title || '';
        
        // Format times for display
        if (event.start && startInput) {
            var startTime = event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
            startInput.value = startTime;
        }
        
        if (event.end && endInput) {
            var endTime = event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
            endInput.value = endTime;
        }
        
        // Set category if it exists
        if (categorySelect && event.extendedProps && event.extendedProps.category) {
            var categoryValue = event.extendedProps.category;
            for (var i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].textContent === categoryValue) {
                    categorySelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Set email if it exists
        if (emailInput && event.extendedProps && event.extendedProps.email) {
            emailInput.value = event.extendedProps.email;
        }
        
        // Set location and description if they exist
        if (locationInput && event.extendedProps && event.extendedProps.location) {
            locationInput.value = event.extendedProps.location;
        }
        
        if (descriptionInput && event.extendedProps && event.extendedProps.description) {
            descriptionInput.value = event.extendedProps.description;
        }
        
        // Change submit button to update button and add delete button
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Add delete button if it doesn't exist
        if (!document.getElementById('delete-event-btn')) {
            var deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.id = 'delete-event-btn';
            deleteButton.textContent = 'Delete Event';
            deleteButton.style.backgroundColor = '#dc3545';
            deleteButton.style.color = '#fff';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.padding = '6px 12px';
            deleteButton.style.fontSize = '1em';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.marginLeft = '8px';
            deleteButton.style.transition = 'background 0.2s';
            
            deleteButton.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this event?')) {
                    if (editingEvent) {
                        // Delete from Firestore instead of just removing from calendar
                        handleDeleteEvent(editingEvent.id);
                        resetEventForm();
                    }
                }
            });
            
            deleteButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#c82333';
            });
            
            deleteButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#dc3545';
            });
            
            submitButton.parentNode.appendChild(deleteButton);
        }
        
        // Show the event create container
        if (legendContainer) legendContainer.style.display = 'none';
        if (eventCreateContainer) eventCreateContainer.style.display = '';
    }

    // Function to reset the event form to create mode
    function resetEventForm() {
        editingEvent = null;
        currentFormStep = 1;
        
        // Reset to step 1
        showFormStep1();
        
        // Reset form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Create Event';
        }
        
        // Clear form
        if (createEventForm) {
            createEventForm.reset();
        }
        
        // Reset submit button
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Remove delete button
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton) {
            deleteButton.remove();
        }
        
        // Remove exit button
        var exitButton = document.getElementById('edit-exit-btn');
        if (exitButton) {
            exitButton.remove();
        }
        
        // Remove back button
        var backButton = document.getElementById('back-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Reset dropdown
        updateCategoryDropdown();
    }

    // Function to show step 2 of the form
    function showFormStep2() {
        currentFormStep = 2;
        
        // Hide step 1 elements and their labels
        var step1Elements = [
            document.getElementById('event-title'),
            document.getElementById('event-start'),
            document.getElementById('event-end'),
            document.getElementById('event-category'),
            document.getElementById('event-email')
        ];
        
        step1Elements.forEach(function(el) {
            if (el) {
                // Hide the input/select element
                el.style.display = 'none';
                
                // Find and hide the associated label
                var labels = document.querySelectorAll('label');
                labels.forEach(function(label) {
                    if (label.getAttribute('for') === el.id || 
                        (label.nextElementSibling === el) ||
                        (el.previousElementSibling === label)) {
                        label.style.display = 'none';
                    }
                });
                
                // Also check previous sibling for labels
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'none';
                }
            }
        });
        
        // Also hide any remaining labels by text content (failsafe)
        var allLabels = document.querySelectorAll('.event-create-container label');
        allLabels.forEach(function(label) {
            var labelText = label.textContent.trim();
            if (labelText === 'Title:' || labelText === 'Start Time:' || labelText === 'End Time:') {
                label.style.display = 'none';
            }
        });
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            var currentTitle = formTitle.textContent;
            formTitle.textContent = currentTitle + ' (Further Details)';
        }
        
        // Create step 2 elements if they don't exist
        if (!document.getElementById('event-location')) {
            createStep2Elements();
        }
        
        // Show step 2 elements
        showStep2Elements();
        
        // Update button text and functionality
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = editingEvent ? 'Update Event' : 'Create Event';
        }
        
        // Add back button
        if (!document.getElementById('back-btn')) {
            var backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.id = 'back-btn';
            backButton.textContent = 'Back';
            backButton.style.cssText = `
                background: #6c757d;
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 1em;
                cursor: pointer;
                margin-right: 8px;
                transition: background 0.2s;
            `;
            
            backButton.addEventListener('click', function() {
                showFormStep1();
            });
            
            backButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#5a6268';
            });
            
            backButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#6c757d';
            });
            
            submitButton.parentNode.insertBefore(backButton, submitButton);
        }
        
        // Hide delete button in step 2
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton) {
            deleteButton.style.display = 'none';
        }
    }

    // Function to show step 1 of the form
    function showFormStep1() {
        currentFormStep = 1;
        
        // Show step 1 elements and their labels
        var step1Elements = [
            document.getElementById('event-title'),
            document.getElementById('event-start'),
            document.getElementById('event-end'),
            document.getElementById('event-category'),
            document.getElementById('event-email')
        ];
        
        step1Elements.forEach(function(el) {
            if (el) {
                // Show the input/select element
                el.style.display = 'block';
                
                // Find and show the associated label
                var labels = document.querySelectorAll('label');
                labels.forEach(function(label) {
                    if (label.getAttribute('for') === el.id || 
                        (label.nextElementSibling === el) ||
                        (el.previousElementSibling === label)) {
                        label.style.display = 'block';
                    }
                });
                
                // Also check previous sibling for labels
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'block';
                }
            }
        });
        
        // Show step 1 labels by text content (failsafe)
        var allLabels = document.querySelectorAll('.event-create-container label');
        allLabels.forEach(function(label) {
            var labelText = label.textContent.trim();
            if (labelText === 'Title:' || labelText === 'Start Time:' || labelText === 'End Time:' ||
                labelText === 'Category:' || labelText === 'Contact Email:') {
                label.style.display = 'block';
            }
        });
        
        // Hide step 2 elements
        hideStep2Elements();
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            var currentTitle = formTitle.textContent.replace(' - Additional Details', '');
            formTitle.textContent = currentTitle;
        }
        
        // Update button text
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Remove back button
        var backButton = document.getElementById('back-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Show delete button in step 1 if editing
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton && editingEvent) {
            deleteButton.style.display = 'inline-block';
        }
    }

    // Function to create step 2 form elements
    function createStep2Elements() {
        var form = createEventForm;
        var submitButton = form.querySelector('button[type="submit"]');
        
        // Create location input
        var locationLabel = document.createElement('label');
        locationLabel.textContent = 'Location (optional):';
        locationLabel.style.display = 'none';
        
        var locationInput = document.createElement('input');
        locationInput.type = 'text';
        locationInput.id = 'event-location';
        locationInput.placeholder = 'Enter event location';
        locationInput.style.display = 'none';
        
        // Create description textarea
        var descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description (optional):';
        descriptionLabel.style.display = 'none';
        
        var descriptionInput = document.createElement('textarea');
        descriptionInput.id = 'event-description';
        descriptionInput.placeholder = 'Enter event description';
        descriptionInput.rows = 4;
        descriptionInput.style.display = 'none';
        
        // Insert before submit button
        form.insertBefore(locationLabel, submitButton);
        form.insertBefore(locationInput, submitButton);
        form.insertBefore(descriptionLabel, submitButton);
        form.insertBefore(descriptionInput, submitButton);
    }

    // Function to show step 2 elements
    function showStep2Elements() {
        var step2Elements = [
            'event-location',
            'event-description'
        ];
        
        step2Elements.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'block';
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'block';
                }
            }
        });
    }

    // Function to hide step 2 elements
    function hideStep2Elements() {
        var step2Elements = [
            'event-location',
            'event-description'
        ];
        
        step2Elements.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'none';
                }
            }
        });
    }

    // Helper function to parse time
    function parseTime(timeStr) {
        if (!timeStr) return null;
        // Handle AM/PM format: "12:30 PM" or "1:45 AM"
        var match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
            var h = parseInt(match[1], 10);
            var m = parseInt(match[2], 10);
            var ampm = match[3].toUpperCase();
            
            // Convert to 24-hour format
            if (ampm === 'PM' && h !== 12) {
                h += 12;
            } else if (ampm === 'AM' && h === 12) {
                h = 0;
            }
            
            return { hours: h, minutes: m, ampm: ampm };
        }
        
        // Fallback: try 24-hour format "14:30"
        var parts = timeStr.split(':');
        if (parts.length === 2) {
            return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) };
        }
        
        return null;
    }

    // Helper function to check if start time is after end time
    function isStartTimeAfterEndTime(startParsed, endParsed) {
        // Convert both times to minutes since midnight for comparison
        var startMinutes = startParsed.hours * 60 + startParsed.minutes;
        var endMinutes = endParsed.hours * 60 + endParsed.minutes;
        
        // Start time cannot be after or equal to end time
        return startMinutes >= endMinutes;
    }

    // Function to update the category dropdown with current legend items
    function updateCategoryDropdown() {
        var categorySelect = document.getElementById('event-category');
        if (!categorySelect) {
            // Create the dropdown if it doesn't exist
            createCategoryDropdown();
            categorySelect = document.getElementById('event-category');
        }
        
        // Clear existing options except default
        categorySelect.innerHTML = '<option value="">No Category (Default)</option>';
        
        // Add options from legend
        if (legendList) {
            var legendItems = legendList.querySelectorAll('li');
            legendItems.forEach(function(li) {
                var colorCircle = li.querySelector('.legend-color-circle');
                var nameText = li.querySelector('.legend-name-text');
                
                if (colorCircle && nameText) {
                    var option = document.createElement('option');
                    option.value = nameText.textContent;
                    option.textContent = nameText.textContent;
                    option.dataset.color = colorCircle.style.background;
                    categorySelect.appendChild(option);
                }
            });
        }
    }
    
    // Function to create the category dropdown
    function createCategoryDropdown() {
        var eventCreateContainer = document.getElementById('event-create-container');
        if (!eventCreateContainer) return;
        
        var form = eventCreateContainer.querySelector('form');
        if (!form) return;
        
        // Check if elements already exist to prevent duplication
        if (document.getElementById('event-category') && document.getElementById('event-email')) {
            return; // Elements already exist, no need to create them again
        }
        
        // Find the submit button to insert before it
        var submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;
        
        // Create category selection elements only if they don't exist
        if (!document.getElementById('event-category')) {
            var categoryLabel = document.createElement('label');
            categoryLabel.textContent = 'Category:';
            
            var categorySelect = document.createElement('select');
            categorySelect.id = 'event-category';
            
            // Insert before submit button
            form.insertBefore(categoryLabel, submitButton);
            form.insertBefore(categorySelect, submitButton);
        }
        
        // Create email input elements only if they don't exist
        if (!document.getElementById('event-email')) {
            var emailLabel = document.createElement('label');
            emailLabel.textContent = 'Contact Email:';
            
            var emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.id = 'event-email';
            emailInput.placeholder = 'Enter contact email';
            emailInput.required = true;
            
            // Insert before submit button
            form.insertBefore(emailLabel, submitButton);
            form.insertBefore(emailInput, submitButton);
        }
        
        // Initial population
        updateCategoryDropdown();
    }
    
    // Create the dropdown and step 2 elements when the page loads
    createCategoryDropdown();
    if (createEventForm) {
        createStep2Elements();
    }

    // Add legend button functionality
    if (addKeyBtn) {
        addKeyBtn.addEventListener('click', async function() {
            console.log('Adding new legend item');
            
            // Preset color options add strong + pastel colors
            var colors = [
                "#ff0000ff", "#ff7300ff", "#ffae00ff", "#ffff00ff", "#48da74ff",
                "#4c9967ff", "#4f6de4ff", "#a45ff7ff", "#e97bffff",
                "#e2a6d0ff"
            ];

            // Create new legend item in Firestore
            await addLegendItem({
                color: colors[0],
                name: 'New Category',
                createdAt: Date.now()
            });
        });
    }

    function setupClockModal(startInputId, endInputId) {
        const modalOverlay = document.getElementById('clock-modal-overlay');
        const modalContent = document.getElementById('clock-modal-content');
        const picker = document.getElementById('clock-modal-picker');
        const hourInput = document.getElementById('clock-modal-hour');
        const minuteInput = document.getElementById('clock-modal-minute');
        const amBtn = document.getElementById('clock-modal-am');
        const pmBtn = document.getElementById('clock-modal-pm');
        const okayBtn = document.getElementById('clock-modal-okay');
        const exitBtn = document.getElementById('clock-modal-exit');
        let targetInput = null;
        let mode = 'hour';
        let hour = 12, minute = 0, ampm = 'AM';

        function setInputValue() {
            // Format minute with leading zero if needed for target input
            let formattedMinute = minute < 10 ? '0' + minute : minute;
            if (targetInput) targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
            if (hourInput) hourInput.value = hour;
            // Only update minute input if it's not currently being edited
            if (minuteInput && document.activeElement !== minuteInput) {
                minuteInput.value = formattedMinute;
            }
            
            // Update AM/PM button states
            if (amBtn && pmBtn) {
                amBtn.classList.toggle('selected', ampm === 'AM');
                pmBtn.classList.toggle('selected', ampm === 'PM');
            }
        }

        function renderClock() {
            picker.innerHTML = '';
            picker.style.opacity = 1;

            // Draw clock face (circle + ticks)
            let face = document.createElement('div');
            face.className = 'clock-face';
            picker.appendChild(face);

            // Center for calculations
            const centerX = 110;
            const centerY = 110;
            const hourRadius = 80;
            const minuteRadius = 90;

            if (mode === 'hour') {
                // Draw hour labels (1-12) in a perfect circle, center each label box on the circle
                for (let i = 1; i <= 12; i++) {
                    let angle = (i - 3) * (Math.PI * 2) / 12;
                    let x = centerX + hourRadius * Math.cos(angle) - 16;
                    let y = centerY + hourRadius * Math.sin(angle) - 16;
                    let label = document.createElement('div');
                    label.className = 'clock-label' + (hour === i ? ' selected' : '');
                    label.style.left = `${x}px`;
                    label.style.top = `${y}px`;
                    label.textContent = i;
                    picker.appendChild(label);
                }
            } else {
                // Draw minute labels (00, 05, ..., 55) in a perfect circle, center each label box on the circle
                for (let i = 0; i < 60; i += 5) {
                    let angle = (i / 5 - 3) * (Math.PI * 2) / 12;
                    let x = centerX + minuteRadius * Math.cos(angle) - 16;
                    let y = centerY + minuteRadius * Math.sin(angle) - 16;
                    let label = document.createElement('div');
                    label.className = 'clock-label' + (minute === i ? ' selected' : '');
                    label.style.left = `${x}px`;
                    label.style.top = `${y}px`;
                    label.textContent = (i < 10 ? '0' : '') + i;
                    picker.appendChild(label);
                }
            }

            // Draw both hands for aesthetics, but only one is interactive at a time
            // --- HOUR HAND ---
            let hourAngleDeg = (hour % 12) * 30 - 90;
            let hourAngleRad = hourAngleDeg * Math.PI / 180;
            let hourHandLength = hourRadius - 12;
            let hourEndX = centerX + hourHandLength * Math.cos(hourAngleRad);
            let hourEndY = centerY + hourHandLength * Math.sin(hourAngleRad);

            let hourHand = document.createElement('div');
            hourHand.className = 'clock-hour-hand';
            hourHand.style.position = 'absolute';
            hourHand.style.left = '0';
            hourHand.style.top = '0';
            hourHand.style.width = '220px';
            hourHand.style.height = '220px';
            hourHand.style.background = 'none';
            hourHand.style.zIndex = '10';
            hourHand.style.cursor = 'pointer';
            hourHand.style.pointerEvents = 'auto';
            hourHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                <line x1="${centerX}" y1="${centerY}" x2="${hourEndX}" y2="${hourEndY}" stroke="#1976d2" stroke-width="6" stroke-linecap="round"/>
            </svg>`;
            picker.appendChild(hourHand);

            let hourCircle = document.createElement('div');
            hourCircle.className = 'clock-hand-circle';
            hourCircle.style.left = `${hourEndX - 12}px`;
            hourCircle.style.top = `${hourEndY - 12}px`;
            picker.appendChild(hourCircle);

            // --- MINUTE HAND ---
            let minuteAngleDeg = minute * 6 - 90;
            let minuteAngleRad = minuteAngleDeg * Math.PI / 180;
            let minuteHandLength = minuteRadius - 10;
            let minuteEndX = centerX + minuteHandLength * Math.cos(minuteAngleRad);
            let minuteEndY = centerY + minuteHandLength * Math.sin(minuteAngleRad);

            let minuteHand = document.createElement('div');
            minuteHand.className = 'clock-minute-hand';
            minuteHand.style.position = 'absolute';
            minuteHand.style.left = '0';
            minuteHand.style.top = '0';
            minuteHand.style.width = '220px';
            minuteHand.style.height = '220px';
            minuteHand.style.background = 'none';
            minuteHand.style.zIndex = '9';
            minuteHand.style.cursor = 'pointer';
            minuteHand.style.pointerEvents = 'auto';
            minuteHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                <line x1="${centerX}" y1="${centerY}" x2="${minuteEndX}" y2="${minuteEndY}" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
            </svg>`;
            picker.appendChild(minuteHand);

            let minuteCircle = document.createElement('div');
            minuteCircle.className = 'clock-hand-circle minute';
            minuteCircle.style.left = `${minuteEndX - 10}px`;
            minuteCircle.style.top = `${minuteEndY - 10}px`;
            picker.appendChild(minuteCircle);

            // Only allow interaction with the active hand
            if (mode === 'hour') {
                hourHand.style.zIndex = '20';
                hourCircle.style.zIndex = '21';
                minuteHand.style.opacity = '0.3';
                minuteCircle.style.opacity = '0.3';
                // Drag logic for hour hand
                let draggingHour = false;
                function onHourDrag(e) {
                    if (draggingHour) {
                        let rect = picker.getBoundingClientRect();
                        let center = { x: rect.left + centerX, y: rect.top + centerY };
                        let angle = getAngleFromEvent(e, center);
                        let h = Math.round(angle / 30) || 12;
                        hour = h > 12 ? h - 12 : h;
                        setInputValue();
                        let angleDeg = (hour % 12) * 30 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + hourHandLength * Math.cos(angleRad);
                        let endY = centerY + hourHandLength * Math.sin(angleRad);
                        hourHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#1976d2" stroke-width="6" stroke-linecap="round"/>
                        </svg>`;
                        hourCircle.style.left = `${endX - 12}px`;
                        hourCircle.style.top = `${endY - 12}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(label) {
                            label.classList.toggle('selected', parseInt(label.textContent) === hour);
                        });
                    }
                }
                function onHourUp(e) {
                    if (draggingHour) {
                        draggingHour = false;
                        document.removeEventListener('mousemove', onHourDrag);
                        document.removeEventListener('mouseup', onHourUp);
                        mode = 'minute';
                        renderClock();
                    }
                }
                hourHand.addEventListener('mousedown', function(e) {
                    draggingHour = true;
                    e.preventDefault();
                    document.addEventListener('mousemove', onHourDrag);
                    document.addEventListener('mouseup', onHourUp);
                });

                // Click on hour labels to set hour and switch to minute mode
                picker.querySelectorAll('.clock-label').forEach(function(label) {
                    label.addEventListener('mousedown', function(e) {
                        hour = parseInt(label.textContent);
                        setInputValue();
                        let angleDeg = (hour % 12) * 30 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + hourHandLength * Math.cos(angleRad);
                        let endY = centerY + hourHandLength * Math.sin(angleRad);
                        hourHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#1976d2" stroke-width="6" stroke-linecap="round"/>
                        </svg>`;
                        hourCircle.style.left = `${endX - 12}px`;
                        hourCircle.style.top = `${endY - 12}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(l) {
                            l.classList.toggle('selected', parseInt(l.textContent) === hour);
                        });
                    });
                    label.addEventListener('mouseup', function(e) {
                        hour = parseInt(label.textContent);
                        setInputValue();
                        mode = 'minute';
                        renderClock();
                    });
                });
            } else {
                minuteHand.style.zIndex = '20';
                minuteCircle.style.zIndex = '21';
                hourHand.style.opacity = '0.3';
                hourCircle.style.opacity = '0.3';
                // Drag logic for minute hand
                let draggingMinute = false;
                function onMinuteDrag(e) {
                    if (draggingMinute) {
                        let rect = picker.getBoundingClientRect();
                        let center = { x: rect.left + centerX, y: rect.top + centerY };
                        let angle = getAngleFromEvent(e, center);
                        let m = Math.round(angle / 6) % 60;
                        m = m < 0 ? m + 60 : m;
                        minute = m;
                        setInputValue();
                        let angleDeg = minute * 6 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + minuteHandLength * Math.cos(angleRad);
                        let endY = centerY + minuteHandLength * Math.sin(angleRad);
                        // --- FIX: Update existing minute hand and circle, do not create new elements ---
                        minuteHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
                        </svg>`;
                        minuteCircle.style.left = `${endX - 10}px`;
                        minuteCircle.style.top = `${endY - 10}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(label) {
                            label.classList.toggle('selected', parseInt(label.textContent) === minute);
                        });
                    }
                }
                function onMinuteUp(e) {
                    if (draggingMinute) {
                        draggingMinute = false;
                        document.removeEventListener('mousemove', onMinuteDrag);
                        document.removeEventListener('mouseup', onMinuteUp);
                    }
                }
                minuteHand.addEventListener('mousedown', function(e) {
                    draggingMinute = true;
                    e.preventDefault();
                    document.addEventListener('mousemove', onMinuteDrag);
                    document.addEventListener('mouseup', onMinuteUp);
                });

                // Click on minute labels to set minute
                picker.querySelectorAll('.clock-label').forEach(function(label) {
                    label.addEventListener('mousedown', function(e) {
                        minute = parseInt(label.textContent);
                        setInputValue();
                        let angleDeg = minute * 6 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + minuteHandLength * Math.cos(angleRad);
                        let endY = centerY + minuteHandLength * Math.sin(angleRad);
                        minuteHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
                        </svg>`;
                        minuteCircle.style.left = `${endX - 10}px`;
                        minuteCircle.style.top = `${endY - 10}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(l) {
                            l.classList.toggle('selected', parseInt(l.textContent) === minute);
                        });
                    });
                });
            }

            // Draw center dot
            let centerDot = document.createElement('div');
            centerDot.className = 'clock-center-dot';
            centerDot.style.position = 'absolute';
            centerDot.style.left = '50%';
            centerDot.style.top = '50%';
            centerDot.style.width = '18px';
            centerDot.style.height = '18px';
            centerDot.style.background = '#1976d2';
            centerDot.style.borderRadius = '50%';
            centerDot.style.transform = 'translate(-50%, -50%)';
            centerDot.style.zIndex = '20';
            centerDot.style.cursor = 'pointer';
            centerDot.title = 'Reset';
            centerDot.addEventListener('click', function(e) {
                hour = 12;
                minute = 0;
                mode = 'hour';
                setInputValue();
                renderClock();
            });
            picker.appendChild(centerDot);
        }

        // --- new: input box logic for hour/minute switching and syncing ---
        hourInput.addEventListener('focus', function() {
            mode = 'hour';
            renderClock();
        });
        minuteInput.addEventListener('focus', function() {
            mode = 'minute';
            renderClock();
        });

        hourInput.addEventListener('input', function() {
            let val = hourInput.value.replace(/\D/g, '');
            if (val.length > 2) val = val.slice(0, 2);
            let h = parseInt(val, 10);
            if (!isNaN(h)) {
                // Keep within 1-12 range for 12-hour format
                if (h > 12) h = 12;
                if (h < 1) h = 1;
                hour = h;
                
                // Update target input immediately
                if (targetInput) {
                    let formattedMinute = minute < 10 ? '0' + minute : minute;
                    targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
                }
                
                // Update AM/PM button states
                if (amBtn && pmBtn) {
                    amBtn.classList.toggle('selected', ampm === 'AM');
                    pmBtn.classList.toggle('selected', ampm === 'PM');
                }
                
                if (mode !== 'hour') {
                    mode = 'hour';
                    renderClock();
                } else {
                    renderClock();
                }
            }
        });

        minuteInput.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            if (val.length > 2) val = val.slice(0, 2);
            
            // Update the input field with the cleaned value
            this.value = val;
            
            // Clear any existing validation message
            clearValidationMessage();
            
            if (val === '') {
                // Allow empty field - don't update minute variable yet
                return;
            }
            
            let m = parseInt(val, 10);
            if (!isNaN(m)) {
                // Clamp to valid minute range (0-59)
                if (m > 59) {
                    m = 59;
                    this.value = '59';
                    showValidationMessage('Maximum value is 59');
                } else if (m < 0) {
                    m = 0;
                    this.value = '00';
                } else {
                    // Show formatting hint only for single digits that aren't being actively typed
                    if (val.length === 1 && m > 0) {
                        showValidationMessage('Must be formatted as xx (e.g., 05, 15, 30)');
                    }
                }
                
                minute = m;
                // Only update target input, not the minute input field itself
                if (targetInput) {
                    let formattedMinute = minute < 10 ? '0' + minute : minute;
                    targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
                }
                
                // Update AM/PM button states
                if (amBtn && pmBtn) {
                    amBtn.classList.toggle('selected', ampm === 'AM');
                    pmBtn.classList.toggle('selected', ampm === 'PM');
                }
                
                if (mode !== 'minute') {
                    mode = 'minute';
                    renderClock();
                } else {
                    renderClock();
                }
            }
        });
        
        // Handle when user finishes editing minute field
        minuteInput.addEventListener('blur', function() {
            // Auto-format single digits with leading zero when user finishes
            let val = this.value.trim();
            if (val.length === 1 && parseInt(val, 10) >= 0) {
                this.value = '0' + val;
                minute = parseInt(val, 10);
                if (targetInput) {
                    let formattedMinute = minute < 10 ? '0' + minute : minute;
                    targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
                }
            }
            
            setTimeout(() => {
                clearValidationMessage();
            }, 200);
        });

        function getAngleFromEvent(e, center) {
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - center.x;
            let y = (e.touches ? e.touches[0].clientY : e.clientY) - center.y;
            let angle = Math.atan2(y, x) * 180 / Math.PI;
            angle = (angle + 360 + 90) % 360; // 0 is top
            return angle;
        }

        // Show modal logic
        const startInput = document.getElementById(startInputId);
        const endInput = document.getElementById(endInputId);

        function showModal(target) {
            targetInput = target;
            modalOverlay.classList.add('active');
            // Parse value if present
            let val = targetInput.value.trim();
            let match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(val);
            if (match) {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                let ap = match[3] ? match[3].toUpperCase() : 'AM';
                if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
                    hour = h;
                    minute = m;
                    ampm = ap;
                }
            } else {
                hour = 12; minute = 0; ampm = 'AM';
            }
            setInputValue();
            mode = 'hour';
            renderClock();
        }

        startInput.addEventListener('focus', function() {
            showModal(startInput);
        });
        endInput.addEventListener('focus', function() {
            showModal(endInput);
        });

        // Okay/Exit button logic
        okayBtn.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
        });
        exitBtn.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
        });

        // AM/PM selection logic
        function setAMPM(selected) {
            ampm = selected;
            setInputValue(); // This will update both the target input and button states
        }
        
        // Add click effects and event listeners
        if (amBtn && pmBtn) {
            amBtn.addEventListener('click', function() { 
                amBtn.style.transform = 'scale(0.95)';
                amBtn.style.transition = 'transform 0.1s ease';
                setTimeout(() => { 
                    amBtn.style.transform = ''; 
                    amBtn.style.transition = '';
                }, 100);
                setAMPM('AM'); 
            });
            pmBtn.addEventListener('click', function() { 
                pmBtn.style.transform = 'scale(0.95)';
                pmBtn.style.transition = 'transform 0.1s ease';
                setTimeout(() => { 
                    pmBtn.style.transform = ''; 
                    pmBtn.style.transition = '';
                }, 100);
                setAMPM('PM'); 
            });
        }

        // Hide modal when clicking outside content
        modalOverlay.addEventListener('mousedown', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    // Add validation message functions
    function showValidationMessage(message) {
        clearValidationMessage();
        const validationDiv = document.createElement('div');
        validationDiv.id = 'minute-validation-message';
        validationDiv.style.cssText = `
            position: absolute;
            background: #ff9800;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            top: 100%;
            left: 0;
            white-space: nowrap;
            z-index: 1000;
            margin-top: 2px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        validationDiv.textContent = message;
        
        // Position relative to minute input
        if (minuteInput && minuteInput.parentNode) {
            minuteInput.parentNode.style.position = 'relative';
            minuteInput.parentNode.appendChild(validationDiv);
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            clearValidationMessage();
        }, 3000);
    }
    
    function clearValidationMessage() {
        const existing = document.getElementById('minute-validation-message');
        if (existing) {
            existing.remove();
        }
    }

    setupClockModal('event-start', 'event-end');
});
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            clearValidationMessage();
        }, 3000);
    
    
    function clearValidationMessage() {
        const existing = document.getElementById('minute-validation-message');
        if (existing) {
            existing.remove();
        }
    }

    setupClockModal('event-start', 'event-end');

            var currentTitle = formTitle.textContent;
            formTitle.textContent = currentTitle + ' (Further Details)';
        
        
        // Create step 2 elements if they don't exist
        if (!document.getElementById('event-location')) {
            createStep2Elements();
        }
        
        // Show step 2 elements
        showStep2Elements();
        
        // Update button text and functionality
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = editingEvent ? 'Update Event' : 'Create Event';
        }
        
        // Add back button
        if (!document.getElementById('back-btn')) {
            var backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.id = 'back-btn';
            backButton.textContent = 'Back';
            backButton.style.cssText = `
                background: #6c757d;
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 1em;
                cursor: pointer;
                margin-right: 8px;
                transition: background 0.2s;
            `;
            
            backButton.addEventListener('click', function() {
                showFormStep1();
            });
            
            backButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#5a6268';
            });
            
            backButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#6c757d';
            });
            
            submitButton.parentNode.insertBefore(backButton, submitButton);
        }
        
        // Hide delete button in step 2
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton) {
            deleteButton.style.display = 'none';
        }
    

    // Function to show step 1 of the form
    function showFormStep1() {
        currentFormStep = 1;
        
        // Show step 1 elements and their labels
        var step1Elements = [
            document.getElementById('event-title'),
            document.getElementById('event-start'),
            document.getElementById('event-end'),
            document.getElementById('event-category'),
            document.getElementById('event-email')
        ];
        
        step1Elements.forEach(function(el) {
            if (el) {
                // Show the input/select element
                el.style.display = 'block';
                
                // Find and show the associated label
                var labels = document.querySelectorAll('label');
                labels.forEach(function(label) {
                    if (label.getAttribute('for') === el.id || 
                        (label.nextElementSibling === el) ||
                        (el.previousElementSibling === label)) {
                        label.style.display = 'block';
                    }
                });
                
                // Also check previous sibling for labels
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'block';
                }
            }
        });
        
        // Show step 1 labels by text content (failsafe)
        var allLabels = document.querySelectorAll('.event-create-container label');
        allLabels.forEach(function(label) {
            var labelText = label.textContent.trim();
            if (labelText === 'Title:' || labelText === 'Start Time:' || labelText === 'End Time:' ||
                labelText === 'Category:' || labelText === 'Contact Email:') {
                label.style.display = 'block';
            }
        });
        
        // Hide step 2 elements
        hideStep2Elements();
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            var currentTitle = formTitle.textContent.replace(' - Additional Details', '');
            formTitle.textContent = currentTitle;
        }
        
        // Update button text
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Remove back button
        var backButton = document.getElementById('back-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Show delete button in step 1 if editing
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton && editingEvent) {
            deleteButton.style.display = 'inline-block';
        }
    }

    // Function to create step 2 form elements
    function createStep2Elements() {
        var form = createEventForm;
        var submitButton = form.querySelector('button[type="submit"]');
        
        // Create location input
        var locationLabel = document.createElement('label');
        locationLabel.textContent = 'Location (optional):';
        locationLabel.style.display = 'none';
        
        var locationInput = document.createElement('input');
        locationInput.type = 'text';
        locationInput.id = 'event-location';
        locationInput.placeholder = 'Enter event location';
        locationInput.style.display = 'none';
        
        // Create description textarea
        var descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description (optional):';
        descriptionLabel.style.display = 'none';
        
        var descriptionInput = document.createElement('textarea');
        descriptionInput.id = 'event-description';
        descriptionInput.placeholder = 'Enter event description';
        descriptionInput.rows = 4;
        descriptionInput.style.display = 'none';
        
        // Insert before submit button
        form.insertBefore(locationLabel, submitButton);
        form.insertBefore(locationInput, submitButton);
        form.insertBefore(descriptionLabel, submitButton);
        form.insertBefore(descriptionInput, submitButton);
    }

    // Function to show step 2 elements
    function showStep2Elements() {
        var step2Elements = [
            'event-location',
            'event-description'
        ];
        
        step2Elements.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'block';
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'block';
                }
            }
        });
    }

    // Function to hide step 2 elements
    function hideStep2Elements() {
        var step2Elements = [
            'event-location',
            'event-description'
        ];
        
        step2Elements.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'none';
                }
            }
        });
    }

    // Handle event creation form submission
    if (createEventForm) {
        createEventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            console.log("Form submitted, current step:", currentFormStep);
            
            // If we're on step 1, validate and go to step 2
            if (currentFormStep === 1) {
                var title = document.getElementById('event-title').value.trim();
                var startTime = document.getElementById('event-start').value.trim();
                var endTime = document.getElementById('event-end').value.trim();
                
                console.log("Step 1 validation - Title:", title, "Start:", startTime, "End:", endTime);
                
                // Validate required fields
                if (!title) {
                    alert('Please enter an event title');
                    return;
                }
                
                if (!startTime) {
                    alert('Please select a start time');
                    return;
                }
                
                if (!endTime) {
                    alert('Please select an end time');
                    return;
                }
                
                // Validate time logic
                var startParsed = parseTime(startTime);
                var endParsed = parseTime(endTime);
                
                if (!startParsed || !endParsed) {
                    alert('Please enter valid times');
                    return;
                }
                
                // Check if start time is after end time
                if (isStartTimeAfterEndTime(startParsed, endParsed)) {
                    alert('Start time cannot be after end time. Please adjust your times.');
                    return;
                }
                
                showFormStep2();
                return;
            }
            
            // If we're on step 2, create/update the event
            var title = document.getElementById('event-title').value.trim();
            var startTime = document.getElementById('event-start').value;
            var endTime = document.getElementById('event-end').value;
            var categorySelect = document.getElementById('event-category');
            var emailInput = document.getElementById('event-email');
            var locationInput = document.getElementById('event-location');
            var descriptionInput = document.getElementById('event-description');

            console.log("Step 2 - Creating/updating event");

            if (title) {
                // Show loading feedback
                var submitButton = createEventForm.querySelector('button[type="submit"]');
                var originalText = submitButton.textContent;
                submitButton.textContent = 'Saving...';
                submitButton.disabled = true;

                try {
                    // Get additional details
                    var location = locationInput ? locationInput.value.trim() : '';
                    var description = descriptionInput ? descriptionInput.value.trim() : '';
                    
                    // Determine if we're editing or creating
                    if (editingEvent) {
                        // Get selected category color
                        var eventColor = '#3788d8'; // default blue
                        var categoryName = 'Default';
                        if (categorySelect && categorySelect.value) {
                            var selectedOption = categorySelect.options[categorySelect.selectedIndex];
                            if (selectedOption.dataset.color) {
                                eventColor = selectedOption.dataset.color;
                                categoryName = selectedOption.textContent;
                            }
                        }
                        
                        // Parse times
                        var startDate = new Date(editingEvent.start);
                        var endDate = new Date(editingEvent.start);
                        
                        if (startTime) {
                            var startParsed = parseTime(startTime);
                            if (startParsed) {
                                startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            }
                        }
                        
                        if (endTime) {
                            var endParsed = parseTime(endTime);
                            if (endParsed) {
                                endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            }
                        }
                        
                        var contactEmail = emailInput ? emailInput.value.trim() : '';
                        
                        // Update event in Firestore
                        await updateEvent(editingEvent.id, {
                            title: title,
                            start: startDate.toISOString(),
                            end: endDate.toISOString(),
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                            textColor: '#ffffff',
                            category: categoryName,
                            email: contactEmail,
                            location: location,
                            description: description,
                            updatedAt: Date.now()
                        });
                        
                        console.log("Event updated successfully");
                        resetEventForm();
                    } else {
                        // Create new event
                        var currentDate = calendar.view.currentStart; // current day in view
                        var start = new Date(currentDate);
                        var end = new Date(currentDate);
                        
                        if (startTime) {
                            var startParsed = parseTime(startTime);
                            if (startParsed) {
                                start.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            }
                        }
                        if (endTime) {
                            var endParsed = parseTime(endTime);
                            if (endParsed) {
                                end.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            }
                        }
                        
                        // Get selected category color
                        var eventColor = '#3788d8'; // default blue
                        var categoryName = 'Default';
                        if (categorySelect && categorySelect.value) {
                            var selectedOption = categorySelect.options[categorySelect.selectedIndex];
                            if (selectedOption.dataset.color) {
                                eventColor = selectedOption.dataset.color;
                                categoryName = selectedOption.textContent;
                            }
                        }
                        
                        // Get email if provided
                        var contactEmail = emailInput ? emailInput.value.trim() : '';
                        
                        console.log("Creating event with data:", {
                            title: title,
                            start: start.toISOString(),
                            end: end.toISOString(),
                            backgroundColor: eventColor,
                            category: categoryName,
                            email: contactEmail
                        });
                        
                        // Add event to Firestore (not calendar directly - onSnapshot will handle that)
                        await addEvent({
                            title: title,
                            start: start.toISOString(),
                            end: end.toISOString(),
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                            textColor: '#ffffff',
                            category: categoryName,
                            email: contactEmail,
                            location: location,
                            description: description,
                            createdAt: Date.now()
                        });
                        
                        console.log("Event created successfully");
                        
                        // Reset form and go back to step 1 for new event creation
                        createEventForm.reset();
                        resetEventForm();
                        updateCategoryDropdown(); // Reset dropdown to default
                        
                        // Show success feedback
                        submitButton.textContent = 'Event Created!';
                        setTimeout(() => {
                            submitButton.textContent = 'Next';
                            submitButton.disabled = false;
                        }, 1500);
                    }
                } catch (error) {
                    console.error("Error saving event:", error);
                    alert("Error saving event. Please try again.");
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            }
        });
    }

    // --- DELETE EVENT HANDLER (UI + FIREBASE) ---
    function handleDeleteEvent(eventId) {
        // Only remove from Firestore; UI will update via onSnapshot
        deleteEvent(eventId);
    }

    // --- Example: Hook delete button in event edit modal ---
    var submitButton = createEventForm ? createEventForm.querySelector('button[type="submit"]') : null;
    if (!document.getElementById('delete-event-btn') && submitButton) {
        var deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.id = 'delete-event-btn';
        deleteButton.textContent = 'Delete Event';
        deleteButton.style.backgroundColor = '#dc3545';
        deleteButton.style.color = '#fff';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '4px';
        deleteButton.style.padding = '6px 12px';
        deleteButton.style.fontSize = '1em';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.marginLeft = '8px';
        deleteButton.style.transition = 'background 0.2s';

        deleteButton.addEventListener('click', function() {
            if (editingEvent) {
                handleDeleteEvent(editingEvent.id);
                resetEventForm();
            }
        });

        deleteButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#c82333';
        });

        deleteButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#dc3545';
        });

        submitButton.parentNode.appendChild(deleteButton);
    }

    // --- DISPLAY EVENT HELPER ---
    function displayEvent(eventData) {
        calendar.addEvent({
            id: eventData.id,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            allDay: false,
            backgroundColor: eventData.backgroundColor,
            borderColor: eventData.borderColor,
            textColor: eventData.textColor,
            extendedProps: {
                category: eventData.category,
                email: eventData.email,
                location: eventData.location,
                description: eventData.description
            }
        });
    }

    // Local Storage Functions
    function saveEventsToStorage() {
        var events = calendar.getEvents().map(function(event) {
            return {
                id: event.id,
                title: event.title,
                start: event.start ? event.start.toISOString() : null,
                end: event.end ? event.end.toISOString() : null,
                allDay: event.allDay,
                backgroundColor: event.backgroundColor,
                borderColor: event.borderColor,
                textColor: event.textColor,
                extendedProps: event.extendedProps
            };
        });
        localStorage.setItem('wise-ner-events', JSON.stringify(events));
    }

    function loadEventsFromStorage() {
        var storedEvents = localStorage.getItem('wise-ner-events');
        if (storedEvents) {
            try {
                var events = JSON.parse(storedEvents);
                events.forEach(function(eventData) {
                    calendar.addEvent({
                        id: eventData.id,
                        title: eventData.title,
                        start: eventData.start ? new Date(eventData.start) : null,
                        end: eventData.end ? new Date(eventData.end) : null,
                        allDay: eventData.allDay,
                        backgroundColor: eventData.backgroundColor,
                        borderColor: eventData.borderColor,
                        textColor: eventData.textColor,
                        extendedProps: eventData.extendedProps
                    });
                });
            } catch (e) {
                console.error('Error loading events from storage:', e);
            }
        }
    }

    function createLegendItemFromFirestore(color, name, firestoreId) {
        // Make sure legendList exists
        if (!legendList) {
            console.error('Legend list not found');
            return;
        }

        var li = document.createElement('li');
        li.dataset.firestoreId = firestoreId; // Store Firestore ID for updates/deletes

        // Preset color options
        var colors = [
            "#ff0000ff", "#ff7300ff", "#ffae00ff", "#ffff00ff", "#48da74ff",
            "#4c9967ff", "#4f6de4ff", "#a45ff7ff", "#e97bffff",
            "#e2a6d0ff"
        ];

        // Color circle
        var colorCircle = document.createElement('span');
        colorCircle.className = 'legend-color-circle';
        colorCircle.style.background = color;
        colorCircle.style.marginRight = '8px';

        // Color menu (hidden by default)
        var colorMenu = document.createElement('div');
        colorMenu.className = 'legend-color-menu';
        colorMenu.style.display = 'none';

        colors.forEach(function(colorOption) {
            var colorOptionElement = document.createElement('span');
            colorOptionElement.className = 'legend-color-option';
            colorOptionElement.style.background = colorOption;
            colorOptionElement.setAttribute('data-color', colorOption);
            colorOptionElement.addEventListener('click', async function(e) {
                colorCircle.style.background = colorOption;
                colorMenu.style.display = 'none';
                // Update in Firestore instead of localStorage
                await updateLegendItem(firestoreId, {
                    color: colorOption,
                    name: name,
                    updatedAt: Date.now()
                });
            });
            colorMenu.appendChild(colorOptionElement);
        });

        // Show/hide color menu on circle click
        colorCircle.addEventListener('click', function(e) {
            e.stopPropagation();
            colorMenu.style.display = colorMenu.style.display === 'none' ? 'grid' : 'none';
        });

        // Hide color menu if clicking elsewhere
        document.addEventListener('click', function() {
            colorMenu.style.display = 'none';
        });

        // Category name display
        var nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.className = 'legend-name-text';
        nameSpan.style.flex = '1';
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.padding = '2px 6px';
        nameSpan.style.borderRadius = '4px';

        // Create input for editing
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'legend-name-input';
        nameInput.style.flex = '1';
        nameInput.style.fontSize = '1em';
        nameInput.style.border = '1px solid #ccc';
        nameInput.style.borderRadius = '4px';
        nameInput.style.padding = '2px 6px';

        // Double-click to edit
        nameSpan.addEventListener('dblclick', function() {
            li.replaceChild(nameInput, nameSpan);
            nameInput.value = nameSpan.textContent;
            nameInput.focus();
        });

        // Save on Enter or blur
        async function saveNameEdit() {
            var value = nameInput.value.trim() || 'Unnamed';
            nameSpan.textContent = value;
            li.replaceChild(nameSpan, nameInput);
            // Update in Firestore instead of localStorage
            await updateLegendItem(firestoreId, {
                color: color,
                name: value,
                updatedAt: Date.now()
            });
        }

        nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNameEdit();
            }
        });

        nameInput.addEventListener('blur', saveNameEdit);

        // Add delete functionality with right-click
        li.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (confirm('Delete this legend item?')) {
                // Delete from Firestore instead of just removing from UI
                deleteLegendItem(firestoreId);
            }
        });

        li.appendChild(colorCircle);
        li.appendChild(colorMenu);
        li.appendChild(nameSpan);
        legendList.appendChild(li);
    }

    function createLegendItem(color, name) {
        // This function now just calls the Firestore version
        createLegendItemFromFirestore(color, name, null);
    }

    // Legend functionality - Define variables first
    var legendList = document.getElementById('legend-list');
    var addKeyBtn = document.getElementById('add-key-btn');

    // Remove localStorage loading - now handled by Firebase
    // loadLegendFromStorage();

    // Global variable to track if we're editing an event
    var editingEvent = null;

    // Global variable to track current form step
    var currentFormStep = 1;

    // Function to open event edit modal
    function openEventEditModal(event) {
        editingEvent = event;
        
        // Reset to step 1
        showFormStep1();
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Edit Event';
        }
        
        // Add exit button if it doesn't exist
        if (!document.getElementById('edit-exit-btn')) {
            var exitButton = document.createElement('button');
            exitButton.type = 'button';
            exitButton.id = 'edit-exit-btn';
            exitButton.innerHTML = '&times;';
            exitButton.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                font-weight: bold;
                color: #666;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s, color 0.2s;
                z-index: 10;
            `;
            
            exitButton.addEventListener('click', function() {
                resetEventForm();
                // Return to appropriate view based on current calendar view
                if (calendar.view.type === 'timeGridDay') {
                    // Stay in day view but reset form
                } else {
                    // Go back to month view or previous view
                    calendar.changeView('dayGridMonth');
                }
            });
            
            exitButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
                this.style.color = '#333';
            });
            
            exitButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
                this.style.color = '#666';
            });
            
            // Make the event container positioned relative for absolute positioning
            eventCreateContainer.style.position = 'relative';
            eventCreateContainer.appendChild(exitButton);
        }
        
        // Populate form with event data
        var titleInput = document.getElementById('event-title');
        var startInput = document.getElementById('event-start');
        var endInput = document.getElementById('event-end');
        var categorySelect = document.getElementById('event-category');
        var emailInput = document.getElementById('event-email');
        var locationInput = document.getElementById('event-location');
        var descriptionInput = document.getElementById('event-description');
        
        if (titleInput) titleInput.value = event.title || '';
        
        // Format times for display
        if (event.start && startInput) {
            var startTime = event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
            startInput.value = startTime;
        }
        
        if (event.end && endInput) {
            var endTime = event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
            endInput.value = endTime;
        }
        
        // Set category if it exists
        if (categorySelect && event.extendedProps && event.extendedProps.category) {
            var categoryValue = event.extendedProps.category;
            for (var i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].textContent === categoryValue) {
                    categorySelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Set email if it exists
        if (emailInput && event.extendedProps && event.extendedProps.email) {
            emailInput.value = event.extendedProps.email;
        }
        
        // Set location and description if they exist
        if (locationInput && event.extendedProps && event.extendedProps.location) {
            locationInput.value = event.extendedProps.location;
        }
        
        if (descriptionInput && event.extendedProps && event.extendedProps.description) {
            descriptionInput.value = event.extendedProps.description;
        }
        
        // Change submit button to update button and add delete button
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Add delete button if it doesn't exist
        if (!document.getElementById('delete-event-btn')) {
            var deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.id = 'delete-event-btn';
            deleteButton.textContent = 'Delete Event';
            deleteButton.style.backgroundColor = '#dc3545';
            deleteButton.style.color = '#fff';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.padding = '6px 12px';
            deleteButton.style.fontSize = '1em';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.marginLeft = '8px';
            deleteButton.style.transition = 'background 0.2s';
            
            deleteButton.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this event?')) {
                    if (editingEvent) {
                        // Delete from Firestore instead of just removing from calendar
                        handleDeleteEvent(editingEvent.id);
                        resetEventForm();
                    }
                }
            });
            
            deleteButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#c82333';
            });
            
            deleteButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#dc3545';
            });
            
            submitButton.parentNode.appendChild(deleteButton);
        }
        
        // Show the event create container
        if (legendContainer) legendContainer.style.display = 'none';
        if (eventCreateContainer) eventCreateContainer.style.display = '';
    }

    // Function to reset the event form to create mode
    function resetEventForm() {
        editingEvent = null;
        currentFormStep = 1;
        
        // Reset to step 1
        showFormStep1();
        
        // Reset form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Create Event';
        }
        
        // Clear form
        if (createEventForm) {
            createEventForm.reset();
        }
        
        // Reset submit button
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Remove delete button
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton) {
            deleteButton.remove();
        }
        
        // Remove exit button
        var exitButton = document.getElementById('edit-exit-btn');
        if (exitButton) {
            exitButton.remove();
        }
        
        // Remove back button
        var backButton = document.getElementById('back-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Reset dropdown
        updateCategoryDropdown();
    }

    // Function to show step 2 of the form
    function showFormStep2() {
        currentFormStep = 2;
        
        // Hide step 1 elements and their labels
        var step1Elements = [
            document.getElementById('event-title'),
            document.getElementById('event-start'),
            document.getElementById('event-end'),
            document.getElementById('event-category'),
            document.getElementById('event-email')
        ];
        
        step1Elements.forEach(function(el) {
            if (el) {
                // Hide the input/select element
                el.style.display = 'none';
                
                // Find and hide the associated label
                var labels = document.querySelectorAll('label');
                labels.forEach(function(label) {
                    if (label.getAttribute('for') === el.id || 
                        (label.nextElementSibling === el) ||
                        (el.previousElementSibling === label)) {
                        label.style.display = 'none';
                    }
                });
                
                // Also check previous sibling for labels
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'none';
                }
            }
        });
        
        // Also hide any remaining labels by text content (failsafe)
        var allLabels = document.querySelectorAll('.event-create-container label');
        allLabels.forEach(function(label) {
            var labelText = label.textContent.trim();
            if (labelText === 'Title:' || labelText === 'Start Time:' || labelText === 'End Time:') {
                label.style.display = 'none';
            }
        });
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            var currentTitle = formTitle.textContent;
            formTitle.textContent = currentTitle + ' (Further Details)';
        }
        
        // Create step 2 elements if they don't exist
        if (!document.getElementById('event-location')) {
            createStep2Elements();
        }
        
        // Show step 2 elements
        showStep2Elements();
        
        // Update button text and functionality
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = editingEvent ? 'Update Event' : 'Create Event';
        }
        
        // Add back button
        if (!document.getElementById('back-btn')) {
            var backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.id = 'back-btn';
            backButton.textContent = 'Back';
            backButton.style.cssText = `
                background: #6c757d;
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 1em;
                cursor: pointer;
                margin-right: 8px;
                transition: background 0.2s;
            `;
            
            backButton.addEventListener('click', function() {
                showFormStep1();
            });
            
            backButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#5a6268';
            });
            
            backButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#6c757d';
            });
            
            submitButton.parentNode.insertBefore(backButton, submitButton);
        }
        
        // Hide delete button in step 2
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton) {
            deleteButton.style.display = 'none';
        }
    }

    // Function to show step 1 of the form
    function showFormStep1() {
        currentFormStep = 1;
        
        // Show step 1 elements and their labels
        var step1Elements = [
            document.getElementById('event-title'),
            document.getElementById('event-start'),
            document.getElementById('event-end'),
            document.getElementById('event-category'),
            document.getElementById('event-email')
        ];
        
        step1Elements.forEach(function(el) {
            if (el) {
                // Show the input/select element
                el.style.display = 'block';
                
                // Find and show the associated label
                var labels = document.querySelectorAll('label');
                labels.forEach(function(label) {
                    if (label.getAttribute('for') === el.id || 
                        (label.nextElementSibling === el) ||
                        (el.previousElementSibling === label)) {
                        label.style.display = 'block';
                    }
                });
                
                // Also check previous sibling for labels
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'block';
                }
            }
        });
        
        // Show step 1 labels by text content (failsafe)
        var allLabels = document.querySelectorAll('.event-create-container label');
        allLabels.forEach(function(label) {
            var labelText = label.textContent.trim();
            if (labelText === 'Title:' || labelText === 'Start Time:' || labelText === 'End Time:' ||
                labelText === 'Category:' || labelText === 'Contact Email:') {
                label.style.display = 'block';
            }
        });
        
        // Hide step 2 elements
        hideStep2Elements();
        
        // Update form title
        var formTitle = eventCreateContainer.querySelector('h2');
        if (formTitle) {
            var currentTitle = formTitle.textContent.replace(' - Additional Details', '');
            formTitle.textContent = currentTitle;
        }
        
        // Update button text
        var submitButton = createEventForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Next';
        }
        
        // Remove back button
        var backButton = document.getElementById('back-btn');
        if (backButton) {
            backButton.remove();
        }
        
        // Show delete button in step 1 if editing
        var deleteButton = document.getElementById('delete-event-btn');
        if (deleteButton && editingEvent) {
            deleteButton.style.display = 'inline-block';
        }
    }

    // Function to create step 2 form elements
    function createStep2Elements() {
        var form = createEventForm;
        var submitButton = form.querySelector('button[type="submit"]');
        
        // Create location input
        var locationLabel = document.createElement('label');
        locationLabel.textContent = 'Location (optional):';
        locationLabel.style.display = 'none';
        
        var locationInput = document.createElement('input');
        locationInput.type = 'text';
        locationInput.id = 'event-location';
        locationInput.placeholder = 'Enter event location';
        locationInput.style.display = 'none';
        
        // Create description textarea
        var descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description (optional):';
        descriptionLabel.style.display = 'none';
        
        var descriptionInput = document.createElement('textarea');
        descriptionInput.id = 'event-description';
        descriptionInput.placeholder = 'Enter event description';
        descriptionInput.rows = 4;
        descriptionInput.style.display = 'none';
        
        // Insert before submit button
        form.insertBefore(locationLabel, submitButton);
        form.insertBefore(locationInput, submitButton);
        form.insertBefore(descriptionLabel, submitButton);
        form.insertBefore(descriptionInput, submitButton);
    }

    // Function to show step 2 elements
    function showStep2Elements() {
        var step2Elements = [
            'event-location',
            'event-description'
        ];
        
        step2Elements.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'block';
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'block';
                }
            }
        });
    }

    // Function to hide step 2 elements
    function hideStep2Elements() {
        var step2Elements = [
            'event-location',
            'event-description'
        ];
        
        step2Elements.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                if (el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
                    el.previousElementSibling.style.display = 'none';
                }
            }
        });
    }

    // Helper function to parse time
    function parseTime(timeStr) {
        if (!timeStr) return null;
        // Handle AM/PM format: "12:30 PM" or "1:45 AM"
        var match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
            var h = parseInt(match[1], 10);
            var m = parseInt(match[2], 10);
            var ampm = match[3].toUpperCase();
            
            // Convert to 24-hour format
            if (ampm === 'PM' && h !== 12) {
                h += 12;
            } else if (ampm === 'AM' && h === 12) {
                h = 0;
            }
            
            return { hours: h, minutes: m, ampm: ampm };
        }
        
        // Fallback: try 24-hour format "14:30"
        var parts = timeStr.split(':');
        if (parts.length === 2) {
            return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) };
        }
        
        return null;
    }

    // Helper function to check if start time is after end time
    function isStartTimeAfterEndTime(startParsed, endParsed) {
        // Convert both times to minutes since midnight for comparison
        var startMinutes = startParsed.hours * 60 + startParsed.minutes;
        var endMinutes = endParsed.hours * 60 + endParsed.minutes;
        
        // Start time cannot be after or equal to end time
        return startMinutes >= endMinutes;
    }

    // Function to update the category dropdown with current legend items
    function updateCategoryDropdown() {
        var categorySelect = document.getElementById('event-category');
        if (!categorySelect) {
            // Create the dropdown if it doesn't exist
            createCategoryDropdown();
            categorySelect = document.getElementById('event-category');
        }
        
        // Clear existing options except default
        categorySelect.innerHTML = '<option value="">No Category (Default)</option>';
        
        // Add options from legend
        if (legendList) {
            var legendItems = legendList.querySelectorAll('li');
            legendItems.forEach(function(li) {
                var colorCircle = li.querySelector('.legend-color-circle');
                var nameText = li.querySelector('.legend-name-text');
                
                if (colorCircle && nameText) {
                    var option = document.createElement('option');
                    option.value = nameText.textContent;
                    option.textContent = nameText.textContent;
                    option.dataset.color = colorCircle.style.background;
                    categorySelect.appendChild(option);
                }
            });
        }
    }
    
    // Function to create the category dropdown
    function createCategoryDropdown() {
        var eventCreateContainer = document.getElementById('event-create-container');
        if (!eventCreateContainer) return;
        
        var form = eventCreateContainer.querySelector('form');
        if (!form) return;
        
        // Check if elements already exist to prevent duplication
        if (document.getElementById('event-category') && document.getElementById('event-email')) {
            return; // Elements already exist, no need to create them again
        }
        
        // Find the submit button to insert before it
        var submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;
        
        // Create category selection elements only if they don't exist
        if (!document.getElementById('event-category')) {
            var categoryLabel = document.createElement('label');
            categoryLabel.textContent = 'Category:';
            
            var categorySelect = document.createElement('select');
            categorySelect.id = 'event-category';
            
            // Insert before submit button
            form.insertBefore(categoryLabel, submitButton);
            form.insertBefore(categorySelect, submitButton);
        }
        
        // Create email input elements only if they don't exist
        if (!document.getElementById('event-email')) {
            var emailLabel = document.createElement('label');
            emailLabel.textContent = 'Contact Email:';
            
            var emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.id = 'event-email';
            emailInput.placeholder = 'Enter contact email';
            emailInput.required = true;
            
            // Insert before submit button
            form.insertBefore(emailLabel, submitButton);
            form.insertBefore(emailInput, submitButton);
        }
        
        // Initial population
        updateCategoryDropdown();
    }
    
    // Create the dropdown and step 2 elements when the page loads
    createCategoryDropdown();
    if (createEventForm) {
        createStep2Elements();
    }

    // Add legend button functionality
    if (addKeyBtn) {
        addKeyBtn.addEventListener('click', async function() {
            console.log('Adding new legend item');
            
            // Preset color options add strong + pastel colors
            var colors = [
                "#ff0000ff", "#ff7300ff", "#ffae00ff", "#ffff00ff", "#48da74ff",
                "#4c9967ff", "#4f6de4ff", "#a45ff7ff", "#e97bffff",
                "#e2a6d0ff"
            ];

            // Create new legend item in Firestore
            await addLegendItem({
                color: colors[0],
                name: 'New Category',
                createdAt: Date.now()
            });
        });
    }

    function setupClockModal(startInputId, endInputId) {
        const modalOverlay = document.getElementById('clock-modal-overlay');
        const modalContent = document.getElementById('clock-modal-content');
        const picker = document.getElementById('clock-modal-picker');
        const hourInput = document.getElementById('clock-modal-hour');
        const minuteInput = document.getElementById('clock-modal-minute');
        const amBtn = document.getElementById('clock-modal-am');
        const pmBtn = document.getElementById('clock-modal-pm');
        const okayBtn = document.getElementById('clock-modal-okay');
        const exitBtn = document.getElementById('clock-modal-exit');
        let targetInput = null;
        let mode = 'hour';
        let hour = 12, minute = 0, ampm = 'AM';

        function setInputValue() {
            // Format minute with leading zero if needed for target input
            let formattedMinute = minute < 10 ? '0' + minute : minute;
            if (targetInput) targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
            if (hourInput) hourInput.value = hour;
            // Only update minute input if it's not currently being edited
            if (minuteInput && document.activeElement !== minuteInput) {
                minuteInput.value = formattedMinute;
            }
            
            // Update AM/PM button states
            if (amBtn && pmBtn) {
                amBtn.classList.toggle('selected', ampm === 'AM');
                pmBtn.classList.toggle('selected', ampm === 'PM');
            }
        }

        function renderClock() {
            picker.innerHTML = '';
            picker.style.opacity = 1;

            // Draw clock face (circle + ticks)
            let face = document.createElement('div');
            face.className = 'clock-face';
            picker.appendChild(face);

            // Center for calculations
            const centerX = 110;
            const centerY = 110;
            const hourRadius = 80;
            const minuteRadius = 90;

            if (mode === 'hour') {
                // Draw hour labels (1-12) in a perfect circle, center each label box on the circle
                for (let i = 1; i <= 12; i++) {
                    let angle = (i - 3) * (Math.PI * 2) / 12;
                    let x = centerX + hourRadius * Math.cos(angle) - 16;
                    let y = centerY + hourRadius * Math.sin(angle) - 16;
                    let label = document.createElement('div');
                    label.className = 'clock-label' + (hour === i ? ' selected' : '');
                    label.style.left = `${x}px`;
                    label.style.top = `${y}px`;
                    label.textContent = i;
                    picker.appendChild(label);
                }
            } else {
                // Draw minute labels (00, 05, ..., 55) in a perfect circle, center each label box on the circle
                for (let i = 0; i < 60; i += 5) {
                    let angle = (i / 5 - 3) * (Math.PI * 2) / 12;
                    let x = centerX + minuteRadius * Math.cos(angle) - 16;
                    let y = centerY + minuteRadius * Math.sin(angle) - 16;
                    let label = document.createElement('div');
                    label.className = 'clock-label' + (minute === i ? ' selected' : '');
                    label.style.left = `${x}px`;
                    label.style.top = `${y}px`;
                    label.textContent = (i < 10 ? '0' : '') + i;
                    picker.appendChild(label);
                }
            }

            // Draw both hands for aesthetics, but only one is interactive at a time
            // --- HOUR HAND ---
            let hourAngleDeg = (hour % 12) * 30 - 90;
            let hourAngleRad = hourAngleDeg * Math.PI / 180;
            let hourHandLength = hourRadius - 12;
            let hourEndX = centerX + hourHandLength * Math.cos(hourAngleRad);
            let hourEndY = centerY + hourHandLength * Math.sin(hourAngleRad);

            let hourHand = document.createElement('div');
            hourHand.className = 'clock-hour-hand';
            hourHand.style.position = 'absolute';
            hourHand.style.left = '0';
            hourHand.style.top = '0';
            hourHand.style.width = '220px';
            hourHand.style.height = '220px';
            hourHand.style.background = 'none';
            hourHand.style.zIndex = '10';
            hourHand.style.cursor = 'pointer';
            hourHand.style.pointerEvents = 'auto';
            hourHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                <line x1="${centerX}" y1="${centerY}" x2="${hourEndX}" y2="${hourEndY}" stroke="#1976d2" stroke-width="6" stroke-linecap="round"/>
            </svg>`;
            picker.appendChild(hourHand);

            let hourCircle = document.createElement('div');
            hourCircle.className = 'clock-hand-circle';
            hourCircle.style.left = `${hourEndX - 12}px`;
            hourCircle.style.top = `${hourEndY - 12}px`;
            picker.appendChild(hourCircle);

            // --- MINUTE HAND ---
            let minuteAngleDeg = minute * 6 - 90;
            let minuteAngleRad = minuteAngleDeg * Math.PI / 180;
            let minuteHandLength = minuteRadius - 10;
            let minuteEndX = centerX + minuteHandLength * Math.cos(minuteAngleRad);
            let minuteEndY = centerY + minuteHandLength * Math.sin(minuteAngleRad);

            let minuteHand = document.createElement('div');
            minuteHand.className = 'clock-minute-hand';
            minuteHand.style.position = 'absolute';
            minuteHand.style.left = '0';
            minuteHand.style.top = '0';
            minuteHand.style.width = '220px';
            minuteHand.style.height = '220px';
            minuteHand.style.background = 'none';
            minuteHand.style.zIndex = '9';
            minuteHand.style.cursor = 'pointer';
            minuteHand.style.pointerEvents = 'auto';
            minuteHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                <line x1="${centerX}" y1="${centerY}" x2="${minuteEndX}" y2="${minuteEndY}" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
            </svg>`;
            picker.appendChild(minuteHand);

            let minuteCircle = document.createElement('div');
            minuteCircle.className = 'clock-hand-circle minute';
            minuteCircle.style.left = `${minuteEndX - 10}px`;
            minuteCircle.style.top = `${minuteEndY - 10}px`;
            picker.appendChild(minuteCircle);

            // Only allow interaction with the active hand
            if (mode === 'hour') {
                hourHand.style.zIndex = '20';
                hourCircle.style.zIndex = '21';
                minuteHand.style.opacity = '0.3';
                minuteCircle.style.opacity = '0.3';
                // Drag logic for hour hand
                let draggingHour = false;
                function onHourDrag(e) {
                    if (draggingHour) {
                        let rect = picker.getBoundingClientRect();
                        let center = { x: rect.left + centerX, y: rect.top + centerY };
                        let angle = getAngleFromEvent(e, center);
                        let h = Math.round(angle / 30) || 12;
                        hour = h > 12 ? h - 12 : h;
                        setInputValue();
                        let angleDeg = (hour % 12) * 30 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + hourHandLength * Math.cos(angleRad);
                        let endY = centerY + hourHandLength * Math.sin(angleRad);
                        hourHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#1976d2" stroke-width="6" stroke-linecap="round"/>
                        </svg>`;
                        hourCircle.style.left = `${endX - 12}px`;
                        hourCircle.style.top = `${endY - 12}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(label) {
                            label.classList.toggle('selected', parseInt(label.textContent) === hour);
                        });
                    }
                }
                function onHourUp(e) {
                    if (draggingHour) {
                        draggingHour = false;
                        document.removeEventListener('mousemove', onHourDrag);
                        document.removeEventListener('mouseup', onHourUp);
                        mode = 'minute';
                        renderClock();
                    }
                }
                hourHand.addEventListener('mousedown', function(e) {
                    draggingHour = true;
                    e.preventDefault();
                    document.addEventListener('mousemove', onHourDrag);
                    document.addEventListener('mouseup', onHourUp);
                });

                // Click on hour labels to set hour and switch to minute mode
                picker.querySelectorAll('.clock-label').forEach(function(label) {
                    label.addEventListener('mousedown', function(e) {
                        hour = parseInt(label.textContent);
                        setInputValue();
                        let angleDeg = (hour % 12) * 30 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + hourHandLength * Math.cos(angleRad);
                        let endY = centerY + hourHandLength * Math.sin(angleRad);
                        hourHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#1976d2" stroke-width="6" stroke-linecap="round"/>
                        </svg>`;
                        hourCircle.style.left = `${endX - 12}px`;
                        hourCircle.style.top = `${endY - 12}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(l) {
                            l.classList.toggle('selected', parseInt(l.textContent) === hour);
                        });
                    });
                    label.addEventListener('mouseup', function(e) {
                        hour = parseInt(label.textContent);
                        setInputValue();
                        mode = 'minute';
                        renderClock();
                    });
                });
            } else {
                minuteHand.style.zIndex = '20';
                minuteCircle.style.zIndex = '21';
                hourHand.style.opacity = '0.3';
                hourCircle.style.opacity = '0.3';
                // Drag logic for minute hand
                let draggingMinute = false;
                function onMinuteDrag(e) {
                    if (draggingMinute) {
                        let rect = picker.getBoundingClientRect();
                        let center = { x: rect.left + centerX, y: rect.top + centerY };
                        let angle = getAngleFromEvent(e, center);
                        let m = Math.round(angle / 6) % 60;
                        m = m < 0 ? m + 60 : m;
                        minute = m;
                        setInputValue();
                        let angleDeg = minute * 6 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + minuteHandLength * Math.cos(angleRad);
                        let endY = centerY + minuteHandLength * Math.sin(angleRad);

                        let minuteHand = document.createElement('div');
                        minuteHand.className = 'clock-minute-hand';
                        minuteHand.style.position = 'absolute';
                        minuteHand.style.left = '0';
                        minuteHand.style.top = '0';
                        minuteHand.style.width = '220px';
                        minuteHand.style.height = '220px';
                        minuteHand.style.background = 'none';
                        minuteHand.style.zIndex = '9';
                        minuteHand.style.cursor = 'pointer';
                        minuteHand.style.pointerEvents = 'auto';
                        minuteHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
                        </svg>`;
                        picker.appendChild(minuteHand);

                        let minuteCircle = document.createElement('div');
                        minuteCircle.className = 'clock-hand-circle minute';
                        minuteCircle.style.left = `${minuteEndX - 10}px`;
                        minuteCircle.style.top = `${minuteEndY - 10}px`;
                        picker.appendChild(minuteCircle);

                        picker.querySelectorAll('.clock-label').forEach(function(label) {
                            label.classList.toggle('selected', parseInt(label.textContent) === minute);
                        });
                    }
                }
                function onMinuteUp(e) {
                    if (draggingMinute) {
                        draggingMinute = false;
                        document.removeEventListener('mousemove', onMinuteDrag);
                        document.removeEventListener('mouseup', onMinuteUp);
                    }
                }
                minuteHand.addEventListener('mousedown', function(e) {
                    draggingMinute = true;
                    e.preventDefault();
                    document.addEventListener('mousemove', onMinuteDrag);
                    document.addEventListener('mouseup', onMinuteUp);
                });

                // Click on minute labels to set minute
                picker.querySelectorAll('.clock-label').forEach(function(label) {
                    label.addEventListener('mousedown', function(e) {
                        minute = parseInt(label.textContent);
                        setInputValue();
                        let angleDeg = minute * 6 - 90;
                        let angleRad = angleDeg * Math.PI / 180;
                        let endX = centerX + minuteHandLength * Math.cos(angleRad);
                        let endY = centerY + minuteHandLength * Math.sin(angleRad);
                        minuteHand.innerHTML = `<svg width="220" height="220" style="pointer-events:none;">
                            <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
                        </svg>`;
                        minuteCircle.style.left = `${endX - 10}px`;
                        minuteCircle.style.top = `${endY - 10}px`;
                        picker.querySelectorAll('.clock-label').forEach(function(l) {
                            l.classList.toggle('selected', parseInt(l.textContent) === minute);
                        });
                    });
                });
            }

            // Draw center dot
            let centerDot = document.createElement('div');
            centerDot.className = 'clock-center-dot';
            centerDot.style.position = 'absolute';
            centerDot.style.left = '50%';
            centerDot.style.top = '50%';
            centerDot.style.width = '18px';
            centerDot.style.height = '18px';
            centerDot.style.background = '#1976d2';
            centerDot.style.borderRadius = '50%';
            centerDot.style.transform = 'translate(-50%, -50%)';
            centerDot.style.zIndex = '20';
            centerDot.style.cursor = 'pointer';
            centerDot.title = 'Reset';
            centerDot.addEventListener('click', function(e) {
                hour = 12;
                minute = 0;
                mode = 'hour';
                setInputValue();
                renderClock();
            });
            picker.appendChild(centerDot);
        }

        // --- new: input box logic for hour/minute switching and syncing ---
        hourInput.addEventListener('focus', function() {
            mode = 'hour';
            renderClock();
        });
        minuteInput.addEventListener('focus', function() {
            mode = 'minute';
            renderClock();
        });

        hourInput.addEventListener('input', function() {
            let val = hourInput.value.replace(/\D/g, '');
            if (val.length > 2) val = val.slice(0, 2);
            let h = parseInt(val, 10);
            if (!isNaN(h)) {
                // Keep within 1-12 range for 12-hour format
                if (h > 12) h = 12;
                if (h < 1) h = 1;
                hour = h;
                
                // Update target input immediately
                if (targetInput) {
                    let formattedMinute = minute < 10 ? '0' + minute : minute;
                    targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
                }
                
                // Update AM/PM button states
                if (amBtn && pmBtn) {
                    amBtn.classList.toggle('selected', ampm === 'AM');
                    pmBtn.classList.toggle('selected', ampm === 'PM');
                }
                
                if (mode !== 'hour') {
                    mode = 'hour';
                    renderClock();
                } else {
                    renderClock();
                }
            }
        });

        minuteInput.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            if (val.length > 2) val = val.slice(0, 2);
            
            // Update the input field with the cleaned value
            this.value = val;
            
            // Clear any existing validation message
            clearValidationMessage();
            
            if (val === '') {
                // Allow empty field - don't update minute variable yet
                return;
            }
            
            let m = parseInt(val, 10);
            if (!isNaN(m)) {
                // Clamp to valid minute range (0-59)
                if (m > 59) {
                    m = 59;
                    this.value = '59';
                    showValidationMessage('Maximum value is 59');
                } else if (m < 0) {
                    m = 0;
                    this.value = '00';
                } else {
                    // Show formatting hint only for single digits that aren't being actively typed
                    if (val.length === 1 && m > 0) {
                        showValidationMessage('Must be formatted as xx (e.g., 05, 15, 30)');
                    }
                }
                
                minute = m;
                // Only update target input, not the minute input field itself
                if (targetInput) {
                    let formattedMinute = minute < 10 ? '0' + minute : minute;
                    targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
                }
                
                // Update AM/PM button states
                if (amBtn && pmBtn) {
                    amBtn.classList.toggle('selected', ampm === 'AM');
                    pmBtn.classList.toggle('selected', ampm === 'PM');
                }
                
                if (mode !== 'minute') {
                    mode = 'minute';
                    renderClock();
                } else {
                    renderClock();
                }
            }
        });
        
        // Handle when user finishes editing minute field
        minuteInput.addEventListener('blur', function() {
            // Auto-format single digits with leading zero when user finishes
            let val = this.value.trim();
            if (val.length === 1 && parseInt(val, 10) >= 0) {
                this.value = '0' + val;
                minute = parseInt(val, 10);
                if (targetInput) {
                    let formattedMinute = minute < 10 ? '0' + minute : minute;
                    targetInput.value = `${hour}:${formattedMinute} ${ampm}`;
                }
            }
            
            setTimeout(() => {
                clearValidationMessage();
            }, 200);
        });

        function getAngleFromEvent(e, center) {
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - center.x;
            let y = (e.touches ? e.touches[0].clientY : e.clientY) - center.y;
            let angle = Math.atan2(y, x) * 180 / Math.PI;
            angle = (angle + 360 + 90) % 360; // 0 is top
            return angle;
        }

        // Show modal logic
        const startInput = document.getElementById(startInputId);
        const endInput = document.getElementById(endInputId);

        function showModal(target) {
            targetInput = target;
            modalOverlay.classList.add('active');
            // Parse value if present
            let val = targetInput.value.trim();
            let match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(val);
            if (match) {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                let ap = match[3] ? match[3].toUpperCase() : 'AM';
                if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
                    hour = h;
                    minute = m;
                    ampm = ap;
                }
            } else {
                hour = 12; minute = 0; ampm = 'AM';
            }
            setInputValue();
            mode = 'hour';
            renderClock();
        }

        startInput.addEventListener('focus', function() {
            showModal(startInput);
        });
        endInput.addEventListener('focus', function() {
            showModal(endInput);
        });

        // Okay/Exit button logic
        okayBtn.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
        });
        exitBtn.addEventListener('click', function() {
            modalOverlay.classList.remove('active');
        });

        // AM/PM selection logic
        function setAMPM(selected) {
            ampm = selected;
            setInputValue(); // This will update both the target input and button states
        }
        
        // Add click effects and event listeners
        if (amBtn && pmBtn) {
            amBtn.addEventListener('click', function() { 
                amBtn.style.transform = 'scale(0.95)';
                amBtn.style.transition = 'transform 0.1s ease';
                setTimeout(() => { 
                    amBtn.style.transform = ''; 
                    amBtn.style.transition = '';
                }, 100);
                setAMPM('AM'); 
            });
            pmBtn.addEventListener('click', function() { 
                pmBtn.style.transform = 'scale(0.95)';
                pmBtn.style.transition = 'transform 0.1s ease';
                setTimeout(() => { 
                    pmBtn.style.transform = ''; 
                    pmBtn.style.transition = '';
                }, 100);
                setAMPM('PM'); 
            });
        }

        // Hide modal when clicking outside content
        modalOverlay.addEventListener('mousedown', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    // Add validation message functions
    function showValidationMessage(message) {
        clearValidationMessage();
        const validationDiv = document.createElement('div');
        validationDiv.id = 'minute-validation-message';
        validationDiv.style.cssText = `
            position: absolute;
            background: #ff9800;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            top: 100%;
            left: 0;
            white-space: nowrap;
            z-index: 1000;
            margin-top: 2px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        validationDiv.textContent = message;
        
        // Position relative to minute input
        if (minuteInput && minuteInput.parentNode) {
            minuteInput.parentNode.style.position = 'relative';
            minuteInput.parentNode.appendChild(validationDiv);
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            clearValidationMessage();
        }, 3000);
    }
    
    function clearValidationMessage() {
        const existing = document.getElementById('minute-validation-message');
        if (existing) {
            existing.remove();
        }
    }

    setupClockModal('event-start', 'event-end');


