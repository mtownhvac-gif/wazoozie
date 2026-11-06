const money = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'});
export function visitTotal(values) {
  if (values.length !== 3 || values.some(v => typeof v !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(v))) return null;
  const cents = values.map(v => Math.round(Number(v) * 100));
  if (cents.some(v => v > 100000000)) return null;
  return cents.reduce((a,b) => a+b,0) / 100;
}
const form = document.querySelector('#offer-form');
if (form) {
  const result = document.querySelector('#offer-result');
  const notes = document.querySelector('#offer-notes');
  const copy = document.querySelector('#offer-copy');
  const panel = document.querySelector('#offer-notes-panel');
  const copyStatus = document.querySelector('#offer-copy-status');
  const receipt = document.querySelector('#offer-receipt');
  const totalDisplay = document.querySelector('#offer-total');
  const receiptLabel = document.querySelector('#offer-receipt-label');
  const keys = ['visit','diagnostic','extras'];
  const field = key => form.querySelector(`[name="${key}"]`);
  const clear = message => {
    result.textContent = message;
    notes.value = '';
    panel.hidden = true;
    panel.open = false;
    copy.disabled = true;
    copyStatus.textContent = '';
    receipt.hidden = true;
    totalDisplay.textContent = '';
  };
  function calculate(example=false) {
    const values = keys.map(key=>field(key).value.trim());
    const total = visitTotal(values);
    if (total === null) {
      clear('The total is still unknown. Enter a confirmed nonnegative amount in all three fields, with up to two decimal places and no currency symbols. Maximum $1,000,000 per field.');
      return;
    }
    const prefix = example ? 'Fictional example—not a business quote. ' : 'Based only on your inputs. ';
    receipt.hidden = false;
    receiptLabel.textContent = example ? 'FICTIONAL EXAMPLE' : 'YOUR INPUT TOTAL';
    totalDisplay.textContent = money.format(total);
    result.textContent = `${prefix}Pre-repair visit total: ${money.format(total)}. Repairs are separate. Ask whether any fee credit depends on approving further work.`;
    notes.value = `${prefix}\nVisit / dispatch: ${money.format(Number(values[0]))}\nAdditional diagnosis: ${money.format(Number(values[1]))}\nOther required charges and taxes: ${money.format(Number(values[2]))}\nPre-repair total: ${money.format(total)}\n\nBefore I book:\n• Is this the full charge if I approve no repairs?\n• What assessment is included?\n• Does any credit require an approved repair or purchase?\n• Will you get my approval before additional work?\n\nPrepared with https://wazoozie.com/pricing-guide/#offer-decoder`;
    panel.hidden = false;
    copy.disabled = false;
    copyStatus.textContent = '';
  }
  form.hidden = false;
  form.addEventListener('submit',event=>{event.preventDefault();calculate();});
  form.addEventListener('input',()=>clear('Amounts changed. Calculate again; blank fields mean the total is still unknown.'));
  form.addEventListener('reset',()=>clear('Enter all three confirmed amounts. Blank fields mean the total is still unknown.'));
  document.querySelector('#offer-example').addEventListener('click',()=>{
    ['49','150','0'].forEach((value,i)=>{field(keys[i]).value=value;});
    calculate(true);
  });
  document.querySelector('#offer-included-example').addEventListener('click',()=>{
    ['49','0','0'].forEach((value,i)=>{field(keys[i]).value=value;});
    calculate(true);
  });
  copy.addEventListener('click',async()=>{
    if (copy.disabled || !notes.value) return;
    const text = notes.value;
    try {
      await navigator.clipboard.writeText(text);
      if (notes.value === text) copyStatus.textContent = 'Copied. Your questions are ready for the call.';
    } catch {
      if (notes.value !== text) return;
      copyStatus.textContent = 'Copy is unavailable. Select and copy the notes above.';
      notes.focus(); notes.select();
    }
  });
}
