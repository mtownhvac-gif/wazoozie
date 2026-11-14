for (const button of document.querySelectorAll('[data-copy-situation]')) {
 button.hidden=false;
 button.addEventListener('click',async()=>{
  const root=button.closest('.situation-script');const text=root.querySelector('[data-situation-question]').textContent;
  const field=root.querySelector('.situation-copy-text');const status=root.querySelector('.situation-copy-status');field.value=text;
  try{await navigator.clipboard.writeText(text);status.textContent='Copied. Keep these questions handy when you call.';}
  catch{field.hidden=false;field.focus();field.select();status.textContent='Select and copy the questions below.';}
 });
}
