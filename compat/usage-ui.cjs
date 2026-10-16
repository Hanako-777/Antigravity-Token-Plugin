// Shared local usage views. Values and model labels are inserted as text.
module.exports = function createUsageDashboard({root,language,setMarkup,hostLabel='Antigravity',guideDismissed=true,onDismissGuide,onLanguage,onRefresh}) {
  const dialog=document.createElement('dialog');dialog.id='usage-dashboard';dialog.setAttribute('popover','manual');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',language.language==='zh-CN'?'用量统计':'Token usage');
  dialog.style.cssText='width:min(1080px,calc(100vw - 40px));max-width:none;height:min(860px,calc(100dvh - 50px));max-height:none;box-sizing:border-box;overflow:hidden;visibility:visible;pointer-events:auto;padding:0;border:1px solid var(--pulse-border);border-radius:18px;background:var(--pulse-background);color:var(--pulse-foreground);box-shadow:0 24px 100px #0006';
  const shell=document.createElement('div'),view=shell.attachShadow({mode:'open'});shell.style.height='100%';dialog.append(shell);root.append(dialog);
  const backdrop=document.createElement('style');backdrop.textContent='#usage-dashboard{position:fixed;inset:0;margin:auto}#usage-dashboard::backdrop{background:#0006;backdrop-filter:blur(3px);pointer-events:auto}';root.append(backdrop);
  const css=document.createElement('style');css.textContent=`
    :host{display:block;height:100%;color:var(--pulse-foreground);font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;font-variant-numeric:tabular-nums}
    *{box-sizing:border-box}button,select{font:inherit;color:inherit}button{cursor:pointer}button,select{border:1px solid var(--pulse-border);background:transparent;border-radius:7px}button{transition:background 140ms ease,transform 120ms cubic-bezier(.23,1,.32,1)}button:active{transform:scale(.97)}button:focus-visible,select:focus-visible{outline:2px solid var(--pulse-accent);outline-offset:3px}button[disabled]{opacity:.35;cursor:default}
    .page{height:100%;max-height:none;overflow-y:auto;overflow-x:hidden;padding:26px 32px 30px;display:flex;flex-direction:column;gap:24px;background:var(--pulse-background);scrollbar-gutter:stable}
    .top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
    .eyebrow{font-size:10px;color:var(--pulse-muted);letter-spacing:1.7px;margin-bottom:6px}
    h1{font-size:23px;letter-spacing:-.6px;line-height:1.2;margin:0 0 6px;font-weight:600}
    .sub{font-size:12px;color:var(--pulse-muted);display:flex;align-items:center}
    .live-dot{display:inline-block;width:5px;height:5px;background:var(--pulse-success);border-radius:50%;margin-right:6px}
    .actions{display:flex;gap:8px;align-items:center}
    .actions button{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;padding:0;line-height:1;border-radius:8px;color:var(--pulse-muted)}
    .actions button:hover{background:var(--pulse-hover);color:var(--pulse-foreground)}
    .actions svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .locale-label{display:block;min-width:16px;height:16px;line-height:16px;text-align:center;font-size:11px}
    
    /* HUD Pill Segmented Controls */
    .seg-control{display:inline-flex;align-items:center;background:var(--pulse-hover);padding:3px;border-radius:8px;gap:2px}
    .seg-btn{padding:4px 12px;border-radius:6px;border:none;background:transparent;font-size:11.5px;color:var(--pulse-muted);cursor:pointer;transition:all 0.18s ease}
    .seg-btn:hover{color:var(--pulse-foreground)}
    .seg-btn.active,.seg-btn[aria-pressed=true]{background:var(--pulse-control);color:var(--pulse-foreground);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.12)}
    
    .section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:0 0 16px}
    h2{font-size:15px;font-weight:600;letter-spacing:-.2px;margin:0}
    .muted{font-size:11px;color:var(--pulse-muted)}
    .chart-controls{display:flex;gap:10px;align-items:center}
    .range{display:flex;align-items:center;gap:10px}
    .range button{height:26px;width:26px;border:0}
    .range strong{font-size:12px;font-weight:500;min-width:106px;text-align:center}
    
    /* Year Picker */
    .year-picker{position:relative;flex:none}
    .year-trigger{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:76px;height:30px;padding:0 10px;background:var(--pulse-control);color:var(--pulse-foreground);font-size:11px;border-radius:8px}
    .year-trigger:hover,.year-trigger[aria-expanded=true]{background:var(--pulse-hover)}
    .year-chevron{width:12px;height:12px;fill:none;stroke:var(--pulse-muted);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transition:transform 160ms cubic-bezier(.23,1,.32,1)}
    .year-trigger[aria-expanded=true] .year-chevron{transform:rotate(180deg)}
    .year-menu{position:fixed;inset:auto;margin:0;padding:5px;width:112px;max-height:232px;overflow-y:auto;border:1px solid var(--pulse-border);border-radius:10px;background:var(--pulse-menu);color:var(--pulse-foreground);box-shadow:0 8px 26px var(--pulse-shadow);transform-origin:top right;opacity:1;transform:scale(1);transition:opacity 140ms ease,transform 160ms cubic-bezier(.23,1,.32,1)}
    .year-menu::backdrop{background:transparent;pointer-events:none}
    .year-option{width:100%;border:0;border-radius:6px;padding:7px 9px;display:flex;align-items:center;justify-content:space-between;gap:18px;font-size:12px;text-align:left;background:transparent;color:var(--pulse-foreground);font-variant-numeric:tabular-nums}
    .year-option:hover,.year-option:focus-visible{background:var(--pulse-hover)}
    .year-option[aria-selected=true]{background:color-mix(in srgb,var(--pulse-accent) 12%,var(--pulse-menu))}
    .year-check{color:var(--pulse-accent);width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:0}
    .year-option[aria-selected=true] .year-check{opacity:1}
    
    /* Heatmap Grid */
    .heat-wrap{overflow-x:auto;padding:3px 3px 7px}
    .calendar{min-width:680px}
    .months{display:grid;margin-left:31px;font-size:10px;color:var(--pulse-muted);margin-bottom:7px}
    .months span{white-space:nowrap}
    .heat-row{display:flex;gap:9px}
    .weekdays{display:grid;grid-template-rows:repeat(7,1fr);width:22px;flex:none;font-size:9px;color:var(--pulse-muted)}
    .heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px;width:100%}
    .heat button{border:0;border-radius:3px;padding:0;min-width:0;aspect-ratio:1;background:var(--pulse-hover);outline-offset:1px;cursor:pointer;transition:transform 0.1s ease}
    .heat button:hover{transform:scale(1.15);z-index:2}
    .heat button[data-level="1"],.swatch[data-level="1"]{background:color-mix(in srgb,var(--pulse-accent) 22%,var(--pulse-hover))}
    .heat button[data-level="2"],.swatch[data-level="2"]{background:color-mix(in srgb,var(--pulse-accent) 45%,var(--pulse-hover))}
    .heat button[data-level="3"],.swatch[data-level="3"]{background:color-mix(in srgb,var(--pulse-accent) 68%,var(--pulse-hover))}
    .heat button[data-level="4"],.swatch[data-level="4"]{background:var(--pulse-accent)}
    .heat button.future{opacity:.25;cursor:default}
    .heat-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:10px 0 16px;font-size:10px;color:var(--pulse-muted)}
    .scale{display:flex;align-items:center;gap:4px}
    .swatch{width:11px;height:11px;border-radius:3px;background:var(--pulse-hover)}
    
    .selected{padding:14px 18px;border:1px solid var(--pulse-border);border-radius:10px;display:flex;justify-content:space-between;gap:16px;align-items:center;background:var(--pulse-hover);margin-bottom:8px}
    .selected .title{font-weight:600;margin-bottom:3px;font-size:12px}
    .selected strong{font-weight:600}
    
    /* Bar Charts */
    .chart-wrap{overflow-x:auto;border-bottom:1px solid var(--pulse-separator);padding-bottom:17px;margin-bottom:18px;padding-top:6px}
    .chart{height:246px;display:flex;gap:14px;min-width:650px}
    .axis{width:42px;flex:none;position:relative;font-size:10px;color:var(--pulse-muted)}
    .axis span{position:absolute;right:0;transform:translateY(50%)}
    .plot{position:relative;flex:1;display:flex;align-items:stretch;gap:5px;padding:0 1px}
    .grid-line{position:absolute;left:0;right:0;border-top:1px solid var(--pulse-separator);pointer-events:none;opacity:.45}
    .grid-line:first-child{opacity:.85}
    .bar-column{position:relative;flex:1;min-width:0;display:flex;align-items:flex-end;border:0;border-radius:4px;background:transparent;padding:0;margin-bottom:19px;cursor:pointer}
    .bar-column:hover{background:transparent}
    .bar-column:active{transform:none}
    
    /* Thin Stacked Model Bars with Smooth Entrance Animation */
    .stack{display:flex;flex-direction:column-reverse;width:62%;max-width:28px;margin-inline:auto;gap:0;border-radius:4px 4px 0 0;overflow:hidden;transform-origin:bottom;animation:barRise 0.38s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes barRise{from{transform:scaleY(0);opacity:0.2}to{transform:scaleY(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.stack{animation:none}}
    
    .bar-segment{width:100%;min-height:0;display:block;flex:none;pointer-events:auto;background:var(--model-color);transition:opacity 140ms ease}
    .plot[data-highlight] .bar-segment:not([data-highlight=true]){opacity:.22}
    .empty-bar{height:1px;width:100%;background:var(--pulse-track);opacity:.35}
    .x-label{position:absolute;top:calc(100% + 5px);left:50%;transform:translateX(-50%);font-size:10px;color:var(--pulse-muted);white-space:nowrap}
    .chart-empty{position:absolute;left:0;right:0;top:40%;text-align:center;color:var(--pulse-muted);font-size:12px;pointer-events:none}
    
    .legend{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 18px}
    .legend button{display:flex;align-items:center;gap:7px;padding:4px 8px;border-radius:6px;font-size:11px;border:0;background:transparent;color:var(--pulse-muted)}
    .legend button:hover,.legend button[aria-pressed=true]{color:var(--pulse-foreground);background:var(--pulse-hover)}
    .legend button[aria-pressed=false]{opacity:.4;text-decoration:line-through}
    .dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none;background:var(--model-color)}
    
    .chart-summary{font-size:11px;color:var(--pulse-muted);margin-top:4px}
    .chart-summary strong{color:var(--pulse-foreground);font-weight:600}
    
    /* Table */
    .table-wrap{overflow:auto}
    .table{width:100%;border-collapse:collapse;text-align:right;font-size:11px;white-space:nowrap}
    .table th{font-weight:500;color:var(--pulse-muted);padding:8px 12px;border-bottom:1px solid var(--pulse-separator)}
    .table td{padding:12px;border-bottom:1px solid var(--pulse-separator)}
    .table th:first-child,.table td:first-child{text-align:left;padding-left:0}
    .table td:first-child span{margin-right:7px}
    .table tr:last-child td{border-bottom:0}
    
    .footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:14px;padding-top:16px;border-top:1px solid var(--pulse-separator);font-size:10px;color:var(--pulse-muted)}
    .alert{color:var(--pulse-warning);margin-top:12px;font-size:11px}
    .usage-waiting{display:grid;place-items:center;min-height:260px;color:var(--pulse-muted);font-size:12px}
    .usage-waiting[hidden]{display:none}
    
    /* Floating Tooltip following Mouse (HUD Style & Theme Adaptive) */
    .tip{position:fixed;z-index:99999;max-width:280px;min-width:200px;padding:10px 14px;border-radius:8px;font-size:11.5px;line-height:1.5;pointer-events:none;background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,0.14);box-shadow:0 8px 24px rgba(0,0,0,0.45);transition:opacity 80ms ease}
    .tip[hidden]{display:none}
    .tip.light{background:#ffffff !important;color:#0f172a !important;border:1px solid #e2e8f0 !important;box-shadow:0 8px 24px rgba(0,0,0,0.12) !important}
    .tip-date{font-weight:650;font-size:12px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15);color:#ffffff}
    .tip.light .tip-date{border-bottom:1px solid #e2e8f0;color:#0f172a}
    .tip-total{display:flex;justify-content:space-between;gap:18px;font-weight:600;margin-bottom:5px;color:#38bdf8}
    .tip.light .tip-total{color:#0284c7}
    .tip-row{display:flex;justify-content:space-between;gap:18px;color:rgba(255,255,255,0.78);font-size:11px;margin-bottom:2px}
    .tip.light .tip-row{color:#475569}
    .tip-model-name{display:flex;align-items:center;gap:6px}
    .tip-num{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:500;color:#ffffff}
    .tip.light .tip-num{color:#0f172a}
    .tip-share{font-size:10px;color:rgba(255,255,255,0.5);margin-left:6px}
    .tip.light .tip-share{color:#64748b}
    .tip-turns{display:flex;justify-content:space-between;gap:18px;color:rgba(255,255,255,0.65);font-size:11px;margin-top:6px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:4px}
    .tip.light .tip-turns{border-top:1px dashed #e2e8f0;color:#64748b}
  `;view.append(css);

  const page=document.createElement('div');page.className='page';
  setMarkup(page,`
    <header class="top">
      <div>
        <div class="eyebrow">ANTIGRAVITY DASHBOARD</div>
        <h1 id="title">用量统计</h1>
        <div class="sub"><span class="live-dot"></span><span id="subtitle"></span></div>
      </div>
      <div class="actions">
        <button id="locale" type="button" aria-label="Language"><span id="locale-label" class="locale-label">EN</span></button>
        <button id="refresh" type="button" aria-label="Refresh"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 7a5 5 0 1 0-1.3 4.4M13 3v4H9"/></svg></button>
        <button id="close" type="button" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>
      </div>
    </header>

    <section id="usage-waiting" class="usage-waiting" role="status" hidden></section>

    <!-- Section 1: Token 活动 (Heatmap / Weekly Bar Chart) -->
    <section id="section-activity">
      <div class="section-head">
        <div>
          <h2 id="activity-title">Token 活动</h2>
          <div class="muted" id="heat-sub">每格代表一天</div>
        </div>
        <div class="chart-controls">
          <div class="seg-control" id="heat-controls">
            <button type="button" class="seg-btn active" data-heat="day">每日</button>
            <button type="button" class="seg-btn" data-heat="week">每周</button>
          </div>
          <div class="year-picker">
            <button id="year" type="button" class="year-trigger" aria-label="Year" aria-haspopup="listbox" aria-controls="year-menu" aria-expanded="false">
              <span id="year-label"></span>
              <svg class="year-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
            </button>
            <div id="year-menu" class="year-menu" role="listbox" aria-label="Year" popover="manual"></div>
          </div>
        </div>
      </div>

      <!-- 1. Daily Heatmap Grid View -->
      <div id="heat-view">
        <div class="heat-wrap">
          <div class="calendar">
            <div class="months" id="months"></div>
            <div class="heat-row">
              <div class="weekdays" id="weekdays"></div>
              <div class="heat" id="heat"></div>
            </div>
          </div>
        </div>
        <div class="heat-footer">
          <span id="heat-summary"></span>
          <div class="scale">
            <span id="less">少</span>
            <i class="swatch"></i><i class="swatch" data-level="1"></i><i class="swatch" data-level="2"></i><i class="swatch" data-level="3"></i><i class="swatch" data-level="4"></i>
            <span id="more">多</span>
          </div>
        </div>
      </div>

      <!-- 2. Weekly Bar Chart View -->
      <div id="week-view" hidden>
        <div class="chart-wrap">
          <div class="chart">
            <div class="axis" id="week-axis"></div>
            <div class="plot" id="week-plot"></div>
          </div>
        </div>
      </div>

      <div class="selected">
        <div>
          <div class="title" id="selection-title"></div>
          <span class="muted" id="selection-value"></span>
        </div>
      </div>
    </section>

    <!-- Section 2: Token 消耗趋势 / 按模型统计 (Model Breakdown Chart & Table) -->
    <section id="section-details">
      <div class="section-head">
        <div>
          <h2 id="detail-title">按模型统计</h2>
          <div class="chart-summary" id="chart-summary"></div>
        </div>
        <div class="chart-controls">
          <div class="range">
            <button id="previous" aria-label="Previous">‹</button>
            <strong id="range-label"></strong>
            <button id="next" aria-label="Next">›</button>
          </div>
          <div class="seg-control" id="period-controls">
            <button type="button" class="seg-btn active" data-period="day">天</button>
            <button type="button" class="seg-btn" data-period="week">周</button>
            <button type="button" class="seg-btn" data-period="month">月</button>
          </div>
        </div>
      </div>

      <div class="legend" id="legend"></div>

      <div class="chart-wrap">
        <div class="chart">
          <div class="axis" id="axis"></div>
          <div class="plot" id="plot"></div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead><tr id="table-head"></tr></thead>
          <tbody id="table-body"></tbody>
        </table>
      </div>
    </section>

    <div class="alert" id="alert" hidden></div>
    <footer class="footer">
      <span id="coverage"></span>
      <span id="timezone"></span>
    </footer>
    <div class="tip" id="tip" role="status" hidden></div>
  `);
  view.append(page);

  const $=id=>view.getElementById(id),text=(id,value)=>{if($(id)&&$(id).textContent!==value)$(id).textContent=value;};
  let value=null,heatMode='day',period='day',year=null,anchor=null,selected=null,disabledModels=new Set(),lastKey='',busy=false,opener=null;
  let disposed=false,refreshMotion=null,refreshDelay=null,finishRefresh=null,accountKey=null,tipTarget=null,tipModel=null;
  const zh=()=>language.language==='zh-CN',w=(cn,en)=>zh()?cn:en;

  const full=n=>Number(n||0).toLocaleString(zh()?'zh-CN':'en-US');
  const compact=n=>{n=Number(n||0);const limits=[[1e9,'B'],[1e6,'M'],[1e3,'K']];for(const [base,suffix]of limits)if(n>=base)return (n/base).toFixed(1).replace(/\.0$/,'')+suffix;return full(n);};
  const add=(date,days)=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const week=date=>{const d=new Date(date+'T00:00:00Z');return add(date,-((d.getUTCDay()+6)%7));};
  const month=(date,shift)=>{const d=new Date(date.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+shift);return d.toISOString().slice(0,10);};
  const modelName=model=>model.replace(/-n$/,'').replace(/^gemini-/i,'Gemini ').replace(/^claude-/i,'Claude ').replace(/^gpt-/i,'GPT ').replace(/-/g,' ');
  const themeSignature=()=>{const s=getComputedStyle(root.host||dialog);return [s.getPropertyValue('--pulse-accent'),s.getPropertyValue('--pulse-background'),root.host?.dataset.pulseTheme].join('|');};

  let paletteKey='',modelColors=new Map();
  const colorCanvas=document.createElement('canvas');colorCanvas.width=colorCanvas.height=1;
  const colorContext=colorCanvas.getContext('2d',{willReadFrequently:true});
  const rgb=css=>{colorContext.clearRect(0,0,1,1);colorContext.fillStyle='#000';colorContext.fillStyle=css;colorContext.fillRect(0,0,1,1);return [...colorContext.getImageData(0,0,1,1).data].slice(0,3);};
  const luminance=a=>a.reduce((sum,v,i)=>{v/=255;return sum+(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*[.2126,.7152,.0722][i];},0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const hsl=a=>{const [r,g,b]=a.map(v=>v/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;return [d?((hi===r?(g-b)/d+(g<b?6:0):hi===g?(b-r)/d+2:(r-g)/d+4)*60):0,d?d/(1-Math.abs(2*l-1)):0,l];};
  const fromHsl=(h,s,l)=>{const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));};return [f(0),f(8),f(4)];};

  const isLightTheme=()=>{
    const bg=rgb(getComputedStyle(root.host||dialog).getPropertyValue('--pulse-background').trim()||'#1c1d1f');
    return luminance(bg)>=.35||root.host?.dataset.pulseTheme==='light';
  };

  function syncPalette(){
    const models=[...(value?.models||[])].sort(),key=themeSignature()+'|'+models.join('|');if(key===paletteKey)return;paletteKey=key;modelColors.clear();
    const style=getComputedStyle(root.host||dialog),base=rgb(style.getPropertyValue('--pulse-accent').trim()||'#85a8ff'),background=rgb(style.getPropertyValue('--pulse-background').trim()||'#1c1d1f'),[h,s]=hsl(base);
    const dark=luminance(background)<.35,offsets=[0,-18,18,-36,36,-9,9,-27,27],tones=dark?[.64,.52,.73,.59,.68]:[.43,.33,.51,.38,.47];
    const end=contrast([255,255,255],background)>contrast([0,0,0],background)?1:0;
    models.forEach((model,i)=>{const hue=(h+offsets[i%offsets.length]+360)%360,saturation=s<.08?.07:Math.max(.28,Math.min(.55,s*.72));let lightness=tones[i%tones.length],c=fromHsl(hue,saturation,lightness);
      for(let step=0;contrast(c,background)<3&&step<100;step++){lightness+=end?.005:-.005;lightness=Math.max(0,Math.min(1,lightness));c=fromHsl(hue,saturation,lightness);}
      modelColors.set(model,'rgb('+c.join(' ')+')');
    });
  }
  const color=model=>modelColors.get(model)||'var(--pulse-accent)';

  const totals=(from,to,filter=false)=>{
    const models={};for(const day of value?.days||[])if(day.date>=from&&day.date<=to)for(const [model,r]of Object.entries(day.models)){
      if(filter&&disabledModels.has(model))continue;
      models[model]||={total:0,requests:0,uncached:0,cacheRead:0,cacheWrite:0,output:0};for(const key of Object.keys(models[model]))models[model][key]+=r[key]||0;
    }
    return {from,to,models,total:Object.values(models).reduce((n,r)=>n+r.total,0),requests:Object.values(models).reduce((n,r)=>n+r.requests,0)};
  };
  const node=(tag,className,content)=>{const n=document.createElement(tag);if(className)n.className=className;if(content!==undefined)n.textContent=content;return n;};

  /* Dynamic Mouse Tracking & Boundary-Aware Tooltip */
  let globalMouse={clientX:0,clientY:0};
  view.addEventListener('pointermove',e=>{
    globalMouse.clientX=e.clientX;
    globalMouse.clientY=e.clientY;
    if(!$('tip').hidden)updateTooltipPos(e);
  });

  function updateTooltipPos(ev){
    const tip=$('tip');if(!tip||tip.hidden)return;
    const clientX=ev&&ev.clientX!==undefined?ev.clientX:globalMouse.clientX;
    const clientY=ev&&ev.clientY!==undefined?ev.clientY:globalMouse.clientY;
    const tipW=tip.offsetWidth||210,tipH=tip.offsetHeight||120;
    const bounds=dialog.getBoundingClientRect();
    let x=clientX+14;
    if(x+tipW>bounds.right-12)x=clientX-tipW-14;
    if(x<bounds.left+12)x=bounds.left+12;
    let y=clientY-tipH-10;
    if(y<bounds.top+12)y=clientY+18;
    if(y+tipH>bounds.bottom-12)y=bounds.bottom-tipH-12;
    tip.style.left=x+'px';
    tip.style.top=y+'px';
  }

  function tooltip(bucket,target,activeModel=null,ev=null){
    if(!$('tip').hidden&&tipTarget===target&&tipModel===activeModel){
      if(ev)updateTooltipPos(ev);return;
    }
    tipTarget=target;tipModel=activeModel;highlightModel(activeModel);
    const tip=$('tip');
    tip.className='tip'+(isLightTheme()?' light':'');
    const dateStr=bucket.from===bucket.to?bucket.from:bucket.from+' – '+bucket.to;
    let html=`<div class="tip-date">${dateStr}</div>`;
    if(bucket.total>0){
      html+=`<div class="tip-total"><span>${zh()?'总消耗:':'Total:'}</span><span class="tip-num">${full(bucket.total)} Token</span></div>`;
      const modelEntries=Object.entries(bucket.models||{}).filter(([m,r])=>r.total>0).sort((a,b)=>b[1].total-a[1].total);
      for(const [model,r]of modelEntries){
        const isDim=activeModel&&activeModel!==model;
        const clr=color(model);
        const share=bucket.total?(r.total/bucket.total*100).toFixed(1)+'%':'0%';
        html+=`<div class="tip-row"${isDim?' style="opacity:0.35"':''}>
          <span class="tip-model-name"><i class="dot" style="background:${clr};width:7px;height:7px;border-radius:2px;display:inline-block;flex:none"></i>${modelName(model)}</span>
          <span class="tip-num">${compact(r.total)} <span class="tip-share">${share}</span></span>
        </div>`;
      }
      html+=`<div class="tip-turns"><span>${zh()?'交互轮次:':'Requests:'}</span><span class="tip-num">${full(bucket.requests)} ${zh()?'次请求':'requests'}</span></div>`;
    }else{
      html+=`<div style="color:var(--pulse-muted);font-size:11px;">${zh()?'无使用记录':'No usage recorded'}</div>`;
    }
    setMarkup(tip,html);
    tip.hidden=false;
    updateTooltipPos(ev);
  }

  const bindBucket=(button,bucket)=>{
    button.setAttribute('aria-label',(bucket.from===bucket.to?bucket.from:bucket.from+' – '+bucket.to)+': '+full(bucket.total)+' Token');
    button.addEventListener('pointerenter',e=>tooltip(bucket,button,null,e));
    button.addEventListener('pointerleave',()=>{$('tip').hidden=true;tipTarget=null;tipModel=null;highlightModel(null);});
    button.addEventListener('pointermove',e=>{
      const seg=e.target.closest?.('.bar-segment');
      const model=seg?seg.dataset.model:null;
      tooltip(bucket,button,model,e);
    });
    button.addEventListener('focus',e=>tooltip(bucket,button,null,e));
    button.addEventListener('blur',()=>{$('tip').hidden=true;tipTarget=null;tipModel=null;highlightModel(null);});
    button.addEventListener('click',()=>{selected=bucket;anchor=bucket.from;showSelection();});
  };

  function showSelection(){
    const bucket=selected||totals(value.today,value.today);
    text('selection-title',bucket.from===bucket.to?bucket.from:bucket.from+' – '+bucket.to);
    text('selection-value',full(bucket.total)+' Token · '+w(`${bucket.requests} 次请求`,`${bucket.requests} requests`));
  }

  function renderHeat(){
    if(!value)return;
    const start=week(year+'-01-01'),end=year+'-12-31',weeks=Math.floor((Date.parse(end)-Date.parse(start))/604800000)+1;
    $('heat').replaceChildren();$('months').replaceChildren();$('weekdays').replaceChildren();
    $('heat').style.gridTemplateColumns=`repeat(${weeks},minmax(0,1fr))`;
    const buckets=[];
    for(let i=0;i<weeks*7;i++){
      const date=add(start,i);
      buckets.push(totals(date,date));
    }
    const max=Math.max(1,...buckets.map(b=>b.total));
    for(const bucket of buckets){
      const button=node('button','');button.type='button';
      const future=bucket.from>value.today||bucket.to<year+'-01-01'||bucket.from>year+'-12-31';
      button.dataset.level=bucket.total===0?'0':String(Math.min(4,Math.ceil(bucket.total/max*4)));
      if(future){button.className='future';button.disabled=true;}
      if(!future)bindBucket(button,bucket);
      button.tabIndex=-1;
      $('heat').append(button);
    }
    const usable=[...$('heat').children].filter(b=>!b.disabled),lastActive=[...$('heat').children].reverse().find(b=>!b.disabled&&b.dataset.level!=='0');
    if(usable.length)(lastActive||usable.at(-1)).tabIndex=0;
    $('months').style.gridTemplateColumns=`repeat(${weeks},minmax(0,1fr))`;
    for(let m=1;m<=12;m++){
      const date=`${year}-${String(m).padStart(2,'0')}-01`,col=Math.floor((Date.parse(date)-Date.parse(start))/604800000)+1;
      const label=node('span','',zh()?m+'月':['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]);
      label.style.gridColumn=col;label.style.gridRow=1;$('months').append(label);
    }
    for(let i=0;i<7;i++)$('weekdays').append(node('span','',i%2===0?(zh()?['一','','三','','五','','日'][i]:['M','','W','','F','','S'][i]):''));
    text('heat-sub',w('每格代表一天','Each square is one day'));
    const annual=totals(year+'-01-01',year+'-12-31');
    text('heat-summary',w(`${year} 年 · ${full(annual.total)} Token`,`${year} · ${full(annual.total)} tokens`));
    showSelection();
  }

  function renderWeeklyActivity(){
    if(!value)return;syncPalette();
    const start=week(year+'-01-01'),end=year+'-12-31',weeks=Math.floor((Date.parse(end)-Date.parse(start))/604800000)+1;
    const buckets=[];
    for(let i=0;i<weeks;i++){
      const from=add(start,i*7),to=add(from,6);
      buckets.push(totals(from<year+'-01-01'?year+'-01-01':from,to>end?end:to,true));
    }
    const max=Math.max(1,...buckets.map(b=>b.total)),ceiling=max>1?Math.ceil(max/(10**Math.floor(Math.log10(max))))*10**Math.floor(Math.log10(max)):1;
    $('week-axis').replaceChildren();$('week-plot').replaceChildren();
    for(let i=0;i<=4;i++){
      const label=node('span','',compact(ceiling*i/4));label.style.bottom=(19+(246-19)*i/4)+'px';$('week-axis').append(label);
      const line=node('i','grid-line');line.style.bottom=(19+(246-19)*i/4)+'px';$('week-plot').append(line);
    }
    for(const [i,bucket]of buckets.entries()){
      const button=node('button','bar-column');button.type='button';
      const stack=node('div','stack');
      stack.style.animationDelay=(i*8)+'ms';
      const segments=value.models.filter(m=>bucket.models[m]?.total>0);
      for(const [j,model]of segments.entries()){
        const r=bucket.models[model],bar=node('i','bar-segment'),height=r.total/ceiling*227;
        bar.dataset.model=model;bar.setAttribute('aria-hidden','true');bar.style.setProperty('--model-color',color(model));bar.style.height=height+'px';
        if(j&&height>=3)bar.style.boxShadow='inset 0 -1px 0 color-mix(in srgb,var(--pulse-background) 48%,transparent)';
        stack.append(bar);
      }
      if(!bucket.total)stack.append(node('i','empty-bar'));
      button.append(stack);
      if(i%4===0||i===buckets.length-1)button.append(node('span','x-label',bucket.from.slice(5)));
      bindBucket(button,bucket);
      $('week-plot').append(button);
    }
    text('heat-sub',w('每周用量统计 · 细长柱状图','Weekly token usage · stacked bars'));
    showSelection();
  }

  function highlightModel(model){
    if(model){
      $('plot').dataset.highlight=model;
      if($('week-plot'))$('week-plot').dataset.highlight=model;
    }else{
      delete $('plot').dataset.highlight;
      if($('week-plot'))delete $('week-plot').dataset.highlight;
    }
    for(const bar of view.querySelectorAll('.bar-segment')){
      if(model&&bar.dataset.model===model)bar.dataset.highlight='true';else delete bar.dataset.highlight;
    }
  }

  function renderChart(){
    if(!value)return;syncPalette();$('tip').hidden=true;highlightModel(null);
    const buckets=[];
    if(period==='day'){const start=month(anchor,0),end=add(month(anchor,1),-1);for(let date=start;date<=end;date=add(date,1))buckets.push(totals(date,date,true));text('range-label',start.slice(0,7));}
    else if(period==='week'){const start=add(week(anchor),-11*7);for(let i=0;i<12;i++){const from=add(start,i*7);buckets.push(totals(from,add(from,6),true));}text('range-label',start.slice(5)+' – '+add(week(anchor),6).slice(5));}
    else{for(let i=-11;i<=0;i++){const from=month(anchor,i);buckets.push(totals(from,add(month(from,1),-1),true));}text('range-label',buckets[0].from.slice(0,7)+' – '+month(anchor,0).slice(0,7));}
    $('next').disabled=period==='week'?week(anchor)>=week(value.today):anchor.slice(0,7)>=value.today.slice(0,7);
    $('legend').replaceChildren();
    for(const model of value.models){
      const button=node('button',''),dot=node('i','dot');
      dot.style.setProperty('--model-color',color(model));
      button.append(dot,document.createTextNode(modelName(model)));
      button.type='button';button.setAttribute('aria-pressed',String(!disabledModels.has(model)));
      button.addEventListener('click',()=>{if(disabledModels.has(model))disabledModels.delete(model);else disabledModels.add(model);renderChart();if(heatMode==='week')renderWeeklyActivity();});
      button.addEventListener('pointerenter',()=>highlightModel(disabledModels.has(model)?null:model));
      button.addEventListener('pointerleave',()=>highlightModel(null));
      $('legend').append(button);
    }
    const max=Math.max(1,...buckets.map(b=>b.total)),ceiling=max>1?Math.ceil(max/(10**Math.floor(Math.log10(max))))*10**Math.floor(Math.log10(max)):1;
    $('axis').replaceChildren();$('plot').replaceChildren();
    for(let i=0;i<=4;i++){
      const label=node('span','',compact(ceiling*i/4));label.style.bottom=(19+(246-19)*i/4)+'px';$('axis').append(label);
      const line=node('i','grid-line');line.style.bottom=(19+(246-19)*i/4)+'px';$('plot').append(line);
    }
    for(const [i,bucket]of buckets.entries()){
      const button=node('button','bar-column');button.type='button';
      const stack=node('div','stack');
      stack.style.animationDelay=(i*14)+'ms';
      const segments=value.models.filter(m=>bucket.models[m]?.total>0);
      for(const [j,model]of segments.entries()){
        const r=bucket.models[model],bar=node('i','bar-segment'),height=r.total/ceiling*227;
        bar.dataset.model=model;bar.setAttribute('aria-hidden','true');bar.style.setProperty('--model-color',color(model));bar.style.height=height+'px';
        if(j&&height>=3)bar.style.boxShadow='inset 0 -1px 0 color-mix(in srgb,var(--pulse-background) 48%,transparent)';
        stack.append(bar);
      }
      if(!bucket.total)stack.append(node('i','empty-bar'));
      button.append(stack);
      if(period!=='day'||i%3===0||i===buckets.length-1)button.append(node('span','x-label',period==='day'?String(i+1):period==='week'?bucket.from.slice(5):bucket.from.slice(0,7)));
      bindBucket(button,bucket);$('plot').append(button);
    }
    if(!buckets.some(b=>b.total))$('plot').append(node('div','chart-empty',w('所选时段暂无用量记录','No usage recorded in this period')));
    $('table-head').replaceChildren(...[w('模型','Model'),w('总 Token','Total tokens'),w('未缓存输入','Uncached input'),w('缓存读取','Cache read'),w('缓存写入','Cache write'),w('输出','Output')].map(label=>node('th','',label)));
    $('table-body').replaceChildren();
    const rangeTotals=totals(buckets[0].from,buckets.at(-1).to,true);
    $('chart-summary').replaceChildren(node('strong','',compact(rangeTotals.total)+' Token'),document.createTextNode(' · '+w(`${full(rangeTotals.requests)} 次请求`,`${full(rangeTotals.requests)} requests`)));
    for(const [model,r]of Object.entries(rangeTotals.models).sort((a,b)=>b[1].total-a[1].total)){
      const row=node('tr',''),label=node('td',''),dot=node('span','dot');dot.style.setProperty('--model-color',color(model));
      label.append(dot,document.createTextNode(modelName(model)));row.append(label,...[r.total,r.uncached,r.cacheRead,r.cacheWrite,r.output].map(n=>node('td','',full(n))));
      $('table-body').append(row);
    }
    for(const b of view.querySelectorAll('[data-period]'))b.classList.toggle('active',b.dataset.period===period);
  }

  function render(){
    if(!value){
      closeYear(false);$('tip').hidden=true;$('usage-waiting').hidden=false;
      text('usage-waiting',w('正在重新连接统计…','Reconnecting usage…'));text('subtitle',w('正在重新连接本机统计','Reconnecting local usage'));
      text('coverage','');text('timezone','');$('alert').hidden=true;
      return;
    }
    $('usage-waiting').hidden=true;
    syncPalette();
    text('title',w('用量统计','Token usage'));dialog.setAttribute('aria-label',w('用量统计','Token usage'));
    text('subtitle',w(`本机 ${hostLabel} · 当前账号`,`Local ${hostLabel} · current account`));
    text('activity-title',w('Token 活动','Token activity'));text('detail-title',w('按模型统计','Usage by model'));
    text('locale-label',zh()?'EN':'中');
    for(const [id,lbl]of [['locale',w('切换到英文','Switch to Chinese')],['refresh',w('刷新用量','Refresh usage')],['close',w('关闭','Close')]]){$(id).setAttribute('aria-label',lbl);$(id).title=lbl;}
    text('less',w('少','Less'));text('more',w('多','More'));
    for(const b of view.querySelectorAll('[data-heat]'))b.textContent=b.dataset.heat==='day'?w('每日','Daily'):w('每周','Weekly');
    for(const b of view.querySelectorAll('[data-period]'))b.textContent=({day:w('天','Day'),week:w('周','Week'),month:w('月','Month')})[b.dataset.period];
    
    // Switch between Daily Heatmap and Weekly Bar Chart
    $('heat-view').hidden=heatMode!=='day';
    $('week-view').hidden=heatMode!=='week';
    for(const b of view.querySelectorAll('[data-heat]'))b.classList.toggle('active',b.dataset.heat===heatMode);

    const years=[];const first=Number(value.firstDate?.slice(0,4)||value.today.slice(0,4)),currentYear=Number(value.today.slice(0,4)),minimum=Math.max(first,currentYear-10);
    for(let y=currentYear;y>=minimum;y--)years.push(y);
    if($('year').dataset.years!==years.join(',')){
      $('year-menu').replaceChildren(...years.map(y=>{const option=node('button','year-option');option.type='button';option.dataset.year=String(y);option.setAttribute('role','option');option.tabIndex=-1;
        setMarkup(option,'<span></span><svg class="year-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>');option.firstElementChild.textContent=String(y);
        option.addEventListener('click',()=>{year=String(y);syncYear();closeYear();if(heatMode==='day')renderHeat();else renderWeeklyActivity();});return option;}));$('year').dataset.years=years.join(',');
    }
    syncYear();
    text('coverage',w(`已记录 ${full(value.requests)} 次请求${value.firstDate?' · 始于 '+value.firstDate:''}`,`${full(value.requests)} requests recorded${value.firstDate?' · since '+value.firstDate:''}`));
    text('timezone',value.timeZone+' · '+(value.syncing||value.retryingConversations>0?w('正在同步历史…','Syncing history…'):w('本地统计','Local usage')));
    const alerts=[];if(value.unknownRequests)alerts.push(w(`${value.unknownRequests} 次请求日期未知，共 ${compact(value.unknownTokens)} Token`,`${value.unknownRequests} undated requests · ${compact(value.unknownTokens)} tokens`));
    const confirmedMissing=value.confirmedMissingConversations??(value.syncing?0:value.missingConversations);
    if(value.partialRequests||value.unreadableFiles||confirmedMissing>0&&!value.syncing||value.persistenceError)alerts.push(w('部分记录暂不可读取，用量可能不完整','Some records are unavailable; usage may be incomplete'));
    $('alert').hidden=!alerts.length;text('alert',alerts.join(' · '));
    
    if(heatMode==='day')renderHeat();else renderWeeklyActivity();
    renderChart();
  }

  for(const b of view.querySelectorAll('[data-heat]'))b.addEventListener('click',()=>{
    heatMode=b.dataset.heat;
    $('heat-view').hidden=heatMode!=='day';
    $('week-view').hidden=heatMode!=='week';
    for(const btn of view.querySelectorAll('[data-heat]'))btn.classList.toggle('active',btn.dataset.heat===heatMode);
    if(heatMode==='day')renderHeat();else renderWeeklyActivity();
  });
  for(const b of view.querySelectorAll('[data-period]'))b.addEventListener('click',()=>{
    period=b.dataset.period;renderChart();
  });

  function syncYear(){
    text('year-label',String(year));$('year').setAttribute('aria-label',w('选择年份','Select year')+' · '+year);$('year-menu').setAttribute('aria-label',w('年份','Year'));
    for(const option of $('year-menu').children)option.setAttribute('aria-selected',String(option.dataset.year===String(year)));
  }
  function closeYear(restore=true){if(!$('year-menu').matches(':popover-open'))return;$('year-menu').hidePopover();$('year').setAttribute('aria-expanded','false');if(restore)$('year').focus({preventScroll:true});}
  function positionYear(){
    if(!$('year-menu').matches(':popover-open'))return;const menu=$('year-menu'),r=$('year').getBoundingClientRect(),bounds=dialog.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;
    menu.style.left=Math.max(bounds.left+12,Math.min(r.right-width,bounds.right-width-12))+'px';const below=r.bottom+7;
    menu.style.top=(below+height<=bounds.bottom-12?below:Math.max(bounds.top+12,r.top-height-7))+'px';
  }
  function openYear(){
    $('tip').hidden=true;$('year-menu').showPopover();$('year').setAttribute('aria-expanded','true');positionYear();
    ($('year-menu').querySelector('[aria-selected=true]')||$('year-menu').firstElementChild)?.focus({preventScroll:true});
  }
  $('year').addEventListener('click',()=>{$('year-menu').matches(':popover-open')?closeYear():openYear();});
  $('year').addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();openYear();if(event.key==='Home')$('year-menu').firstElementChild?.focus();if(event.key==='End')$('year-menu').lastElementChild?.focus();}});
  $('year-menu').addEventListener('keydown',event=>{
    const options=[...$('year-menu').children],current=options.indexOf(view.activeElement);let next=null;
    if(event.key==='ArrowDown')next=Math.min(options.length-1,current+1);else if(event.key==='ArrowUp')next=Math.max(0,current-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=options.length-1;
    if(next!==null){event.preventDefault();options[next]?.focus({preventScroll:true});}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeYear();}else if(event.key==='Tab')closeYear();
  });
  view.addEventListener('pointerdown',event=>{const path=event.composedPath();if(!path.includes($('year'))&&!path.includes($('year-menu')))closeYear(false);});
  page.addEventListener('scroll',closeYearOnScroll,{passive:true});function closeYearOnScroll(){closeYear(false);}
  window.addEventListener('resize',positionYear);

  for(const [id,step]of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{anchor=period==='day'?month(anchor,step):period==='week'?add(anchor,step*84):month(anchor,step*12);renderChart();});
  $('locale').addEventListener('click',()=>void onLanguage(zh()?'en':'zh-CN'));
  $('refresh').addEventListener('click',async()=>{
    if(busy||disposed)return;busy=true;const button=$('refresh'),turn=600,started=performance.now();button.disabled=true;button.setAttribute('aria-busy','true');
    refreshMotion=button.querySelector('svg').animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:turn,iterations:Infinity});
    try{await onRefresh();}
    catch{if(!disposed){text('alert',w('暂时无法刷新，请稍后重试','Refresh unavailable. Try again shortly.'));$('alert').hidden=false;}}
    finally{
      if(!disposed){const elapsed=performance.now()-started,remaining=Math.max(turn,Math.ceil(elapsed/turn)*turn)-elapsed;
        await new Promise(resolve=>{finishRefresh=resolve;refreshDelay=setTimeout(resolve,Math.max(0,remaining));});}
      clearTimeout(refreshDelay);refreshDelay=null;finishRefresh=null;refreshMotion?.cancel();refreshMotion=null;busy=false;
      if(!disposed){button.disabled=false;button.setAttribute('aria-busy','false');}
    }
  });

  function present(){
    if(dialog.matches(':popover-open'))return;
    dialog.removeAttribute('open');dialog.showPopover();dialog.setAttribute('open','');
    $('locale').focus({preventScroll:true});
  }
  function conceal(){
    if(dialog.matches(':popover-open'))dialog.hidePopover();dialog.removeAttribute('open');
  }
  function close(){closeYear(false);conceal();$('tip').hidden=true;opener?.focus({preventScroll:true});}
  $('close').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  const contentKey=data=>JSON.stringify([{...data,updatedAt:undefined},language.language,themeSignature()]);
  const within=event=>event.composedPath().includes(dialog);
  function containFocus(event){if(!disposed&&dialog.open&&!within(event)){$('locale').focus({preventScroll:true});}}
  function containKeys(event){
    if(disposed||!dialog.open)return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();
      if($('year-menu').matches(':popover-open'))closeYear();else close();return;
    }
    if(event.key!=='Tab')return;
    if($('year-menu').matches(':popover-open'))closeYear(false);
    const controls=[...view.querySelectorAll('button,input,select,a[href],[tabindex]')].filter(n=>n.tabIndex>=0&&!n.disabled&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
    if(!controls.length){event.preventDefault();return;}
    const index=controls.indexOf(view.activeElement);
    if(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===controls.length-1){
      event.preventDefault();event.stopImmediatePropagation();(event.shiftKey?controls.at(-1):controls[0]).focus({preventScroll:true});
    }
  }
  function containScroll(event){if(!disposed&&dialog.open&&!within(event))event.preventDefault();}
  function containPointer(event){
    if(disposed||!dialog.open)return;
    const r=dialog.getBoundingClientRect();
    const backdropHit=event.composedPath()[0]===dialog;
    if(!within(event)||backdropHit&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)){event.preventDefault();event.stopImmediatePropagation();if(event.type==='click')close();}
  }
  document.addEventListener('focusin',containFocus,true);document.addEventListener('keydown',containKeys,true);
  document.addEventListener('wheel',containScroll,{capture:true,passive:false});document.addEventListener('touchmove',containScroll,{capture:true,passive:false});
  for(const type of ['pointerdown','mousedown','click'])document.addEventListener(type,containPointer,true);

  const themeObserver=new MutationObserver(()=>{if(!disposed&&value&&dialog.open){const key=contentKey(value);if(key!==lastKey){lastKey=key;render();}}});
  if(root.host)themeObserver.observe(root.host,{attributes:true,attributeFilter:['data-pulse-theme','style']});

  return {
    open(data,trigger){if(!data||disposed)return;accountKey=data.accountKey;value=data;opener=trigger;year||=data.today.slice(0,4);anchor||=data.today;lastKey=contentKey(data);render();present();},
    update(data){if(disposed)return;if(!data){if(!value)return;value=null;lastKey='';if(dialog.open)render();return;}if(accountKey&&accountKey!==data.accountKey){selected=null;disabledModels.clear();year=data.today.slice(0,4);anchor=data.today;}accountKey=data.accountKey;value=data;if(!dialog.open)return;const key=contentKey(data);if(key===lastKey)return;lastKey=key;render();},
    restoreModal(){if(!disposed&&dialog.open&&dialog.isConnected&&!dialog.matches(':popover-open')){closeYear(false);present();}},
    close,syncGuideDismissed(){},dispose(){disposed=true;themeObserver.disconnect();clearTimeout(refreshDelay);finishRefresh?.();refreshMotion?.cancel();closeYear(false);window.removeEventListener('resize',positionYear);document.removeEventListener('focusin',containFocus,true);document.removeEventListener('keydown',containKeys,true);document.removeEventListener('wheel',containScroll,true);document.removeEventListener('touchmove',containScroll,true);for(const type of ['pointerdown','mousedown','click'])document.removeEventListener(type,containPointer,true);conceal();dialog.remove();backdrop.remove();},get isOpen(){return dialog.open;}
  };
};
