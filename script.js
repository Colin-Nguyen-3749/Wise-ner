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
        dateClick: function(info) {
            // Do nothing
        },
        select: function(info) {
            // Do nothing
        },
        datesSet: function() {
            // Add lingering hover effect to day cells
            setTimeout(function() {
                document.querySelectorAll('.fc-daygrid-day').forEach(function(cell) {
                    // Remove previous listeners to avoid duplicates
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
                        }, 400); // matches CSS transition duration
                    });

                    // Smooth transition to single day view on click
                    cell.addEventListener('click', function(e) {
                        var dateStr = cell.getAttribute('data-date');
                        var calView = calendarEl.querySelector('.fc-view-harness');
                        if (calView) {
                            calView.style.transition = 'transform 0.4s cubic-bezier(.4,2,.3,1), opacity 0.4s';
                            calView.style.transform = 'scale(0.95)';
                            calView.style.opacity = '0.5';
                            setTimeout(function() {
                                calendar.changeView('timeGridDay', dateStr);
                                setTimeout(function() {
                                    calView.style.transform = 'scale(1)';
                                    calView.style.opacity = '1';
                                }, 10);
                            }, 400);
                        } else {
                            calendar.changeView('timeGridDay', dateStr);
                        }
                    });
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
});
legendList.appendChild(li);
nameInput.focus();

li.appendChild(colorCircle);
li.appendChild(colorMenu);
li.appendChild(nameInput);
legendList.appendChild(li);
nameInput.focus();

legendList.appendChild(li);
nameInput.focus();

li.appendChild(colorCircle);
li.appendChild(colorMenu);
li.appendChild(nameInput);
legendList.appendChild(li);
nameInput.focus();

