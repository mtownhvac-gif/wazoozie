const money = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
export function projectBudget(values) {
  if (values.length !== 4 || values.some(value => typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value))) return null;
  const [work, other, fees, allowance] = values.map(Number);
  if ([work, other, fees].some(value => value > 10000000) || allowance > 100) return null;
  const subtotal = Math.round(work * 100) + Math.round(other * 100) + Math.round(fees * 100);
  const extra = Math.round(subtotal * allowance / 100);
  return {subtotal: subtotal / 100, extra: extra / 100, total: (subtotal + extra) / 100};
}
const form = document.querySelector('#growth-budget');
const result = document.querySelector('#growth-budget-result');
if (form) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const amounts = projectBudget(['work', 'other', 'fees', 'allowance'].map(key => form.elements[key].value));
    result.textContent = amounts ? `Your inputs total ${money.format(amounts.subtotal)}. Your chosen allowance adds ${money.format(amounts.extra)}. Planning total: ${money.format(amounts.total)}. This is not a quote.` : 'Enter a nonnegative amount in every field. Maximum $10,000,000 per cost and 100% allowance.';
  });
  form.addEventListener('input', () => { result.textContent = 'Amounts changed. Calculate again for an updated total.'; });
  form.addEventListener('reset', () => { result.textContent = 'Enter all four amounts to see your total.'; });
}
document.querySelector('[data-growth-print]')?.addEventListener('click', () => window.print());
const shareText = {
  home: 'Planning work at home? Wazoozie has free home tips, project tools and named local businesses for Delco, Chester County and the Main Line. Start here: https://wazoozie.com/home-tips/',
  checklist: 'A practical seasonal home checklist you can print and use: https://wazoozie.com/seasonal-home-checklist/',
  tools: 'Prepare for your next contractor conversation with this free project sheet: https://wazoozie.com/project-kit/'
};
for (const button of document.querySelectorAll('[data-copy-share]')) button.addEventListener('click', async () => {
  const text = shareText[button.dataset.copyShare];
  if (!text) return;
  const field = document.querySelector('#growth-share-text');
  const status = document.querySelector('#growth-share-status');
  field.value = text;
  try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Review the text and share it where it will be useful.'; }
  catch { status.textContent = 'Select and copy the prepared text below.'; field.focus(); field.select(); }
});
