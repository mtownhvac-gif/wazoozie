import {PLANNING_HAZARD, PLANNING_SAFETY} from './planning-safety.mjs';

export const FEELINGS = Object.freeze({
  unseen: {label: 'Not observed', symbol: '·'},
  cool: {label: 'Too cool', symbol: '−'},
  okay: {label: 'Feels okay', symbol: '○'},
  warm: {label: 'Too warm', symbol: '+'}
});
export const PERIODS = Object.freeze({morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening'});
export const LEVELS = Object.freeze({unknown: 'Floor not specified', lower: 'Lower level', main: 'Main floor', upper: 'Upper floor', other: 'Other level'});
export const MODES = Object.freeze({unknown: 'Not sure / varies', heat: 'Heating', cool: 'Cooling', off: 'Off'});
export const DURATIONS = Object.freeze({unknown: 'Not sure', recent: 'Recently', recurring: 'It comes and goes', longstanding: 'It has been this way for a while'});
export const MAX_ROOMS = 6;
const has = (object, key) => typeof key === 'string' && Object.hasOwn(object, key);
const text = (value, max) => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max).trim() : '';
export const emptyRoom = () => ({name: '', level: 'unknown', observations: {morning: 'unseen', afternoon: 'unseen', evening: 'unseen'}});
export const initialState = () => ({basis: 'pattern', date: '', mode: 'unknown', duration: 'unknown', notes: '', rooms: [emptyRoom(), emptyRoom()]});
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const d = new Date(value + 'T12:00:00Z');
  return Number.isFinite(d.valueOf()) && d.toISOString().slice(0, 10) === value ? value : '';
}
export function normalizeMap(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const rooms = Array.isArray(input.rooms) ? input.rooms.slice(0, MAX_ROOMS) : [];
  return {
    basis: input.basis === 'day' ? 'day' : 'pattern', date: validDate(input.date),
    mode: has(MODES, input.mode) ? input.mode : 'unknown',
    duration: has(DURATIONS, input.duration) ? input.duration : 'unknown',
    notes: text(input.notes, 1500),
    rooms: (rooms.length ? rooms : [emptyRoom()]).map(room => ({
      name: text(room?.name, 50), level: has(LEVELS, room?.level) ? room.level : 'unknown',
      observations: Object.fromEntries(Object.keys(PERIODS).map(period => [period, has(FEELINGS, room?.observations?.[period]) ? room.observations[period] : 'unseen']))
    }))
  };
}
export const roomLabel = (room, index) => text(room?.name, 50) || 'Room ' + (index + 1);

export function summarizeMap(raw) {
  const state = normalizeMap(raw);
  const all = state.rooms.flatMap(room => Object.values(room.observations));
  const observed = all.filter(value => value !== 'unseen').length;
  const concerns = all.filter(value => value === 'warm' || value === 'cool').length;
  const unknown = all.length - observed;
  const urgent = PLANNING_HAZARD.test([state.notes, ...state.rooms.map(room => room.name)].join(' '));
  const findings = [];
  const contrasting = Object.entries(PERIODS).filter(([period]) => {
    const values = state.rooms.map(room => room.observations[period]);
    return values.includes('warm') && values.includes('cool');
  }).map(([, label]) => label.toLowerCase());
  if (contrasting.length) findings.push('Both “too warm” and “too cool” appear in your ' + contrasting.join(' and ') + ' entries.');
  const changing = state.rooms.map((room, index) => ({room, index})).filter(({room}) => new Set(Object.values(room.observations).filter(value => value !== 'unseen')).size > 1);
  if (changing.length) findings.push(changing.map(({room, index}) => roomLabel(room, index)).join(', ') + (changing.length === 1 ? ' has' : ' have') + ' different feelings marked across the day.');
  const affected = state.rooms.map((room, index) => ({room, index})).filter(({room}) => Object.values(room.observations).some(value => value === 'warm' || value === 'cool'));
  if (affected.length) findings.push('You marked a comfort concern in ' + affected.map(({room, index}) => roomLabel(room, index)).join(', ') + '.');
  if (observed && !concerns) findings.push('Every observed entry is marked “Feels okay.” This does not assess equipment condition or rule out a problem.');
  if (unknown) findings.push(unknown + ' ' + (unknown === 1 ? 'time slot is' : 'time slots are') + ' still not observed. No answer has been assumed.');
  if (!observed) findings.unshift('Choose how a room feels at a time you remember. You can leave the rest blank.');
  let question = 'What would you need to check to understand the comfort in these rooms?';
  if (contrasting.length) question = 'Could you compare these rooms under similar conditions before recommending changes?';
  else if (changing.length) question = 'What would you check to understand why this room feels different across the day?';
  else if (concerns) question = 'What would you check in these rooms and the system before recommending a repair or replacement?';
  else if (observed) question = 'What else should I record if the comfort problem returns?';
  if (urgent) question = 'Do not use this map to assess an urgent hazard. ' + PLANNING_SAFETY;
  return {state, observed, concerns, unknown, findings, question, urgent};
}

export function visitBrief(raw) {
  const summary = summarizeMap(raw), state = summary.state;
  const lines = ['THE COMFORT MAP', 'Homeowner observations for a heating and cooling conversation', '',
    'This is a record of feelings, not measured temperatures or a diagnosis.',
    'Basis: ' + (state.basis === 'day' ? 'Observations from one day' + (state.date ? ' (' + state.date + ')' : '; date not specified') : 'A pattern I remember; entries may not describe the same day'),
    'System while observing: ' + MODES[state.mode], 'First noticed: ' + DURATIONS[state.duration], ''];
  if (summary.urgent) lines.push('URGENT SAFETY GUIDANCE', PLANNING_SAFETY, '');
  for (const [index, room] of state.rooms.entries()) {
    lines.push(roomLabel(room, index) + ' — ' + LEVELS[room.level]);
    for (const [key, label] of Object.entries(PERIODS)) lines.push('  ' + label + ': ' + FEELINGS[room.observations[key]].label);
    lines.push('');
  }
  lines.push('WHAT MY ENTRIES SHOW', ...summary.findings.map(finding => '• ' + finding), '');
  if (state.notes) lines.push('MY NOTES', state.notes, '');
  lines.push('QUESTIONS FOR THE CONVERSATION', '• ' + summary.question,
    '• Which observations or measurements would help you understand this before proposing work?',
    '• What will you evaluate, and what would fall outside the visit?',
    '• Please confirm address coverage, any visit charge and appointment availability.', '',
    'This map does not identify a cause, size equipment, recommend a product, establish safety or confirm a booking.',
    'Nothing has been sent to Wazoozie or a contractor. Share this copy only with the people you choose.',
    'Blank tool: https://wazoozie.com/comfort-map/');
  return lines.join('\n');
}

export function mountComfortMap(win = window) {
  const doc = win.document, root = doc.querySelector('#comfort-map');
  if (!root || root.dataset.mounted === 'true') return null;
  root.dataset.mounted = 'true';
  let state = initialState();
  let copyVersion = 0;
  const byId = id => doc.getElementById(id);
  const roomContainer = byId('cm-rooms'), status = byId('cm-status');
  const make = (tag, className, value) => {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };
  function makeSelect(options, value, id) {
    const select = make('select'); select.id = id;
    for (const [key, label] of Object.entries(options)) {
      const option = make('option', '', typeof label === 'string' ? label : label.label);
      option.value = key; select.append(option);
    }
    select.value = value;
    return select;
  }
  function field(label, element) {
    const wrapper = make('label'); wrapper.htmlFor = element.id;
    wrapper.append(make('span', '', label), element);
    return wrapper;
  }
  function renderRooms() {
    roomContainer.replaceChildren();
    state.rooms.forEach((room, index) => {
      const card = make('fieldset', 'cm-room'); card.dataset.room = String(index);
      card.append(make('legend', '', 'Room ' + (index + 1)));
      const top = make('div', 'cm-room-top');
      const name = make('input'); name.type = 'text'; name.id = 'cm-name-' + index;
      name.maxLength = 50; name.value = room.name; name.placeholder = 'e.g. Back bedroom'; name.dataset.field = 'name'; name.autocomplete = 'off';
      const level = makeSelect(LEVELS, room.level, 'cm-level-' + index); level.dataset.field = 'level';
      top.append(field('Room name (optional)', name), field('Where is it?', level));
      const remove = make('button', 'cm-remove', 'Remove'); remove.type = 'button'; remove.dataset.remove = String(index);
      remove.setAttribute('aria-label', 'Remove room ' + (index + 1)); remove.disabled = state.rooms.length === 1;
      top.append(remove); card.append(top);
      const periods = make('div', 'cm-periods');
      for (const [period, label] of Object.entries(PERIODS)) {
        const select = makeSelect(FEELINGS, room.observations[period], 'cm-' + index + '-' + period);
        select.dataset.period = period;
        const wrapper = field(label, select); wrapper.className = 'cm-feeling'; wrapper.dataset.feeling = room.observations[period];
        const symbol = make('span', 'cm-feeling-symbol', FEELINGS[room.observations[period]].symbol); symbol.setAttribute('aria-hidden', 'true'); wrapper.prepend(symbol);
        periods.append(wrapper);
      }
      card.append(periods); roomContainer.append(card);
    });
    byId('cm-room-count').textContent = state.rooms.length + ' of ' + MAX_ROOMS + ' rooms';
    byId('cm-add').disabled = state.rooms.length >= MAX_ROOMS;
    byId('cm-add').textContent = state.rooms.length >= MAX_ROOMS ? 'All six room spaces are in use' : '+ Add another room';
  }
  function renderStory() {
    copyVersion += 1;
    const result = summarizeMap(state);
    byId('cm-count').textContent = result.observed ? result.observed + ' of ' + (state.rooms.length * 3) + ' time slots observed. No comfort score.' : 'No observations yet.';
    byId('cm-story-title').textContent = result.observed ? 'Here’s what you marked.' : 'Start with what you notice.';
    byId('cm-findings').replaceChildren(...result.findings.map(finding => make('li', '', finding)));
    byId('cm-question').textContent = '“' + result.question + '”';
    const picture = byId('cm-picture'); picture.replaceChildren();
    const heading = make('div', 'cm-picture-row cm-picture-head');
    heading.append(make('span', '', 'ROOM / TIME'), ...Object.values(PERIODS).map(label => make('span', '', label.slice(0, 3)))); picture.append(heading);
    for (const [index, room] of state.rooms.entries()) {
      const row = make('div', 'cm-picture-row'); row.append(make('span', 'cm-picture-name', roomLabel(room, index)));
      for (const [period, label] of Object.entries(PERIODS)) {
        const feeling = FEELINGS[room.observations[period]];
        const cell = make('span', 'cm-picture-cell', feeling.symbol); cell.dataset.feeling = room.observations[period];
        cell.setAttribute('role', 'img'); cell.setAttribute('aria-label', roomLabel(room, index) + ', ' + label + ': ' + feeling.label); cell.title = label + ': ' + feeling.label; row.append(cell);
      }
      picture.append(row);
    }
    const legend = make('p', 'cm-picture-legend', '− Too cool   ○ Feels okay   + Too warm   · Not observed'); picture.append(legend);
    const brief = visitBrief(state);
    byId('cm-brief').textContent = brief; byId('cm-print-text').textContent = brief;
    byId('cm-copy-text').value = brief;
    byId('cm-urgent').hidden = !result.urgent;
    byId('cm-date-label').hidden = state.basis !== 'day';
    status.textContent = '';
  }
  const safety = make('div', 'cm-urgent'); safety.id = 'cm-urgent'; safety.hidden = true; safety.setAttribute('role', 'alert');
  safety.append(make('strong', '', 'Pause the map. Safety comes first.'), make('p', '', PLANNING_SAFETY));
  byId('cm-app').prepend(safety);

  roomContainer.addEventListener('input', event => {
    const control = event.target, card = control.closest('[data-room]');
    if (!card || control.dataset.field !== 'name') return;
    state.rooms[Number(card.dataset.room)].name = control.value.slice(0, 50); renderStory();
  });
  roomContainer.addEventListener('change', event => {
    const control = event.target, card = control.closest('[data-room]'); if (!card) return;
    const room = state.rooms[Number(card.dataset.room)];
    if (control.dataset.field === 'level' && has(LEVELS, control.value)) room.level = control.value;
    else if (has(PERIODS, control.dataset.period) && has(FEELINGS, control.value)) {
      room.observations[control.dataset.period] = control.value;
      control.parentElement.dataset.feeling = control.value;
      control.parentElement.querySelector('.cm-feeling-symbol').textContent = FEELINGS[control.value].symbol;
    } else return;
    renderStory();
  });
  roomContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]'); if (!button || state.rooms.length === 1) return;
    const index = Number(button.dataset.remove); state.rooms.splice(index, 1); renderRooms(); renderStory();
    byId('cm-name-' + Math.min(index, state.rooms.length - 1)).focus();
    status.textContent = 'Room removed. The remaining entries are unchanged.';
  });
  byId('cm-add').addEventListener('click', () => {
    if (state.rooms.length >= MAX_ROOMS) return;
    state.rooms.push(emptyRoom()); renderRooms(); renderStory(); byId('cm-name-' + (state.rooms.length - 1)).focus();
  });
  for (const key of ['basis', 'date', 'mode', 'duration', 'notes']) {
    const control = byId('cm-' + key);
    control.addEventListener(key === 'notes' ? 'input' : 'change', () => {
      state[key] = control.value; renderStory();
    });
  }
  function copyFallback(brief, message) {
    byId('cm-copy-fallback').hidden = false; byId('cm-copy-text').value = brief; byId('cm-copy-text').focus(); byId('cm-copy-text').select();
    status.textContent = message;
  }
  byId('cm-copy').addEventListener('click', async () => {
    const button = byId('cm-copy'), brief = visitBrief(state), version = copyVersion; button.disabled = true;
    try {
      if (!win.navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await win.navigator.clipboard.writeText(brief);
      if (version !== copyVersion) return;
      byId('cm-copy-fallback').hidden = true; status.textContent = 'Brief copied. Nothing was sent. Share it only with the people you choose.';
    } catch { if (version === copyVersion) copyFallback(brief, 'Automatic copy is unavailable. Select and copy the brief below.'); }
    finally { button.disabled = false; }
  });
  byId('cm-download').addEventListener('click', () => {
    let url;
    try {
      url = win.URL.createObjectURL(new win.Blob([visitBrief(state)], {type: 'text/plain;charset=utf-8'}));
      const link = make('a'); link.href = url; link.download = 'wazoozie-comfort-map.txt'; doc.body.append(link); link.click(); link.remove();
      status.textContent = 'Brief prepared for download. Check your browser’s downloads. Nothing was sent.';
    } catch { copyFallback(visitBrief(state), 'Download is unavailable. Copy the brief below or use Print / save PDF.'); }
    finally { if (url) win.setTimeout(() => win.URL.revokeObjectURL(url), 1000); }
  });
  byId('cm-print').addEventListener('click', () => {
    byId('cm-print-text').textContent = visitBrief(state);
    try { win.print(); } catch { copyFallback(visitBrief(state), 'Printing is unavailable. Copy the brief below instead.'); }
  });
  byId('cm-clear').addEventListener('click', () => {byId('cm-clear-confirm').hidden = false; byId('cm-clear-no').focus();});
  byId('cm-clear-no').addEventListener('click', () => {byId('cm-clear-confirm').hidden = true; byId('cm-clear').focus();});
  byId('cm-clear-yes').addEventListener('click', () => {
    state = initialState();
    for (const key of ['basis', 'date', 'mode', 'duration', 'notes']) byId('cm-' + key).value = state[key];
    byId('cm-copy-fallback').hidden = true; byId('cm-clear-confirm').hidden = true;
    renderRooms(); renderStory(); status.textContent = 'Map cleared. Any copies you already downloaded or shared are unchanged.'; byId('cm-name-0').focus();
  });
  renderRooms(); renderStory(); byId('cm-app').hidden = false;
  return {getState: () => normalizeMap(state)};
}

if (typeof window !== 'undefined') mountComfortMap(window);
