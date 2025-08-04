document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var legendContainer = document.getElementById('legend-container');
    var eventCreateContainer = document.getElementById('event-create-container');
    var createEventForm = document.getElementById('create-event-form');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
        }
    });
    calendar.render();

    // Handle event creation form submission
    if (createEventForm) {
        createEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var title = document.getElementById('event-title').value.trim();
            var startTime = document.getElementById('event-start').value;
            var endTime = document.getElementById('event-end').value;
            var date = calendar.view.currentStart; // current day in view

            if (title) {
                var start = date;
                var end = date;
                if (startTime) {
                    start = new Date(date);
                    var [h, m] = startTime.split(':');
                    start.setHours(h, m, 0, 0);
                }
                if (endTime) {
                    end = new Date(date);
                    var [h, m] = endTime.split(':');
                    end.setHours(h, m, 0, 0);
                }
                calendar.addEvent({
                    title: title,
                    start: start,
                    end: endTime ? end : undefined,
                    allDay: !startTime && !endTime
                });
                createEventForm.reset();
            }
        });
    }

    // Legend functionality
    var legendList = document.getElementById('legend-list');
    var addKeyBtn = document.getElementById('add-key-btn');

    if (addKeyBtn) {
        addKeyBtn.addEventListener('click', function() {
            var li = document.createElement('li');

            // Preset color options add strong + pastel colors
            var colors = [
                "#ff0000ff", "#ff7300ff", "#ffae00ff", "#ffff00ff", "#48da74ff",
                "#4c9967ff", "#4f6de4ff", "#a45ff7ff", "#e97bffff",
                "#e2a6d0ff"
            ];

            // Color circle
            var colorCircle = document.createElement('span');
            colorCircle.className = 'legend-color-circle';
            colorCircle.style.background = colors[0];
            colorCircle.style.marginRight = '8px';

            // Color menu (hidden by default)
            var colorMenu = document.createElement('div');
            colorMenu.className = 'legend-color-menu';
            colorMenu.style.display = 'none';

            colors.forEach(function(color) {
                var colorOption = document.createElement('span');
                colorOption.className = 'legend-color-option';
                colorOption.style.background = color;
                colorOption.setAttribute('data-color', color);
                colorOption.addEventListener('click', function(e) {
                    colorCircle.style.background = color;
                    colorMenu.style.display = 'none';
                });
                colorMenu.appendChild(colorOption);
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

            // Category name input
            var nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = 'Add a name';
            nameInput.className = 'legend-name-input';
            nameInput.style.flex = '1';
            nameInput.style.fontSize = '1em';
            nameInput.style.border = '1px solid #ccc';
            nameInput.style.borderRadius = '4px';
            nameInput.style.padding = '2px 6px';

            // When user presses Enter, replace input with static text
            nameInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var value = nameInput.value.trim() || 'Unnamed';
                    var nameSpan = document.createElement('span');
                    nameSpan.textContent = value;
                    nameSpan.className = 'legend-name-text';
                    nameSpan.style.flex = '1';
                    nameSpan.style.cursor = 'pointer';
                    nameSpan.style.padding = '2px 6px';
                    nameSpan.style.borderRadius = '4px';

                    // Double-click to edit
                    nameSpan.addEventListener('dblclick', function() {
                        li.replaceChild(nameInput, nameSpan);
                        nameInput.value = nameSpan.textContent;
                        nameInput.focus();
                    });

                    li.replaceChild(nameSpan, nameInput);
                }
            });

            // Optional: blur to save as well
            nameInput.addEventListener('blur', function() {
                if (nameInput.parentNode === li) {
                    var value = nameInput.value.trim() || 'Unnamed';
                    var nameSpan = document.createElement('span');
                    nameSpan.textContent = value;
                    nameSpan.className = 'legend-name-text';
                    nameSpan.style.flex = '1';
                    nameSpan.style.cursor = 'pointer';
                    nameSpan.style.padding = '2px 6px';
                    nameSpan.style.borderRadius = '4px';

                    nameSpan.addEventListener('dblclick', function() {
                        li.replaceChild(nameInput, nameSpan);
                        nameInput.value = nameSpan.textContent;
                        nameInput.focus();
                    });

                    li.replaceChild(nameSpan, nameInput);
                }
            });

            li.appendChild(colorCircle);
            li.appendChild(colorMenu);
            li.appendChild(nameInput);
            legendList.appendChild(li);
            nameInput.focus();
        });
    }

    function setupClockDropdown(inputId, pickerId, boxId, manualId, amId, pmId) {
        var input = document.getElementById(inputId);
        var picker = document.getElementById(pickerId);
        var box = document.getElementById(boxId);
        var manual = document.getElementById(manualId);
        var amBtn = document.getElementById(amId);
        var pmBtn = document.getElementById(pmId);
        if (!input || !picker || !box || !manual || !amBtn || !pmBtn) return;

        let mode = 'hour'; // 'hour' or 'minute'
        let hour = 12, minute = 0, ampm = 'AM';

        function setInputValue() {
            let h = hour < 10 ? '0' + hour : hour;
            let m = minute < 10 ? '0' + minute : minute;
            input.value = `${h}:${m} ${ampm}`;
        }

        function renderClock() {
            picker.innerHTML = '';
            picker.style.opacity = 1;

            // Draw labels
            if (mode === 'hour') {
                for (let i = 1; i <= 12; i++) {
                    let angle = (i * 30 - 90) * Math.PI / 180;
                    let x = 70 * Math.cos(angle);
                    let y = 70 * Math.sin(angle);
                    let label = document.createElement('div');
                    label.className = 'clock-label' + (hour === i ? ' selected' : '');
                    label.style.left = (90 + x) + 'px';
                    label.style.top = (90 + y) + 'px';
                    label.textContent = i;
                    // Switch to minute mode on mouseup (release click)
                    label.addEventListener('mousedown', function(e) {
                        hour = i;
                    });
                    label.addEventListener('mouseup', function(e) {
                        hour = i;
                        mode = 'minute';
                        renderClock();
                    });
                    picker.appendChild(label);
                }
            } else {
                for (let i = 0; i < 60; i += 5) {
                    let angle = (i * 6 - 90) * Math.PI / 180;
                    let x = 70 * Math.cos(angle);
                    let y = 70 * Math.sin(angle);
                    let label = document.createElement('div');
                    label.className = 'clock-label' + (minute === i ? ' selected' : '');
                    label.style.left = (90 + x) + 'px';
                    label.style.top = (90 + y) + 'px';
                    label.textContent = (i < 10 ? '0' : '') + i;
                    label.addEventListener('click', function(e) {
                        minute = i;
                        setInputValue();
                        box.classList.remove('active');
                    });
                    picker.appendChild(label);
                }
            }

            // Draw hands
            if (mode === 'hour') {
                let hourHand = document.createElement('div');
                hourHand.className = 'clock-hour-hand';
                hourHand.style.transform = 'rotate(' + ((hour % 12) * 30) + 'deg)';
                picker.appendChild(hourHand);
            } else {
                let minuteHand = document.createElement('div');
                minuteHand.className = 'clock-minute-hand';
                minuteHand.style.transform = 'rotate(' + (minute * 6) + 'deg)';
                picker.appendChild(minuteHand);
            }

            // Center dot (click to reset)
            let centerDot = document.createElement('div');
            centerDot.className = 'clock-center-dot';
            centerDot.title = 'Reset';
            centerDot.addEventListener('click', function(e) {
                mode = 'hour';
                renderClock();
            });
            picker.appendChild(centerDot);
        }

        input.addEventListener('click', function(e) {
            box.style.display = 'flex';
            setTimeout(function() {
                box.classList.add('active');
            }, 10);
            mode = 'hour';
            renderClock();
        });

        // Manual input logic
        manual.addEventListener('input', function() {
            let val = manual.value.trim();
            let match = /^(\d{1,2}):(\d{2})$/.exec(val);
            if (match) {
                let h = parseInt(match[1], 10);
                let m = parseInt(match[2], 10);
                if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
                    hour = h;
                    minute = m;
                    setInputValue();
                }
            }
        });

        // AM/PM selection logic
        function setAMPM(selected) {
            ampm = selected;
            amBtn.classList.toggle('selected', ampm === 'AM');
            pmBtn.classList.toggle('selected', ampm === 'PM');
            setInputValue();
        }
        amBtn.addEventListener('click', function() { setAMPM('AM'); });
        pmBtn.addEventListener('click', function() { setAMPM('PM'); });

        // Hide clock picker when clicking outside
        document.addEventListener('mousedown', function(e) {
            if (!box.contains(e.target) && e.target !== input) {
                box.classList.remove('active');
                setTimeout(function() {
                    box.style.display = 'none';
                }, 250);
            }
        });
    }

    setupClockDropdown('event-start', 'start-clock-picker', 'start-clock-picker-box', 'start-manual', 'start-am', 'start-pm');
    setupClockDropdown('event-end', 'end-clock-picker', 'end-clock-picker-box', 'end-manual', 'end-am', 'end-pm');
});
            if (!box.contains(e.target) && e.target !== input) {
                box.classList.remove('active');
                setTimeout(function() {
                    box.style.display = 'none';
                }, 250);
            }

    setupClockDropdown('event-start', 'start-clock-picker', 'start-clock-picker-box', 'start-manual', 'start-am', 'start-pm');
    setupClockDropdown('event-end', 'end-clock-picker', 'end-clock-picker-box', 'end-manual', 'end-am', 'end-pm');

