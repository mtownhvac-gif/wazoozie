const checks = [...document.querySelectorAll('[data-decision-check]')];
const status = document.querySelector('#decisionStatus');
function update() {
  const complete = checks.filter(check => check.checked).length;
  status.textContent = `${complete} of ${checks.length} conversation points covered. ${complete === checks.length ? 'Keep the written proposal and confirm any remaining questions with the business.' : 'Use the open items to guide your next conversation.'}`;
}
for (const check of checks) check.addEventListener('change', update);
update();
document.querySelector('#printChecklist').addEventListener('click', () => window.print());
