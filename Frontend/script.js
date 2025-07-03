const calendar = document.getElementById('calendar');
const weekTitle = document.getElementById('weekTitle');
let currentDate = new Date();
let events = [];

function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function saveEvents() {
  localStorage.setItem('calendarEvents', JSON.stringify(events));
  events.forEach(event => {
    fetch("http://localhost:5001/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    }).catch(err => console.error("MongoDB save failed:", err));
  });
} 

function loadEvents() {
  fetch("http://localhost:5001/calendar")
    .then(res => res.json())
    .then(data => {
      try {
        events = JSON.parse(data); 
        localStorage.setItem('calendarEvents', JSON.stringify(events)); 
        renderCalendar(currentDate);
      } catch (e) {
        console.error("Parse error. Falling back to localStorage:", e);
        const fallback = localStorage.getItem('calendarEvents');
        events = fallback ? JSON.parse(fallback) : [];
        renderCalendar(currentDate);
      }
    })
    .catch(err => {
      console.warn("MongoDB fetch failed. Using localStorage:", err);
      const fallback = localStorage.getItem('calendarEvents');
      events = fallback ? JSON.parse(fallback) : [];
      renderCalendar(currentDate);
    });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function renderCalendar(date) {
  calendar.innerHTML = ''; 
  calendar.className = 'calendar-grid'; 

  const start = getStartOfWeek(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendar.appendChild(document.createElement('div')); 

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.textContent = `${days[i]} ${d.getMonth() + 1}/${d.getDate()}`;
    header.classList.add('no-click');
    calendar.appendChild(header);
  }

  let today = new Date();
today.setHours(0, 0, 0, 0);
let firstTodayCell = null;

  for (let block = 0; block < 96; block++) {
    const minutes = block * 15;
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;

    const timeLabel = document.createElement('div');
    timeLabel.className = 'calendar-hour';
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;
    timeLabel.innerHTML = `<span>${displayHour}:${min.toString().padStart(2, '0')}</span> <small>${ampm}</small>`;
    timeLabel.classList.add('no-click');
    calendar.appendChild(timeLabel);

    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + i,
        hour,
        min,
        0,
        0
      );
      const cellTimestamp = cellDate.getTime();

      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.style.position = 'relative'; 

      const cellDay = new Date(cellDate);
    cellDay.setHours(0, 0, 0, 0);
    if (cellDay.getTime() === today.getTime() && !firstTodayCell) {
      firstTodayCell = cell;
    }

      let eventList = events.filter(event => {
        const eventStart = Number(event.date);
        return cellTimestamp === eventStart;
      });
      eventList = eventList.sort((a, b) => Number(a.date) - Number(b.date));

      eventList.forEach((event, index) => {
        const div = document.createElement('div');
        const cleanType = (event.type || '').toLowerCase().trim();
        div.className = `event ${cleanType}`;
        div.classList.add('overlap');

        const total = eventList.length;
        const gap = 15;
        const widthPer = 100 / total;
        div.style.left = `${index * widthPer}%`;
        div.style.width = `calc(${widthPer}% - ${gap}px)`;

        const startDate = new Date(Number(event.date));
        const endDate = new Date(startDate.getTime() + (event.duration || 15) * 60000);

        const formatTime = date => {
        const h = date.getHours();
        const m = date.getMinutes();
        const ampm = h < 12 ? 'AM' : 'PM';
        const hr = h % 12 || 12;
        return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
        };

        const startTimeStr = formatTime(startDate);
        const endTimeStr = formatTime(endDate);

        div.innerHTML = `
            <strong>${event.title}</strong><br>
            <small>${startTimeStr} – ${endTimeStr}</small>
        `; 
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        div.appendChild(resizeHandle); 

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        resizeHandle.addEventListener('mousedown', e => {
            e.stopPropagation();
            isResizing = true;
            startY = e.clientY;
            startHeight = div.offsetHeight;

            const onMouseMove = eMove => {
                if (!isResizing) return;
                const deltaY = eMove.clientY - startY;

                const cellHeight = 40; 
                const minutesPerBlock = 15;
                const pxPerMinute = cellHeight / minutesPerBlock;

                const newDuration = Math.max(15, Math.round((startHeight + deltaY) / pxPerMinute));
                event.duration = newDuration;
                saveEvents();
                renderCalendar(currentDate);
            };

            const onMouseUp = () => {
                isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const cellHeight = 40; 
        const minutesPerBlock = 15;
        const pxPerMinute = cellHeight / minutesPerBlock;

        div.style.height = `${(event.duration || 15) * pxPerMinute}px`;
        div.style.position = 'absolute'; 
        div.style.marginBottom = '2px';
        div.setAttribute('draggable', true);

        div.addEventListener('click', e => e.stopPropagation());

        div.addEventListener('dragstart', e => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', JSON.stringify(event));
        });

        div.addEventListener('dblclick', e => {
          e.stopPropagation();
          const newTitle = prompt('Edit title/Reps/Sets or type "delete":', event.title);
          if (newTitle === 'delete') {
            events = events.filter(e => e.id !== event.id);
            saveEvents();
            renderCalendar(currentDate);
          } else if (newTitle) {
            const dur = parseInt(prompt('New duration in minutes:', event.duration || 15));
            if (!isNaN(dur)) {
              event.title = newTitle;
              event.duration = dur;
              saveEvents();
              renderCalendar(currentDate);
            }
          }
        });

        cell.appendChild(div);
      });

      cell.addEventListener('dragover', e => e.preventDefault());

      cell.addEventListener('drop', e => {
        e.preventDefault();
        const dropped = JSON.parse(e.dataTransfer.getData('text/plain'));
        events = events.filter(ev => ev.id !== dropped.id);
        events.push({ ...dropped, date: cellTimestamp });
        saveEvents();
        renderCalendar(currentDate);
      });

      cell.addEventListener('click', () => {
        const title = prompt('Event title/Reps/Sets:');
        if (!title) return;

        let type = prompt('Type (weights, cardio, other):');
        if (!type) return;
        type = type.toLowerCase().trim();

        const durationStr = prompt('Duration in minutes (15, 30, etc):', 15);
        const duration = parseInt(durationStr);
        if (isNaN(duration)) return;

        const newEvent = {
          id: generateId(),
          date: cellTimestamp,
          title,
          type,
          duration
        };

        events.push(newEvent);
        saveEvents();
        renderCalendar(currentDate);
      });

      calendar.appendChild(cell);
    }
  } 

  if (firstTodayCell) {
    const nowLine = document.createElement('div');
    nowLine.id = 'now-line';
    nowLine.style.position = 'absolute';
    nowLine.style.height = '2px';
    nowLine.style.backgroundColor = 'red';
    nowLine.style.left = '0';
    nowLine.style.right = '0';
    nowLine.style.zIndex = '100';
    firstTodayCell.appendChild(nowLine);
  }
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    positionNowLine(); 
    weekTitle.textContent = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}  

function getGridHeaderHeight() {
    const calendar = document.getElementById('calendar');
    const headerElements = [...calendar.children].slice(0, 8);
    const headerHeight = headerElements[1]?.offsetHeight || 0;
    return headerHeight; 
  }

function positionNowLine() {
  const nowLine = document.getElementById('now-line');
  if (!nowLine) return;

  const now = new Date();
  const start = getStartOfWeek(currentDate);

  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7); 
  weekEnd.setHours(0, 0, 0, 0);

  if (now < start || now >= weekEnd) {
    nowLine.style.display = 'none';
    return;
  }

  nowLine.style.display = 'block';

  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const firstCell = document.querySelector('.calendar-cell');
  if (!firstCell) return;
  const pxPerMinute = firstCell.offsetHeight / 15;

  const top = minutesSinceMidnight * pxPerMinute;
  nowLine.style.top = `${top}px`;
}

  setInterval(() => {
    positionNowLine();
  }, 1000); 

function changeWeek(offset) {
  currentDate.setDate(currentDate.getDate() + offset * 7);
  renderCalendar(currentDate); 
  positionNowLine();
} 


loadEvents();

function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;
  
    const chatBox = document.getElementById("chatMessages");
  
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.textContent = message;
    chatBox.appendChild(userMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
  
    input.value = "";
  
    const waitingMsg = document.createElement("div");
    waitingMsg.className = "message bot";
    waitingMsg.id = "waitingMessage";
    waitingMsg.textContent = "FlexBot is typing...";
    chatBox.appendChild(waitingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
  
    fetch("http://localhost:5001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    })
      .then(res => res.json())
      .then(data => {
        const waiting = document.getElementById("waitingMessage");
        if (waiting) waiting.remove();
  
        const botMsg = document.createElement("div");
        botMsg.className = "message bot";
        botMsg.textContent = `FlexBot: ${data.reply}`;
        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
      })
      .catch(err => {
        console.error("Error:", err);
        const waiting = document.getElementById("waitingMessage");
        if (waiting) waiting.remove();
  
        const botMsg = document.createElement("div");
        botMsg.className = "message bot";
        botMsg.textContent = "FlexBot: Sorry, something went wrong.";
        chatBox.appendChild(botMsg);
      });
  }