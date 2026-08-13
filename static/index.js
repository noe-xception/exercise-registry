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
  const tooltipScoreBadge = document.getElementById('tooltip-score-badge');
  const tooltipDuration = document.getElementById('tooltip-duration');
  const tooltipProgressFill = document.getElementById('tooltip-progress-fill');
  const tooltipExercises = document.getElementById('tooltip-exercises');
  const themeToggleBtn = document.getElementById('theme-toggle');

  // Initialize theme
  initTheme();

  function initTheme() {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'light';

        if (!currentTheme) {
          const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          newTheme = isSystemDark ? 'light' : 'dark';
        } else if (currentTheme === 'dark') {
          newTheme = 'light';
        } else {
          newTheme = 'dark';
        }

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('app-theme', newTheme);
      });
    }
  }

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateString(today);

    // find current monday
    const currentDay = today.getDay(); // days of week
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - daysToMonday);

    // start date (13 weeks back)
    let startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - 13 * 7);

    // end date (3 weeks ahead)
    let endDate = new Date(currentMonday);
    endDate.setDate(endDate.getDate() + 3 * 7);

    // find most recent filled date
    const filledDates = Object.keys(workouts || {}).filter(d => {
      const w = workouts[d];
      return w && (w.exercises ? w.exercises.length > 0 : true);
    });
    filledDates.sort();
    const mostRecentDateStr = filledDates.length > 0 ? filledDates[filledDates.length - 1] : null;

    if (mostRecentDateStr) {
      const mostRecentDate = parseDateString(mostRecentDateStr);
      const mrDay = mostRecentDate.getDay();
      const mrDaysToMonday = mrDay === 0 ? 6 : mrDay - 1;
      const mrMonday = new Date(mostRecentDate);
      mrMonday.setDate(mostRecentDate.getDate() - mrDaysToMonday);

      if (mrMonday < startDate) {
        startDate = new Date(mrMonday);
      }
      if (mostRecentDate > endDate) {
        const mrSunday = new Date(mrMonday);
        mrSunday.setDate(mrMonday.getDate() + 6);
        endDate = new Date(mrSunday);
      }
    }

    let currentIterDate = new Date(startDate);
    let previousMonthName = '';
    let mostRecentCell = null;

    // loop through weeks
    while (currentIterDate <= endDate) {
      const weekISO = getISOWeek(currentIterDate);
      const weekYear = currentIterDate.getFullYear();

      // check month change
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

        // mark today
        if (dateStr === todayStr) {
          cell.classList.add('is-today');
          cell.title = 'Today';
        }

        // mark most recent filled date
        if (dateStr === mostRecentDateStr) {
          mostRecentCell = cell;
        }

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
          if (dayData && dayData.exercises && dayData.exercises.length > 0) {
            cell.classList.add('active-workout');
            const score = dayData.daily_score || 0;
            const intensity = Math.min(1.0, score / 100);

            // Tier classification for styling
            if (score >= 85) {
              cell.setAttribute('data-intensity-tier', 'peak');
            } else if (score >= 60) {
              cell.setAttribute('data-intensity-tier', 'high');
            } else if (score >= 30) {
              cell.setAttribute('data-intensity-tier', 'med');
            } else {
              cell.setAttribute('data-intensity-tier', 'low');
            }

            // smooth opacity mapping
            const opacity = 0.25 + (intensity * 0.65);
            cell.style.setProperty('--intensity-opacity', opacity.toFixed(2));

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

    // scroll to most recent filled date
    if (mostRecentCell) {
      setTimeout(() => {
        mostRecentCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }

  // tooltip rendering
  function showTooltip(e, dateStr, data) {
    const cell = e.currentTarget;
    const dateObj = parseDateString(dateStr);

    // format date string
    const formattedDate = dateObj.toLocaleDateString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    tooltipDate.textContent = formattedDate;
    const scoreVal = data.daily_score || 0;
    tooltipScoreBadge.textContent = `${scoreVal.toFixed(0)}%`;
    tooltipDuration.textContent = `${data.duration_mins || 0} min`;
    tooltipProgressFill.style.width = `${Math.min(100, Math.max(0, scoreVal))}%`;

    // empty list
    tooltipExercises.innerHTML = '';

    if (!data.exercises || data.exercises.length === 0) {
      const li = document.createElement('li');
      li.style.justifyContent = 'center';
      li.style.color = 'var(--text-tertiary)';
      li.style.fontStyle = 'italic';
      li.style.padding = '4px 0';
      li.textContent = 'Rest Day (No workouts recorded)';
      tooltipExercises.appendChild(li);
    } else {
      data.exercises.forEach(ex => {
        const li = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'exercise-name';
        nameSpan.textContent = ex.name;
        nameSpan.title = ex.name;

        const valSpan = document.createElement('span');
        valSpan.className = 'exercise-val';
        valSpan.textContent = `${ex.reps} ${ex.unit}`;

        li.appendChild(nameSpan);
        li.appendChild(valSpan);
        tooltipExercises.appendChild(li);
      });
    }

    // show tooltip to calculate bounds
    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');

    // position tooltip with boundary clamping
    const rect = cell.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth || 240;
    const tooltipHeight = tooltip.offsetHeight || 140;

    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    // clamp horizontally
    left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));

    let top = rect.top - tooltipHeight - 10;
    const arrow = tooltip.querySelector('.tooltip-arrow');

    if (top < 10) {
      // Place below if not enough room on top
      top = rect.bottom + 10;
      if (arrow) {
        arrow.style.bottom = 'auto';
        arrow.style.top = '-6px';
        arrow.style.borderRight = 'none';
        arrow.style.borderBottom = 'none';
        arrow.style.borderLeft = '1px solid var(--tooltip-border)';
        arrow.style.borderTop = '1px solid var(--tooltip-border)';
      }
    } else {
      if (arrow) {
        arrow.style.top = 'auto';
        arrow.style.bottom = '-6px';
        arrow.style.borderLeft = 'none';
        arrow.style.borderTop = 'none';
        arrow.style.borderRight = '1px solid var(--tooltip-border)';
        arrow.style.borderBottom = '1px solid var(--tooltip-border)';
      }
    }

    // Align arrow with cell center
    if (arrow) {
      const cellCenterX = rect.left + rect.width / 2;
      const arrowLeft = cellCenterX - left - 5;
      arrow.style.left = `${Math.max(12, Math.min(tooltipWidth - 22, arrowLeft))}px`;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
    tooltip.setAttribute('aria-hidden', 'true');
  }

  // Dismiss tooltip on scroll
  window.addEventListener('scroll', hideTooltip, { passive: true });
});

