document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        select: function(info) {
            var title = prompt('Enter Event Title:');
            if (title) {
                calendar.addEvent({
                    title: title,
                    start: info.start,
                    end: info.end,
                    allDay: info.allDay
                });
            }
            calendar.unselect();
        },
        datesSet: function() {
            // Add "Add Event" buttons to each day cell
            setTimeout(function() {
                document.querySelectorAll('.fc-daygrid-day').forEach(function(cell) {
                    // Prevent duplicate buttons
                    if (!cell.querySelector('.add-event-btn')) {
                        var btn = document.createElement('button');
                        btn.className = 'add-event-btn';
                        btn.textContent = 'Add Event';
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            var dateStr = cell.getAttribute('data-date');
                            var title = prompt('Enter Event Title:');
                            if (title && dateStr) {
                                calendar.addEvent({
                                    title: title,
                                    start: dateStr,
                                    allDay: true
                                });
                            }
                        });
                        cell.querySelector('.fc-daygrid-day-frame').appendChild(btn);
                    }
                });
            }, 0);
        }
    });
    calendar.render();

    // Legend functionality
    var legendList = document.getElementById('legend-list');
    var addKeyBtn = document.getElementById('add-key-btn');

    if (addKeyBtn) {
        addKeyBtn.addEventListener('click', function() {
            var li = document.createElement('li');

            // Preset color options
            var colors = [
                "#1976d2", "#388e3c", "#fbc02d", "#d32f2f", "#7b1fa2",
                "#0288d1", "#c2185b", "#ffa000", "#388e3c", "#f57c00",
                "#455a64", "#0097a7", "#8bc34a", "#e91e63", "#ff5722"
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
});
