"""Original line icons for the four business trades."""
import json
PATHS={
'middletown':'<circle cx="35" cy="16" r="7"/><path d="M35 3v3m0 20v3M22 16h3m20 0h3M26 7l2 2m14 14 2 2M44 7l-2 2M19 25v24M8.6 31l20.8 12M8.6 43l20.8-12M19 25l-4 4m4-4 4 4m-4 20-4-4m4 4 4-4M8.6 31l5.4-1m-5.4 1 1.8 5M29.4 43 24 44m5.4-1-1.8-5M8.6 43l1.8-5m-1.8 5 5.4 1M29.4 31 24 30m5.4 1-1.8 5"/>',
'ryan':'<path d="m30 4-19 25h13l-4 23 21-29H28z"/>',
'cooke':'<path d="m13 49 20-24-7-6L6 43zM23 15l9-10 13 11-4 5-5-1-4 6-9-8z"/>',
'liberator':'<path d="M12 48V17a9 9 0 0 1 18 0v3m-8 8 3-6h10l3 6zM20 33l-1 3m10-3v3m11-3 1 3M18 42l-1 3m12-3v3m13-3 1 3"/>'}
def icon(key):
 return '<svg class="business-emblem" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+PATHS[key]+'</svg>'
ICONS={k:icon(k) for k in PATHS}

ICONS['hart']=ICONS['cooke']
ICONS['rolledright']=ICONS['cooke']
