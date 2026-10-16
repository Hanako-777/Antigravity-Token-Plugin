// Dedicated IDE DOM adapter. No host classes, model labels or translated copy
// are used to identify the composer; only its stable ID and semantic controls.
module.exports = function createIdeSurface() {
  const GUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const visible=e=>e?.isConnected&&!e.closest('[hidden],[inert]')&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
  function setMarkup(target,markup) {
    // VS Code requires TrustedHTML and owns all permitted policies. Build this
    // plugin's fixed template using DOM operations, without adding a policy or
    // weakening the host CSP. Never pass model responses or host HTML here.
    const tags=new Set('style div span button strong section dl dt dd p i svg path circle ellipse rect header h1 h2 nav footer table thead tbody tr th td details summary'.split(' '));
    const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'};
    const decode=s=>s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(all,key)=>key[0]==='#'?String.fromCodePoint(parseInt(key.slice(key[1]?.toLowerCase()==='x'?2:1),key[1]?.toLowerCase()==='x'?16:10)):entities[key]||all);
    const fragment=document.createDocumentFragment(),stack=[fragment];let offset=0;
    const token=/<\/?([a-z][\w-]*)(\s[^<>]*?)?\s*\/?\s*>/gi;
    for(let match;(match=token.exec(markup));){
      if(match.index>offset)stack.at(-1).append(document.createTextNode(decode(markup.slice(offset,match.index))));
      const tag=match[1].toLowerCase(),closing=match[0][1]==='/';
      if(!tags.has(tag))throw Error('Unsupported dashboard template element');
      if(closing){if(stack.length===1||stack.at(-1).localName!==tag)throw Error('Unbalanced dashboard template');stack.pop();}
      else{
        const parent=stack.at(-1),svg=tag==='svg'||parent.namespaceURI==='http://www.w3.org/2000/svg';
        const element=svg?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);
        const attrs=match[2]||'',attr=/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
        for(let a;(a=attr.exec(attrs));){
          const name=a[1];if(name==='/'||/^on/i.test(name)||/^(src|href|srcdoc)$/i.test(name))throw Error('Unsupported dashboard template attribute');
          element.setAttribute(name,decode(a[2]??a[3]??a[4]??''));
        }
        parent.append(element);
        if(tag==='style'){
          const end=markup.indexOf('</style>',token.lastIndex);if(end<0)throw Error('Unclosed dashboard style');
          element.textContent=markup.slice(token.lastIndex,end);token.lastIndex=end+8;
        }else if(!match[0].endsWith('/>'))stack.push(element);
      }
      offset=token.lastIndex;
    }
    if(stack.length!==1)throw Error('Unclosed dashboard template');
    if(offset<markup.length)fragment.append(document.createTextNode(decode(markup.slice(offset))));
    target.replaceChildren(fragment);
  }
  function findComposer(previous) {
    const boxes=[...document.querySelectorAll('[id="antigravity.agentSidePanelInputBox"]')].filter(visible),pairs=[];
    for(const box of boxes){
      const editors=[...box.querySelectorAll('[contenteditable="true"][role="combobox"],[contenteditable="true"][role="textbox"]')].filter(visible);
      const models=[...box.querySelectorAll('[data-testid="model-selector-trigger"]')].filter(visible);
      if(editors.length!==1||models.length!==1)continue;
      const editor=editors[0],model=models[0];let row=model.parentElement;
      while(row&&row!==box&&!row.parentElement?.contains(editor))row=row.parentElement;
      if(!row||row===box||row.contains(editor))continue;
      const style=getComputedStyle(row),r=row.getBoundingClientRect(),e=editor.getBoundingClientRect();
      if(style.display!=='flex'||style.flexDirection!=='row'||['absolute','fixed'].includes(style.position)||r.width<1||Math.max(0,r.top-e.bottom)>48)continue;
      let branch=model;while(branch.parentElement!==row)branch=branch.parentElement;
      pairs.push({editor,model,row,branch,box,kind:'ide'});
    }
    if(pairs.length===1)return pairs[0];
    return pairs.find(p=>p.editor===document.activeElement)||pairs.find(p=>p.editor===previous?.editor)||null;
  }
  function conversationState(composer) {
    const unavailable={id:null,status:'unavailable'};
    if(!composer?.box?.isConnected)return unavailable;
    // The region that owns this exact input also owns its conversation. Never
    // read history/sidebar/subagent rows or another workbench window's ID.
    const region=composer.box.closest('[id="conversation"][role="region"]');
    if(!region)return unavailable;
    const ids=new Set([...region.querySelectorAll('[data-testid="conversation-view"][data-cascade-id]')]
      .filter(visible).map(e=>e.dataset.cascadeId).filter(id=>GUID.test(id)));
    if(ids.size===1)return {id:[...ids][0],status:'active'};
    if(ids.size>1)return unavailable;
    // IDE 2.5.5's native Preact composer does not publish a data-cascade-id.
    // Resolve only the vnode owning this exact input box, then read its nearest
    // cascadeId prop. Do not enumerate message props, hook state or other chats.
    const panel=composer.box.closest('.antigravity-agent-side-panel');
    const tree=panel?.__k;if(!tree)return unavailable;
    const pending=[tree],seen=new Set();let match=null;
    while(pending.length&&seen.size<12000){
      const vnode=pending.pop();if(!vnode||seen.has(vnode))continue;seen.add(vnode);
      if(typeof vnode.type==='string'&&vnode.__e===composer.box){match=vnode;break;}
      if(Array.isArray(vnode.__k))pending.push(...vnode.__k);
    }
    for(let hops=0;match&&hops<60;hops++,match=match.__){
      if(Object.hasOwn(match.props||{},'cascadeId')){
        const id=match.props.cascadeId;
        if(GUID.test(id||''))return {id,status:'active'};
        // An explicitly empty native owner is a new conversation. A missing
        // or incompatible private API must not be labelled as a new chat.
        return id===null||id===undefined||id===''?{id:null,status:'new'}:unavailable;
      }
      if(match===tree)break;
    }
    return unavailable;
  }
  const conversationId=composer=>conversationState(composer).id;
  function nativeReserve({branch,model}) {
    const style=getComputedStyle(branch),label=model.querySelector('span'),ms=getComputedStyle(model);
    const labelWidth=label?Math.max(label.scrollWidth,label.getBoundingClientRect().width):model.scrollWidth;
    const icons=[...model.querySelectorAll('svg')],gap=parseFloat(ms.columnGap)||0;
    const modelWidth=labelWidth+icons.reduce((s,e)=>s+Math.max(14,e.getBoundingClientRect().width),0)+gap*icons.length+(parseFloat(ms.paddingLeft)||0)+(parseFloat(ms.paddingRight)||0);
    const children=[...branch.children].filter(e=>visible(e)&&e.id!=='ag-pulse-status-bar');
    return Math.ceil(children.reduce((sum,e)=>sum+(e.contains(model)?Math.max(modelWidth,e.getBoundingClientRect().width):e.getBoundingClientRect().width),0)+(parseFloat(style.columnGap)||0)*Math.max(0,children.length-1)+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+2);
  }
  return {findComposer,conversationId,conversationState,nativeReserve,setMarkup,showEmpty:true,usageHostLabel:'Antigravity IDE'};
};
