// parse date string
function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// format date string
function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// calculate iso week
function getISOWeek(date) {
  const tempDate = new Date(date.valueOf());
  // iso week rules
  const dayNum = (date.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayNum + 3);
  const firstThursday = tempDate.getTime();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - tempDate) / 604800000);
}

// app initialization
document.addEventListener('DOMContentLoaded', () => {
  const calendarGrid = document.getElementById('calendar-grid');
  const tooltip = document.getElementById('tooltip');
  const tooltipDate = document.getElementById('tooltip-date');
  const tooltipScore = document.getElementById('tooltip-score');
  const tooltipDuration = document.getElementById('tooltip-duration');
  const tooltipExercises = document.getElementById('tooltip-exercises');

  // fetch server data
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      renderStats(data.stats);
      renderCalendar(data.workouts);
    })
    .catch(error => {
      console.error('Error fetching workout data:', error);
      // fallback empty calendar
      renderStats({ streak: 0, total_workouts: 0, avg_intensity: 0, total_duration: 0 });
      renderCalendar({});
    });

  // render header stats
  function renderStats(stats) {
    document.getElementById('metric-streak').textContent = `${stats.streak} day${stats.streak === 1 ? '' : 's'}`;
    document.getElementById('metric-total').textContent = stats.total_workouts;
    document.getElementById('metric-average').textContent = `${Math.round(stats.avg_intensity)}%`;
    document.getElementById('metric-duration').textContent = `${stats.total_duration || 0} min`;
  }

  // render calendar
  function renderCalendar(workouts) {
    calendarGrid.innerHTML = '';

    // 3 months rolling
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // find current monday
    const currentDay = today.getDay(); // days of week
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - daysToMonday);

    // start date
    const startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - 13 * 7);

    // end date
    const endDate = new Date(currentMonday);
    endDate.setDate(endDate.getDate() + 3 * 7);

    let currentIterDate = new Date(startDate);
    let previousMonthName = '';

    // loop through weeks
    while (currentIterDate <= endDate) {
      const weekISO = getISOWeek(currentIterDate);
      const weekYear = currentIterDate.getFullYear();

      // new month separator
      // check month
      const monthLabel = currentIterDate.toLocaleString('default', { month: 'long' });
      const monthYearLabel = `${monthLabel} ${weekYear}`;

      if (monthYearLabel !== previousMonthName) {
        previousMonthName = monthYearLabel;
        const separator = document.createElement('div');
        separator.className = 'month-row-separator';
        separator.textContent = monthYearLabel;
        calendarGrid.appendChild(separator);
      }

      // create week row
      const row = document.createElement('div');
      row.className = 'calendar-week-row';

      // insert week number
      const wkCell = document.createElement('div');
      wkCell.className = 'week-number';
      wkCell.textContent = 'W' + weekISO;
      row.appendChild(wkCell);

      // generate 7 days
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(currentIterDate);
        dayDate.setDate(currentIterDate.getDate() + d);

        const dateStr = formatDateString(dayDate);
        const cell = document.createElement('div');
        cell.className = 'date-cell';

        // day background layer
        const cellBg = document.createElement('div');
        cellBg.className = 'date-cell-bg';
        cell.appendChild(cellBg);

        // day number text
        const dayNumSpan = document.createElement('span');
        dayNumSpan.className = 'day-num';
        dayNumSpan.textContent = dayDate.getDate();
        cell.appendChild(dayNumSpan);

        // check future date
        if (dayDate > today) {
          cell.classList.add('empty');
        } else {
          // check workout data
          const dayData = workouts[dateStr];
          if (dayData) {
            cell.classList.add('active-workout');
            const score = dayData.daily_score;
            const intensity = score / 100;

            // map intensity
            const opacity = 0.15 + (intensity * 0.75); // Range [0.15, 0.90]
            const radius = 22 + (intensity * 30);       // Range [22%, 52%]

            // set css properties
            cell.style.setProperty('--intensity', intensity);
            cell.style.setProperty('--intensity-opacity', opacity);
            cell.style.setProperty('--intensity-radius', `${radius}%`);

            // tooltip events
            cell.addEventListener('mouseenter', (e) => showTooltip(e, dateStr, dayData));
            cell.addEventListener('mouseleave', hideTooltip);
          } else {
            // rest day
            cell.classList.add('rest-day');

            // tooltip events for rest day
            const restData = { daily_score: 0, duration_mins: 0, exercises: [] };
            cell.addEventListener('mouseenter', (e) => showTooltip(e, dateStr, restData));
            cell.addEventListener('mouseleave', hideTooltip);
          }
        }

        row.appendChild(cell);
      }

      calendarGrid.appendChild(row);

      // advance 1 week
      currentIterDate.setDate(currentIterDate.getDate() + 7);
    }
  }

  // tooltip rendering
  function showTooltip(e, dateStr, data) {
    const cell = e.currentTarget;
    const dateObj = parseDateString(dateStr);

    // format date string
    const formattedDate = dateObj.toLocaleDateString('default', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    tooltipDate.textContent = formattedDate;
    tooltipScore.textContent = `${data.daily_score.toFixed(1)}%`;
    tooltipDuration.textContent = `${data.duration_mins || 0} min`;

    // empty list
    tooltipExercises.innerHTML = '';

    if (data.exercises.length === 0) {
      const li = document.createElement('li');
      li.style.justifyContent = 'center';
      li.style.color = 'var(--text-secondary)';
      li.style.fontStyle = 'italic';
      li.textContent = 'Rest Day (No workouts)';
      tooltipExercises.appendChild(li);
    } else {
      data.exercises.forEach(ex => {
        const li = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'exercise-name';
        nameSpan.textContent = ex.name;
        nameSpan.title = ex.name; // browser tooltip

        const valSpan = document.createElement('span');
        valSpan.className = 'exercise-val';
        valSpan.textContent = `${ex.reps} ${ex.unit}`;

        li.appendChild(nameSpan);
        li.appendChild(valSpan);
        tooltipExercises.appendChild(li);
      });
    }

    // position tooltip
    const rect = cell.getBoundingClientRect();

    // show tooltip
    tooltip.classList.add('visible');

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    // center tooltip
    const left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    const top = rect.top - tooltipHeight - 10;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
  }
});
