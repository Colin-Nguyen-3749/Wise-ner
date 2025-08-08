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

    function setupClockModal(startInputId, endInputId) {
        const modalOverlay = document.getElementById('clock-modal-overlay');
        const modalContent = document.getElementById('clock-modal-content');
        const picker = document.getElementById('clock-modal-picker');
        const manual = document.getElementById('clock-modal-manual');
        const amBtn = document.getElementById('clock-modal-am');
        const pmBtn = document.getElementById('clock-modal-pm');
        const okayBtn = document.getElementById('clock-modal-okay');
        const exitBtn = document.getElementById('clock-modal-exit');
        let targetInput = null;
        let mode = 'hour';
        let hour = 12, minute = 0, ampm = 'AM';

        function setInputValue() {
            let h = hour < 10 ? '0' + hour : hour;
            let m = minute < 10 ? '0' + minute : minute;
            if (targetInput) targetInput.value = `${h}:${m} ${ampm}`;
        }

        function getAngleFromEvent(e, center) {
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - center.x;
            let y = (e.touches ? e.touches[0].clientY : e.clientY) - center.y;
            let angle = Math.atan2(y, x) * 180 / Math.PI;
            angle = (angle + 360 + 90) % 360; // 0 is top
            return angle;
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
                    let x = centerX + hourRadius * Math.cos(angle) - 16; // 16 = width/2
                    let y = centerY + hourRadius * Math.sin(angle) - 16; // 16 = height/2
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

            // Draw hands
            if (mode === 'hour') {
                let hourHand = document.createElement('div');
                hourHand.className = 'clock-hour-hand';
                hourHand.style.position = 'absolute';
                hourHand.style.left = '50%';
                hourHand.style.bottom = '50%';
                hourHand.style.width = '6px';
                hourHand.style.height = '60px';
                hourHand.style.background = '#1976d2';
                hourHand.style.transformOrigin = 'bottom';
                hourHand.style.borderRadius = '3px';
                hourHand.style.transform = `rotate(${(hour % 12) * 30}deg)`;
                hourHand.style.zIndex = '10';
                hourHand.style.cursor = 'pointer';
                picker.appendChild(hourHand);

                // Drag logic for hour hand
                let draggingHour = false;
                function onHourDrag(e) {
                    if (draggingHour) {
                        let rect = picker.getBoundingClientRect();
                        let center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                        let angle = getAngleFromEvent(e, center);
                        let h = Math.round(angle / 30) || 12;
                        hour = h > 12 ? h - 12 : h;
                        setInputValue();
                        hourHand.style.transform = `rotate(${(hour % 12) * 30}deg)`;
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
                        // Switch to minute mode after releasing hour hand
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
                        hourHand.style.transform = `rotate(${(hour % 12) * 30}deg)`;
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
                let minuteHand = document.createElement('div');
                minuteHand.className = 'clock-minute-hand';
                minuteHand.style.position = 'absolute';
                minuteHand.style.left = '50%';
                minuteHand.style.bottom = '50%';
                minuteHand.style.width = '4px';
                minuteHand.style.height = '90px';
                minuteHand.style.background = '#4caf50';
                minuteHand.style.transformOrigin = 'bottom';
                minuteHand.style.borderRadius = '2px';
                minuteHand.style.transform = `rotate(${minute * 6}deg)`;
                minuteHand.style.zIndex = '9';
                minuteHand.style.cursor = 'pointer';
                picker.appendChild(minuteHand);

                // Drag logic for minute hand
                let draggingMinute = false;
                function onMinuteDrag(e) {
                    if (draggingMinute) {
                        let rect = picker.getBoundingClientRect();
                        let center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                        let angle = getAngleFromEvent(e, center);
                        let m = Math.round(angle / 6) % 60;
                        m = m < 0 ? m + 60 : m;
                        minute = m;
                        setInputValue();
                        minuteHand.style.transform = `rotate(${minute * 6}deg)`;
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
                        minuteHand.style.transform = `rotate(${minute * 6}deg)`;
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

        // Show modal logic
        const startInput = document.getElementById(startInputId);
        const endInput = document.getElementById(endInputId);

        function showModal(target) {
            targetInput = target;
            modalOverlay.classList.add('active');
            hour = 12;
            minute = 0;
            ampm = 'AM';
            renderClock();
            setInputValue();
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

        // Hide modal when clicking outside content
        modalOverlay.addEventListener('mousedown', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    setupClockModal('event-start', 'event-end');
});

