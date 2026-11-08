export const QUESTIONS = [
  ['Your house gets one wish. What do you pick?', ['Every room feels just right.', 'A finished project with no loose ends.', 'A fresh look that feels like me.', 'Less upkeep on my calendar.']],
  ['You find a free Saturday. The house vote is…', ['Make my favorite room more comfortable.', 'Finally measure that project properly.', 'Collect ideas for a room refresh.', 'Cross a maintenance task off the list.']],
  ['Which little annoyance wins your attention?', ['The upstairs never matches the downstairs.', 'An estimate that leaves out the details.', 'The room that still looks unfinished.', 'A recurring issue nobody has explained.']],
  ['What would you most like a contractor to explain?', ['How this will improve everyday comfort.', 'Exactly what is included in the work.', 'How the finished result will look and feel.', 'What care this needs after installation.']],
  ['The project is finished. Your favorite part?', ['The house feels better to live in.', 'The work matches the plan.', 'It finally feels like our place.', 'I know what to look after next.']]
];
export const PERSONALITIES = [
  {name:'The Comfort Curator', line:'You notice how a home feels before anything else.', tip:'Choose one room and note when it feels uncomfortable. A clear pattern gives the first conversation somewhere useful to start.', action:'Explore heating & cooling', href:'/services/heating-cooling/'},
  {name:'The Plan Keeper', line:'You like the details settled before the tools come out.', tip:'Compare the written scope, exclusions, and approval process before comparing totals. A shared plan keeps surprises out of the job.', action:'Compare two estimates', href:'/compare/'},
  {name:'The Nest Remixer', line:'You see the room your home could become.', tip:'Pick one space, one must-have, and one thing you want to keep. Use those three details to start a focused project conversation.', action:'Make a project sheet', href:'/project-kit/'},
  {name:'The Future Friend', line:'You want a home that is easier to look after.', tip:'Start a list of equipment, last known service dates, and manufacturer care instructions. Ask a professional to clarify anything you cannot verify safely.', action:'Browse the home tips', href:'/home-tips/'}
];
export const PRIORITIES = [
  {name:'Comfort in every room', detail:'That one room should not need its own season.', tip:'Write down the affected rooms and when the comfort changes.', href:'/services/heating-cooling/', action:'Explore comfort help'},
  {name:'Hot water that fits us', detail:'Plan around how your household actually uses it.', tip:'Note your current Water Heater and your household’s hot-water needs.', href:'/services/water-heaters/', action:'Explore Water Heaters'},
  {name:'A room worth coming home to', detail:'A refresh, a finish, or a bigger idea.', tip:'Choose one must-have and a few reference photos for your project sheet.', href:'/project-kit/', action:'Make a project sheet'},
  {name:'Fewer maintenance mysteries', detail:'Know what needs attention and when.', tip:'Gather the care instructions and service history you already have.', href:'/home-tips/', action:'Browse home tips'},
  {name:'Clearer project prices', detail:'Know what the number actually includes.', tip:'Compare full scope, exclusions, and written warranty terms.', href:'/compare/', action:'Compare estimates'},
  {name:'The right local help', detail:'Get to know the business before making contact.', tip:'Confirm your address, the job type, and availability directly.', href:'/local-help/', action:'Find local help'}
];

export function personalityFor(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length || answers.some(a => !Number.isInteger(a) || a < 0 || a > 3)) return null;
  const scores = [0,0,0,0];
  answers.forEach(a => scores[a]++);
  const highest = Math.max(...scores);
  // When preferences tie, the visitor's earliest matching choice decides.
  return PERSONALITIES[answers.find(a => scores[a] === highest)];
}

export function initPlayground(doc) {
  const quiz = doc.querySelector('#personality-quiz');
  if (!quiz) return;
  const el = (tag, text, cls) => {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const button = (text, cls, action) => {
    const node = el('button', text, cls); node.type = 'button'; node.addEventListener('click', action); return node;
  };
  const link = (text, href) => {const node = el('a', text); node.href = href; return node;};
  let step = 0, answers = [];
  function renderQuiz(focus = false) {
    quiz.replaceChildren();
    const result = step === QUESTIONS.length;
    const progressLabel = el('div', result ? 'Five choices. Your kind of home.' : `Question ${step + 1} of ${QUESTIONS.length}`, 'play-progress');
    const progress = el('progress'); progress.max = QUESTIONS.length; progress.value = result ? QUESTIONS.length : step;
    progress.setAttribute('aria-label', 'Quiz questions completed'); quiz.append(progressLabel, progress);
    if (result) {
      const profile = personalityFor(answers);
      const box = el('div', undefined, 'play-reveal');
      const title = el('h3', profile.name); title.tabIndex = -1;
      box.append(el('p', 'YOUR HOME PERSONALITY', 'eyebrow'), title, el('p', profile.line), el('p', profile.tip), link(profile.action + ' →', profile.href), el('p', 'Just for fun. This reflects your preferences, not a diagnosis, equipment recommendation, or inspection.', 'play-result-note'));
      const controls = el('div', undefined, 'play-controls');
      controls.append(button('Change my last answer', 'btn outline', () => {step--; renderQuiz(true);}), button('Play again', 'btn primary', () => {answers = []; step = 0; renderQuiz(true);}));
      quiz.append(box, controls); if (focus) title.focus(); return;
    }
    const field = el('fieldset', undefined, 'play-question');
    const legend = el('legend', QUESTIONS[step][0]); legend.tabIndex = -1; field.append(legend);
    const choices = el('div', undefined, 'play-answers');
    const next = button(step === QUESTIONS.length - 1 ? 'Meet my home personality →' : 'Next question →', 'btn primary', () => {
      if (answers[step] === undefined) return;
      step++; renderQuiz(true);
    });
    next.disabled = answers[step] === undefined;
    QUESTIONS[step][1].forEach((text, index) => {
      const choice = button(text, 'play-choice', () => {
        answers[step] = index;
        for (const [i, node] of [...choices.children].entries()) node.setAttribute('aria-pressed', String(i === index));
        next.disabled = false;
      });
      choice.setAttribute('aria-pressed', String(answers[step] === index)); choices.append(choice);
    });
    field.append(choices); quiz.append(field);
    const controls = el('div', undefined, 'play-controls');
    if (step > 0) controls.append(button('Back', 'btn outline', () => {step--; renderQuiz(true);}));
    controls.append(next); quiz.append(controls); if (focus) legend.focus();
  }
  renderQuiz();

  const options = doc.querySelector('#priority-options'), output = doc.querySelector('#priority-result');
  let picks = [];
  const pickButtons = PRIORITIES.map((item, index) => {
    const node = button('', 'priority-choice', () => {
      if (picks.includes(index)) picks = picks.filter(i => i !== index);
      else if (picks.length < 3) picks.push(index);
      renderPicks();
    });
    options.append(node); return node;
  });
  function renderPicks() {
    pickButtons.forEach((node, index) => {
      const rank = picks.indexOf(index);
      node.setAttribute('aria-pressed', String(rank !== -1));
      // Keep unpicked cards focusable so keyboard visitors can explore the choices.
      node.setAttribute('aria-disabled', String(rank === -1 && picks.length === 3));
      node.replaceChildren(el('strong', (rank === -1 ? '' : `${rank + 1}. `) + PRIORITIES[index].name), el('small', PRIORITIES[index].detail));
    });
    output.replaceChildren(el('p', picks.length === 3 ? 'Your top three. One manageable start.' : `${picks.length} of 3 picked. Choose in your preferred order.`));
    if (picks.length === 3) {
      const list = el('ol');
      picks.forEach(index => {
        const item = PRIORITIES[index], row = el('li');
        row.append(el('strong', item.name + '. '), doc.createTextNode(item.tip + ' '), link(item.action + ' →', item.href)); list.append(row);
      });
      output.append(list, el('p', 'Your choices have not been sent to a business. Start with the first item when you’re ready. If something appears unsafe or needs urgent attention, deal with that before this wish list.', 'play-result-note'));
    }
  }
  doc.querySelector('#priority-reset').addEventListener('click', () => {picks = []; renderPicks(); pickButtons[0].focus();});
  renderPicks();
}
if (typeof document !== 'undefined') initPlayground(document);
