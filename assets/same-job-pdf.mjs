import {LIMITS} from './same-job-core.mjs';
const BASE='/assets/vendor/pdfjs-6.5.438/';
export async function extractEstimatePDF(file,{signal,onProgress=()=>{},loadLibrary=()=>import(BASE+'pdf.min.mjs'),workerFactory=url=>new Worker(url,{type:'module'})}={}){
 if(!file||typeof file.arrayBuffer!=='function'||file.size<5||file.size>LIMITS.bytes)throw Error('Choose a PDF no larger than 10 MB.');
 let loading,pdfWorker,nativeWorker,timer,abort,rejectWorker;let ended=false;
 const workerFailure=new Promise((_,reject)=>{rejectWorker=reject;});
 const stop=()=>{ended=true;try{nativeWorker?.terminate();}catch{}try{pdfWorker?.destroy();}catch{}};
 try{
  return await Promise.race([
   (async()=>{
    if(signal?.aborted)throw new DOMException('Reading cancelled.','AbortError');
    const bytes=new Uint8Array(await file.arrayBuffer());if(!new TextDecoder('latin1').decode(bytes.subarray(0,1024)).includes('%PDF-'))throw Error('This file could not be read as a PDF. Paste its wording instead.');
    const lib=await loadLibrary();if(ended||signal?.aborted)throw new DOMException('Reading cancelled.','AbortError');
    nativeWorker=workerFactory(BASE+'pdf.worker.min.mjs');
    const failed=event=>{event?.preventDefault?.();stop();rejectWorker(Error('The PDF reader could not start. Paste the estimate wording instead.'));};
    nativeWorker.addEventListener?.('error',failed,{once:true});nativeWorker.addEventListener?.('messageerror',failed,{once:true});
    // An explicit native worker prevents the parser falling back to the UI thread.
    pdfWorker=lib.PDFWorker.create({port:nativeWorker});
    loading=lib.getDocument({data:bytes,worker:pdfWorker,cMapUrl:BASE+'cmaps/',cMapPacked:true,standardFontDataUrl:BASE+'standard_fonts/',useWorkerFetch:true,useWasm:false,disableFontFace:true,enableXfa:false,disableWorkerRendering:true,enableHWA:false,enableWebGPU:false,stopAtErrors:true,verbosity:0});
    const doc=await loading.promise;if(doc.numPages>LIMITS.pages)throw Error('Use an estimate of 25 pages or fewer, or paste the relevant wording.');
    const pages=[],unreadable=[];let characters=0;
    for(let n=1;n<=doc.numPages;n++){
     if(ended||signal?.aborted)throw new DOMException('Reading cancelled.','AbortError');
     const page=await doc.getPage(n);const reader=page.streamTextContent({includeMarkedContent:false,disableNormalization:false}).getReader();const parts=[];
     try{for(;;){const chunk=await reader.read();if(chunk.done)break;for(const item of chunk.value?.items||[]){if(typeof item.str!=='string')continue;characters+=item.str.length+1;if(characters>LIMITS.characters)throw Error('This PDF has too much text. Paste a shorter section instead.');parts.push(item.str,item.hasEOL?'\n':' ');}}}
     finally{try{reader.releaseLock();}catch{}page.cleanup();}
     const text=parts.join('').trim();if(text.replace(/\s/g,'').length<20)unreadable.push(n);pages.push({number:n,text,source:'pdf'});onProgress(n,doc.numPages);
    }
    if(pages.reduce((n,p)=>n+p.text.trim().length,0)<LIMITS.minimum)throw Error('This PDF has little or no readable text. It may be a scan. Paste the estimate’s wording instead.');
    return {pages,unreadable};
   })(),
   workerFailure,
   new Promise((_,reject)=>{timer=setTimeout(()=>{stop();reject(Error('PDF reading took too long. Try a smaller file or paste its wording.'));},LIMITS.deadline);abort=()=>{stop();reject(new DOMException('Reading cancelled.','AbortError'));};signal?.addEventListener('abort',abort,{once:true});})
  ]);
 }catch(error){if(error?.name==='PasswordException')throw Error('This PDF is password-protected. Use an unlocked copy or paste the wording.');if(error?.name==='InvalidPDFException')throw Error('This PDF could not be read. Paste its wording instead.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(!ended&&loading){let cleanupTimer;try{await Promise.race([Promise.resolve(loading.destroy()).catch(()=>{}),new Promise(resolve=>{cleanupTimer=setTimeout(resolve,150);})]);}catch{}finally{clearTimeout(cleanupTimer);}}stop();}
}
