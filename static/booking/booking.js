(function (global) {
  'use strict';

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatDateKey(date, timeZone) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  function formatDateTimeParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(date);
    const out = {};
    for (const part of parts) {
      if (part.type !== 'literal') out[part.type] = part.value;
    }
    if (out.hour === '24') out.hour = '00';
    return out;
  }

  function zonedTimeToUtc(dateKey, time, timeZone) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const parts = formatDateTimeParts(utcGuess, timeZone);
    const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    const wantedUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    return new Date(utcGuess.getTime() + (wantedUtc - asUtc));
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function getWeekdayName(date, timeZone) {
    return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(date);
  }

  function parseDuration(config, selectedTypeId, selectedDuration) {
    const type = (config.meetingTypes || [])[0] || { durations: [30] };
    const selectedType = (config.meetingTypes || []).find(item => item.id === selectedTypeId) || type;
    const duration = Number(selectedDuration || selectedType.durations[0] || 30);
    return { type: selectedType, duration };
  }

  function overlapsBlockedSlot(start, end, config) {
    const bufferMs = Number(config.bufferMinutes || 0) * 60000;
    return (config.booked || []).some(item => {
      const busyStart = new Date(item.start).getTime() - bufferMs;
      const busyEnd = new Date(item.end).getTime() + bufferMs;
      return start.getTime() < busyEnd && end.getTime() > busyStart;
    });
  }

  function buildSlots(config, options = {}) {
    const now = options.now ? new Date(options.now) : new Date();
    const timeZone = config.timezone || 'America/New_York';
    const daysToShow = Number(config.daysToShow || 21);
    const interval = Number(config.slotIntervalMinutes || 30);
    const minimumNotice = Number(config.minimumNoticeHours || 0) * 3600000;
    const { duration } = parseDuration(config, options.meetingTypeId, options.duration);
    const slots = [];

    for (let dayOffset = 0; dayOffset < daysToShow; dayOffset += 1) {
      const candidate = addMinutes(now, dayOffset * 24 * 60);
      const dateKey = formatDateKey(candidate, timeZone);
      if ((config.unavailableDates || []).includes(dateKey)) continue;

      const dayName = getWeekdayName(candidate, timeZone);
      const windows = (config.weeklyAvailability || []).filter(item => item.day === dayName);

      for (const window of windows) {
        let start = zonedTimeToUtc(dateKey, window.start, timeZone);
        const windowEnd = zonedTimeToUtc(dateKey, window.end, timeZone);
        while (addMinutes(start, duration) <= windowEnd) {
          const end = addMinutes(start, duration);
          if (start.getTime() >= now.getTime() + minimumNotice && !overlapsBlockedSlot(start, end, config)) {
            slots.push({ start: start.toISOString(), end: end.toISOString(), duration });
          }
          start = addMinutes(start, interval);
        }
      }
    }

    return slots.sort((a, b) => new Date(a.start) - new Date(b.start));
  }

  function escapeIcsText(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function formatIcsDate(date) {
    const d = new Date(date);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }

  function buildIcsEvent({ config, slot, meetingType, attendeeName, attendeeEmail, note }) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const created = new Date();
    const uid = `meeting-${start.getTime()}@eungangchoi.com`;
    const summary = `${meetingType.name} with ${config.ownerName}`;
    const description = [
      note && `Notes: ${note}`,
      attendeeName && `Requested by: ${attendeeName}`,
      attendeeEmail && `Requester email: ${attendeeEmail}`,
      'This meeting request was generated from eungangchoi.com/schedule/ and is pending confirmation.'
    ].filter(Boolean).join('\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Eungang Choi//Website Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(created)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `ORGANIZER;CN=${escapeIcsText(config.ownerName)}:mailto:${config.ownerEmail}`,
      attendeeEmail ? `ATTENDEE;CN=${escapeIcsText(attendeeName || attendeeEmail)};RSVP=TRUE:mailto:${attendeeEmail}` : null,
      'STATUS:TENTATIVE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
  }

  function safeTimeZones() {
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    const zones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Seoul', 'Asia/Tokyo'];
    return [guessed, ...zones.filter(zone => zone !== guessed)];
  }

  function formatSlotDate(iso, timeZone) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(iso));
  }

  function downloadIcs(filename, contents) {
    const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function initBookingPage(documentRef = document) {
    const root = documentRef.querySelector('[data-booking-root]');
    if (!root) return;

    const status = root.querySelector('[data-booking-status]');
    const app = root.querySelector('[data-booking-app]');
    const typeSelect = root.querySelector('[data-booking-type]');
    const durationSelect = root.querySelector('[data-booking-duration]');
    const timezoneSelect = root.querySelector('[data-booking-timezone]');
    const slotsEl = root.querySelector('[data-booking-slots]');
    const rangeEl = root.querySelector('[data-booking-range]');
    const dialog = root.querySelector('[data-booking-dialog]');
    const summaryEl = root.querySelector('[data-booking-summary]');
    const downloadBtn = root.querySelector('[data-booking-download]');
    const emailLink = root.querySelector('[data-booking-email-link]');
    const nameInput = root.querySelector('[data-booking-name]');
    const emailInput = root.querySelector('[data-booking-email]');
    const noteInput = root.querySelector('[data-booking-note]');

    let config;
    let selectedSlot;
    let selectedType;
    let selectedIcs;

    function fillControls() {
      typeSelect.innerHTML = '';
      for (const type of config.meetingTypes || []) {
        const option = documentRef.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        typeSelect.appendChild(option);
      }

      timezoneSelect.innerHTML = '';
      for (const zone of safeTimeZones()) {
        const option = documentRef.createElement('option');
        option.value = zone;
        option.textContent = zone.replace('_', ' ');
        timezoneSelect.appendChild(option);
      }
    }

    function refreshDurations() {
      const { type } = parseDuration(config, typeSelect.value);
      durationSelect.innerHTML = '';
      for (const duration of type.durations || [30]) {
        const option = documentRef.createElement('option');
        option.value = duration;
        option.textContent = `${duration} minutes`;
        durationSelect.appendChild(option);
      }
    }

    function validateRequester() {
      if (!nameInput.value.trim() || !emailInput.value.trim()) {
        status.hidden = false;
        status.className = 'booking-status error';
        status.textContent = 'Please enter your name and email before selecting a slot.';
        return false;
      }
      status.hidden = true;
      status.className = 'booking-status';
      return true;
    }

    function refreshSlots() {
      const { type, duration } = parseDuration(config, typeSelect.value, durationSelect.value);
      selectedType = type;
      const slots = buildSlots(config, { meetingTypeId: type.id, duration });
      slotsEl.innerHTML = '';
      rangeEl.textContent = `${config.daysToShow || 21} days shown · ${config.timezone}`;

      if (!slots.length) {
        const empty = documentRef.createElement('p');
        empty.className = 'booking-empty';
        empty.textContent = 'No open times are currently published. Please email me directly if you need another time.';
        slotsEl.appendChild(empty);
        return;
      }

      for (const slot of slots) {
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.className = 'booking-slot';
        button.innerHTML = `<strong>${formatSlotDate(slot.start, timezoneSelect.value)}</strong><span>${duration} minutes</span>`;
        button.addEventListener('click', () => {
          if (!validateRequester()) return;
          selectedSlot = slot;
          selectedIcs = buildIcsEvent({
            config,
            slot,
            meetingType: selectedType,
            attendeeName: nameInput.value.trim(),
            attendeeEmail: emailInput.value.trim(),
            note: noteInput.value.trim()
          });
          const when = `${formatSlotDate(slot.start, timezoneSelect.value)}–${new Intl.DateTimeFormat(undefined, { timeZone: timezoneSelect.value, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(slot.end))}`;
          summaryEl.textContent = `${selectedType.name}, ${when}.`;
          const subject = encodeURIComponent(`Meeting request: ${selectedType.name} on ${formatSlotDate(slot.start, timezoneSelect.value)}`);
          const body = encodeURIComponent(`Hi Peter,\n\nI'd like to meet at ${when}.\n\nName: ${nameInput.value.trim()}\nEmail: ${emailInput.value.trim()}\nNotes: ${noteInput.value.trim() || '(none)'}\n\nI generated an .ics file from your scheduling page and can attach it if helpful.\n`);
          emailLink.href = `mailto:${config.ownerEmail}?subject=${subject}&body=${body}`;
          if (typeof dialog.showModal === 'function') dialog.showModal();
          else dialog.setAttribute('open', 'open');
        });
        slotsEl.appendChild(button);
      }
    }

    downloadBtn.addEventListener('click', () => {
      if (!selectedSlot || !selectedIcs) return;
      downloadIcs(`meeting-with-peter-${selectedSlot.start.slice(0, 10)}.ics`, selectedIcs);
    });

    typeSelect.addEventListener('change', () => {
      refreshDurations();
      refreshSlots();
    });
    durationSelect.addEventListener('change', refreshSlots);
    timezoneSelect.addEventListener('change', refreshSlots);

    fetch('/booking/availability.json', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`Availability file returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        config = data;
        fillControls();
        refreshDurations();
        refreshSlots();
        status.hidden = true;
        app.hidden = false;
      })
      .catch(error => {
        status.className = 'booking-status error';
        status.textContent = `Could not load availability: ${error.message}`;
      });
  }

  const api = { buildSlots, buildIcsEvent, escapeIcsText, formatIcsDate, zonedTimeToUtc, formatDateKey };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.BookingPage = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initBookingPage(document));
    else initBookingPage(document);
  }
})(typeof window !== 'undefined' ? window : globalThis);
