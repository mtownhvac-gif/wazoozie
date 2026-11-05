"""Place relevant published project photos beside service information and contact actions."""
import re,shutil
from pathlib import Path


def place(out):
    root=out.parent/'assets'
    actual={
      'middletown-conversion-project':'Middletown HVAC technician working at a Bosch outdoor heat pump on its published conversion project',
      'middletown-tankless-project':'Navien tankless water heater and copper piping from Middletown HVAC’s published conversion project',
      'middletown-ductless-project':'Fujitsu ductless indoor unit installed above a bedroom doorway by Middletown HVAC',
      'middletown-outdoor-project':'Fujitsu ductless outdoor unit installed by Middletown HVAC beside a stone wall and paver walkway'}
    for name in actual:shutil.copy(root/(name+'.jpg'),out/'assets'/(name+'.jpg'))
    photos={
      'services/oil-to-gas-conversion':'middletown-conversion-project',
      'services/ductless-mini-splits':'middletown-ductless-project',
      'services/heating-cooling':'middletown-outdoor-project',
      'services/water-heaters':'middletown-tankless-project',
      'services/replacement-estimates':'middletown-conversion-project',
      'businesses/middletown-hvac':'middletown-outdoor-project',
      'businesses/ryan-dugan-electric':'outdoor-lighting',
      'services/electrical':'outdoor-lighting',
      'businesses/liberator-service-company':'sink',
      'services/plumbing':'sink',
      'businesses/cooke-carpentry-construction':'window-framing',
      'services/handyman':'carpentry'}
    illustrations={'outdoor-lighting':'Illustrative outdoor lighting at a stone home','sink':'Illustrative kitchen sink and faucet','window-framing':'Illustrative window framing renovation','carpentry':'Illustrative timber structure under construction'}
    for path,name in photos.items():
      f=out/path/'index.html';s=f.read_text();w,h=(1200,1600) if name in ('middletown-conversion-project','middletown-tankless-project') else (1024,768) if name=='middletown-ductless-project' else (1200,800)
      img='<img src="/assets/'+name+'.jpg" alt="'+actual.get(name,illustrations.get(name,''))+'" width="'+str(w)+'" height="'+str(h)+'" fetchpriority="high" decoding="async">'
      s=re.sub(r'(<div class="page-art">)<img[^>]+>',lambda m:m[1]+img,s,count=1)
      label='Middletown HVAC project photo.' if name in actual else 'Illustrative service image.'
      s=s.replace('<span>A little local goes a long way.</span>', '',1)
      s=re.sub(r'(<meta property="og:image" content=")[^"]+',lambda m:m[1]+'https://wazoozie.com/assets/'+name+'.jpg',s,count=1)
      # Add the direct service source without representing illustrations as customer work.
      f.write_text(s)
