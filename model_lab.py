"""Publish an unlisted, session-only model test bench outside the public sitemap."""
from pathlib import Path
import json
import shutil
import subprocess

def add(out):
    root=Path(__file__).parent
    target=out/'model-lab'
    target.mkdir(exist_ok=True)
    shutil.copy(root/'src/model-lab/index.html',target/'index.html')
    for name in ('model-lab.css','model-lab.js'):
        shutil.copy(root/'assets'/name,out/'assets'/name)
    config=subprocess.check_output(['node','--input-type=module','-e',"import {LAB_MODELS,LAB_SYSTEM} from './server/model-lab.mjs'; console.log(JSON.stringify({LAB_MODELS,LAB_SYSTEM}));"],cwd=root,text=True)
    data=json.loads(config)
    (out/'assets/model-lab-config.mjs').write_text('export const LAB_MODELS='+json.dumps(data['LAB_MODELS'])+';\nexport const LAB_SYSTEM='+json.dumps(data['LAB_SYSTEM'])+';\n')
