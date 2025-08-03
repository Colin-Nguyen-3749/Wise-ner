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

            // Color picker circle
            var colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = '#1976d2';
            colorInput.className = 'legend-color-input';
            colorInput.style.width = '24px';
            colorInput.style.height = '24px';
            colorInput.style.border = 'none';
            colorInput.style.borderRadius = '50%';
            colorInput.style.padding = '0';
            colorInput.style.marginRight = '8px';
            colorInput.style.cursor = 'pointer';
            colorInput.style.background = 'none';

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

            li.appendChild(colorInput);
            li.appendChild(nameInput);
            legendList.appendChild(li);
        });
    }
});
