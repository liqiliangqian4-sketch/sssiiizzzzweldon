(()=>{
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const names=$$('[data-module]').map(x=>x.id),tabs=$$('[data-tab]');
 const storageKey=$('meta[name="storage-key"]').content;
 let current=names[0],all=false,editing=false,previousFocus,sourceKey,toastTimer;
 let state={schema:'running-board-v3-edit-v1',fields:{},sources:{},cost:{}};
 const fields=new Map();
 for(const element of $$('[data-edit]')){const key=element.dataset.edit;if(!fields.has(key))fields.set(key,[]);fields.get(key).push(element)}
 const toast=message=>{const t=$('#toast');t.textContent=message;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3300)};
 function validUrl(value){if(!value)return '';const u=new URL(value);if(!['http:','https:'].includes(u.protocol))throw Error('来源网址须以 http:// 或 https:// 开头');return u.href}
 function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));$('#saveState').textContent='已保存在本机 · '+new Date().toLocaleTimeString('zh-CN',{hour12:false})}catch{$('#saveState').textContent='本机存储不可用，请下载网页或导出数据'}}
 function syncField(key,value,except){for(const el of fields.get(key)||[])if(el!==except)el.textContent=value}
 function applySource(key,entry){
  for(const field of ['source','manual','secondary']){
   if(!(field in entry))continue;const url=entry[field];
   for(const a of $$('[data-source-key]'))if(a.dataset.sourceKey===key&&a.dataset.sourceField===field){a.hidden=!url;if(url)a.href=url}
   if(url)for(const article of $$('article.case').filter(a=>a.dataset.product===key)){
    const row=article.querySelector('.case-sources');
    if(![...row.querySelectorAll('a')].some(a=>a.dataset.sourceKey===key&&a.dataset.sourceField===field)){
     const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.dataset.sourceKey=key;a.dataset.sourceField=field;a.textContent=({source:'竞品商品 / 系列',manual:'安装资料',secondary:'相关来源'})[field]+' ↗';row.insertBefore(a,row.querySelector('.source-edit'));
    }
   }
  }
 }
 function applyState(data){
  if(data.schema!=='running-board-v3-edit-v1')throw Error('这不是本页的修改数据文件');
  const clean={schema:data.schema,fields:{},sources:{},cost:{}};
  for(const [key,value]of Object.entries(data.fields||{}))if(fields.has(key)&&typeof value==='string'){clean.fields[key]=value;syncField(key,value)}
  const sourceKeys=new Set($$('[data-source-edit]').map(x=>x.dataset.sourceEdit));
  for(const [key,entry]of Object.entries(data.sources||{}))if(sourceKeys.has(key)&&entry&&typeof entry==='object'){
   const s={};for(const field of ['source','manual','secondary'])if(typeof entry[field]==='string')s[field]=validUrl(entry[field]);
   if(s.source==='')throw Error('竞品商品网址不能为空');clean.sources[key]=s;applySource(key,s);
  }
  for(const input of $$('[data-cost]')){const value=data.cost?.[input.dataset.cost];if(typeof value==='string'&&value.length<30){input.value=value;clean.cost[input.dataset.cost]=value}}
  state=clean;recalculate();
 }
 try{const stored=localStorage.getItem(storageKey);if(stored)applyState(JSON.parse(stored))}catch{toast('本机修改数据未能恢复；原始网页仍可使用')}
 function refreshOffsets(){document.documentElement.style.setProperty('--top-h',$('.top').offsetHeight+'px');document.documentElement.style.setProperty('--nav-h',$('.module-tabs').offsetHeight+'px')}
 const observer=new ResizeObserver(refreshOffsets);observer.observe($('.top'));observer.observe($('.module-tabs'));refreshOffsets();
 function show(id,scroll=false){
  if(!names.includes(id))id=names[0];current=id;all=false;$('#showAll').setAttribute('aria-pressed','false');$('#showAll').textContent='展开全部 '+names.length+' 模块';
  for(const section of $$('[data-module]'))section.hidden=section.id!==id;
  for(const button of tabs)button.setAttribute('aria-pressed',String(button.dataset.tab===id));
  if(scroll)window.scrollTo({top:$('.module-tabs').getBoundingClientRect().top+window.scrollY-$('.top').offsetHeight,behavior:'instant'});
 }
 for(const button of tabs)button.addEventListener('click',()=>{show(button.dataset.tab,true);history.replaceState(null,'','#'+button.dataset.tab)});
 for(const button of $$('[data-next]'))button.addEventListener('click',()=>{show(button.dataset.next,true);history.replaceState(null,'','#'+button.dataset.next)});
 $('#showAll').addEventListener('click',e=>{all=!all;e.currentTarget.setAttribute('aria-pressed',String(all));e.currentTarget.textContent=all?'只看当前模块':'展开全部 '+names.length+' 模块';for(const section of $$('[data-module]'))section.hidden=!all&&section.id!==current;for(const b of tabs)b.setAttribute('aria-pressed',String(!all&&b.dataset.tab===current))});
 function hash(){const key=decodeURIComponent(location.hash.slice(1));if(names.includes(key))show(key,true);else if(key.startsWith('case-')){const target=document.getElementById(key);if(target){show(target.closest('[data-module]').id);requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}))}}}
 show(current);hash();window.addEventListener('hashchange',hash);
 const lightbox=$('#lightbox'),zoomImage=lightbox.querySelector('img');
 function closeBox(){lightbox.hidden=true;document.body.style.overflow='';previousFocus?.focus()}
 for(const button of $$('[data-zoom]'))button.addEventListener('click',()=>{previousFocus=button;const im=button.querySelector('img'),own=!!button.closest('.own-improvement');zoomImage.src=im.currentSrc||im.src;zoomImage.alt=im.alt;lightbox.setAttribute('aria-label',own?'现有产品原图':'竞品原图');lightbox.querySelector('p').textContent=own?'用户提供的现有产品资料；改善说明保留在网页中。':'真实竞品原图；文字与技术要点保留在网页中。';lightbox.hidden=false;document.body.style.overflow='hidden';$('#closeBox').focus()});
 $('#closeBox').addEventListener('click',closeBox);lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeBox()});
 document.addEventListener('keydown',e=>{if(!lightbox.hidden&&e.key==='Escape')closeBox();if(!lightbox.hidden&&e.key==='Tab'){e.preventDefault();$('#closeBox').focus()}});
 function setEdit(value){editing=value;document.body.classList.toggle('editing',editing);$('#editToggle').setAttribute('aria-pressed',String(editing));$('#editToggle').textContent=editing?'结束编辑':'编辑文字';$('.editing-banner').hidden=!editing;for(const el of $$('[data-edit]')){if(editing){el.setAttribute('contenteditable','plaintext-only');el.setAttribute('spellcheck','false')}else el.removeAttribute('contenteditable')}refreshOffsets()}
 $('#editToggle').addEventListener('click',()=>setEdit(!editing));
 for(const [key,elements]of fields)for(const element of elements)element.addEventListener('input',()=>{state.fields[key]=element.textContent;syncField(key,element.textContent,element);persist()});
 const sourceDialog=$('#sourceDialog'),form=$('#sourceForm');
 for(const button of $$('[data-source-edit]'))button.addEventListener('click',()=>{
  sourceKey=button.dataset.sourceEdit;$('#sourceName').textContent=(fields.get(sourceKey+'.brandmodel')?.[0]?.textContent)||sourceKey;
  for(const field of ['source','manual','secondary'])form.elements[field].value=state.sources[sourceKey]?.[field]??$$('[data-source-key]').find(a=>a.dataset.sourceKey===sourceKey&&a.dataset.sourceField===field)?.href??'';
  sourceDialog.showModal();
 });
 $('#sourceCancel').addEventListener('click',()=>sourceDialog.close());
 form.addEventListener('submit',e=>{e.preventDefault();try{const entry={};for(const field of ['source','manual','secondary'])entry[field]=validUrl(form.elements[field].value.trim());if(!entry.source)throw Error('请填写竞品商品网址');state.sources[sourceKey]=entry;applySource(sourceKey,entry);persist();sourceDialog.close();toast('来源链接已更新')}catch(error){toast(error.message)}});
 function recalculate(){const inputs=$$('[data-cost]'),output=$('#costResult');if(inputs.some(i=>i.value.trim()===''||!Number.isFinite(+i.value)||+i.value<0)){output.textContent='请填齐五项非负实测值；0 也需明确填写';output.className='';return}const v=Object.fromEntries(inputs.map(i=>[i.dataset.cost,+i.value]));const net=v.freight+v.package-v.joint-v.assembly-v.quality;output.textContent='每件净'+(net>=0?'节省':'增加')+' ¥'+Math.abs(net).toFixed(2)+(net>0?'；仍需通过结构与安装验证':net===0?'；经济性持平，继续验证用户收益':'；需重新评估成本与用户收益');output.className=net>0?'positive':'negative'}
 for(const input of $$('[data-cost]'))input.addEventListener('input',()=>{state.cost[input.dataset.cost]=input.value;recalculate();persist()});
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),20000)}
 $('#saveJson').addEventListener('click',()=>download(new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'}),'脚踏技术路线_V3_修改数据.json'));
 $('#importJson').addEventListener('click',()=>$('#jsonInput').click());
 $('#jsonInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{applyState(JSON.parse(await file.text()));persist();toast('修改数据已导入')}catch(error){toast('导入失败：'+error.message)}finally{e.target.value=''}});
 const resourceCache=new Map();
 async function asDataUrl(url){if(url.startsWith('data:'))return url;if(!resourceCache.has(url))resourceCache.set(url,(async()=>{const response=await fetch(url);if(!response.ok)throw Error('图片读取失败：'+response.status);const bytes=new Uint8Array(await response.arrayBuffer());const signature=String.fromCharCode(...bytes.slice(0,4));const mime=signature==='RIFF'?'image/webp':bytes[0]===137?'image/png':bytes[0]===255?'image/jpeg':signature.startsWith('GIF')?'image/gif':response.headers.get('content-type');if(!mime?.startsWith('image/'))throw Error('无法识别图片格式');const blob=new Blob([bytes],{type:mime});return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})})());return await resourceCache.get(url)}
 $('#saveHtml').addEventListener('click',async()=>{
  const button=$('#saveHtml');button.disabled=true;button.textContent='打包中…';
  try{
   const clone=document.documentElement.cloneNode(true);
   for(const css of [...clone.querySelectorAll('link[rel="stylesheet"]')]){const response=await fetch(css.href);if(!response.ok)throw Error('样式读取失败');const style=document.createElement('style');style.textContent=await response.text();css.replaceWith(style)}
   for(const script of [...clone.querySelectorAll('script[src]')]){const response=await fetch(script.src);if(!response.ok)throw Error('脚本读取失败');script.textContent=await response.text();script.removeAttribute('src')}
   const images=[...clone.querySelectorAll('img[src]')].filter(i=>i.getAttribute('src'));
   for(let i=0;i<images.length;i+=6)await Promise.all(images.slice(i,i+6).map(async im=>{im.src=await asDataUrl(im.src);im.removeAttribute('srcset')}));
   const body=clone.querySelector('body');body.classList.remove('editing');body.style.overflow='';clone.querySelector('.editing-banner').hidden=true;
   for(const el of clone.querySelectorAll('[contenteditable]'))el.removeAttribute('contenteditable');
   const edit=clone.querySelector('#editToggle');edit.textContent='编辑文字';edit.setAttribute('aria-pressed','false');
   clone.querySelector('#lightbox').hidden=true;clone.querySelector('#lightbox img').removeAttribute('src');clone.querySelector('#sourceDialog').removeAttribute('open');clone.querySelector('#toast').hidden=true;
   for(const input of clone.querySelectorAll('[data-cost]'))input.setAttribute('value',$$('[data-cost]').find(i=>i.dataset.cost===input.dataset.cost).value);
   const save=clone.querySelector('#saveHtml');save.disabled=false;save.textContent='下载网页';
   clone.querySelector('meta[name="storage-key"]').content='running-board-v3-export-'+Date.now();
   download(new Blob(['<!doctype html>\n'+clone.outerHTML],{type:'text/html;charset=utf-8'}),'脚踏技术路线_V3_五大模块_我的修改版.html');toast('已下载含图片的离线网页，可直接转发');
  }catch(error){toast('下载未完成：'+error.message)}finally{button.disabled=false;button.textContent='下载网页'}
 });
})();
