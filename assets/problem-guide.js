import {BUSINESSES, INTENTS} from './project-config.mjs';
import {PROBLEMS} from './problem-config.mjs';
const choices = document.querySelector('#problemChoices');
const result = document.querySelector('#problemResult');
const make = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const link = (text, href, className) => {
  const element = make('a', text, className);
  element.href = href;
  return element;
};
function select(problem) {
  const intent = INTENTS[problem.intent];
  const business = BUSINESSES[intent.provider];
  const checklist = make('ul', '', 'guide-checklist');
  for (const item of problem.prepare) checklist.append(make('li', item));
  const actions = make('div', '', 'project-actions');
  actions.append(link(`Call ${business.phone}`, `tel:${business.tel}`, 'btn primary'));
  if (business.booking) actions.append(link('Book with Middletown ↗', business.booking, 'btn outline'));
  result.replaceChildren(make('div', 'A GOOD STARTING POINT', 'eyebrow'), make('h2', business.name), make('p', problem.reason), actions, make('h3', 'Three things to have handy.'), checklist, link('Prepare my project details →', `/start/?intent=${problem.intent}`), link('Get to know the business →', `/businesses/${business.slug}/`), make('p', 'Call to confirm your address, availability and any diagnostic charge before arranging a visit.', 'project-muted'));
  for (const button of choices.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.problem === problem.key));
  history.replaceState(null, '', `#${problem.key}`);
  const heading = result.querySelector('h2');
  heading.tabIndex = -1;
  heading.focus({preventScroll:true});
  const view = document.defaultView;
  if (view.matchMedia?.('(max-width: 720px)').matches) {
    result.scrollIntoView({block:'start',behavior:view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
}
for (const problem of PROBLEMS) {
  const button = make('button', problem.label + ' →');
  button.type = 'button'; button.dataset.problem = problem.key;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => select(problem));
  choices.append(button);
}
const initial = PROBLEMS.find(problem => '#' + problem.key === location.hash);
if (initial) select(initial);
