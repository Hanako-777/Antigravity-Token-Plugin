// Shared local usage views. Values and model labels are inserted as text.
module.exports = function createUsageDashboard({root,language,setMarkup,hostLabel='Antigravity',guideDismissed=true,onDismissGuide,onLanguage,onRefresh}) {
  const dialog=document.createElement('dialog');dialog.id='usage-dashboard';dialog.setAttribute('popover','manual');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',language.language==='zh-CN'?'用量统计':'Token usage');
  dialog.style.cssText='width:min(1080px,calc(100vw - 40px));max-width:none;height:min(880px,calc(100dvh - 40px));max-height:none;box-sizing:border-box;overflow:hidden;visibility:visible;pointer-events:auto;padding:0;border:1px solid var(--pulse-border);border-radius:18px;background:var(--pulse-background);color:var(--pulse-foreground);box-shadow:0 24px 100px #0006';
  const shell=document.createElement('div'),view=shell.attachShadow({mode:'open'});shell.style.height='100%';dialog.append(shell);root.append(dialog);
  const backdrop=document.createElement('style');backdrop.textContent='#usage-dashboard{position:fixed;inset:0;margin:auto}#usage-dashboard::backdrop{background:#0006;backdrop-filter:blur(3px);pointer-events:auto}';root.append(backdrop);
  const css=document.createElement('style');css.textContent=`
    :host{display:block;height:100%;color:var(--pulse-foreground);font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;font-variant-numeric:tabular-nums}
    *{box-sizing:border-box}button,select{font:inherit;color:inherit}button{cursor:pointer}button,select{border:1px solid var(--pulse-border);background:transparent;border-radius:7px}button{transition:background 140ms ease,transform 120ms cubic-bezier(.23,1,.32,1)}button:active{transform:scale(.97)}button:focus-visible,select:focus-visible{outline:2px solid var(--pulse-accent);outline-offset:3px}button[disabled]{opacity:.35;cursor:default}
    .page{height:100%;max-height:none;overflow-y:auto;overflow-x:hidden;padding:22px 28px 30px;display:flex;flex-direction:column;gap:18px;background:var(--pulse-background);scrollbar-gutter:stable}.page > *{flex-shrink:0}
    
    /* Top Header Navbar */
    .top{display:flex;justify-content:space-between;align-items:center}
    .brand-group{display:flex;align-items:center;gap:10px}
    .brand-name{font-size:17px;font-weight:650;letter-spacing:-.3px;color:var(--pulse-foreground);line-height:1.2}
    .brand-sub{font-size:12px;color:var(--pulse-muted);display:flex;align-items:center;margin-top:2px}
    .live-dot{display:inline-block;width:5px;height:5px;background:var(--pulse-success);border-radius:50%;margin-right:6px}
    .actions{display:flex;gap:7px;align-items:center}
    .actions button{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;padding:0;line-height:1;border-radius:8px;color:var(--pulse-muted)}
    .actions button:hover{background:var(--pulse-hover);color:var(--pulse-foreground)}
    .actions svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .locale-label{display:block;min-width:16px;height:16px;line-height:16px;text-align:center;font-size:11.5px}
    
    /* User Profile Hero (Centered at Top) */
    .profile-hero{display:flex;flex-direction:column;align-items:center;text-align:center;margin:4px 0 10px}
    .avatar-wrap{position:relative;width:96px;height:96px;margin-bottom:9px}
    .avatar-img{width:96px;height:96px;border-radius:50%;object-fit:cover;border:2.5px solid var(--pulse-border);box-shadow:0 6px 18px rgba(0,0,0,0.16);display:block}
    .avatar-fallback{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--pulse-accent),#ec4899);color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:600;border:2.5px solid var(--pulse-border)}
    .profile-name{font-size:20.5px;font-weight:650;color:var(--pulse-foreground);line-height:1.25;letter-spacing:-.2px}
    .profile-handle{font-size:13px;color:var(--pulse-muted);margin-top:3px;cursor:help;transition:color 0.15s ease}
    .profile-handle:hover{color:var(--pulse-accent)}
    
    /* Profile Hero Metrics Bar (4 Columns, Centered Content) */
    .codex-bar{background:var(--pulse-card);border:1px solid var(--pulse-border);border-radius:12px;padding:15px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;box-shadow:0 4px 16px var(--pulse-shadow);margin-bottom:2px}
    .codex-col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:2px 14px;min-width:0}
    .codex-col:not(:last-child){border-right:1px solid var(--pulse-separator)}
    .codex-label{font-size:13px;color:var(--pulse-muted);margin-bottom:6px;white-space:nowrap;text-align:center}
    .codex-num{font-size:24px;font-weight:650;letter-spacing:-.3px;color:var(--pulse-foreground);font-variant-numeric:tabular-nums;white-space:nowrap;display:flex;align-items:baseline;justify-content:center;gap:5px}
    .codex-unit{font-size:12.5px;font-weight:400;color:var(--pulse-muted)}
    
    /* Card Container Wrapper */
    .card-container{background:var(--pulse-card);border:1px solid var(--pulse-border);border-radius:14px;padding:18px 20px 20px;box-shadow:0 4px 18px var(--pulse-shadow);flex-shrink:0}
    
    /* Section Headers */
    .section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    .section-title{font-size:15.5px;font-weight:600;display:flex;align-items:center;gap:7px;color:var(--pulse-foreground)}
    .section-title svg{width:17px;height:17px;fill:none;stroke:var(--pulse-accent);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
    .chart-controls{display:flex;gap:10px;align-items:center}
    
    /* HUD Pill Segmented Controls */
    .seg-control{display:inline-flex;align-items:center;background:var(--pulse-hover);padding:3px;border-radius:8px;gap:2px}
    .seg-btn{padding:4px 14px;border-radius:6px;border:none;background:transparent;font-size:12.5px;color:var(--pulse-muted);cursor:pointer;transition:all 0.18s ease}
    .seg-btn:hover{color:var(--pulse-foreground)}
    .seg-btn.active,.seg-btn[aria-pressed=true]{background:var(--pulse-control);color:var(--pulse-foreground);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.12)}
    
    /* Year & Quarter Picker */
    .year-picker{position:relative;flex:none}
    .year-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:76px;height:30px;padding:0 10px;background:var(--pulse-control);color:var(--pulse-foreground);font-size:12px;border-radius:7px}
    .year-trigger:hover,.year-trigger[aria-expanded=true]{background:var(--pulse-hover)}
    .year-chevron{width:12px;height:12px;fill:none;stroke:var(--pulse-muted);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transition:transform 160ms cubic-bezier(.23,1,.32,1)}
    .year-trigger[aria-expanded=true] .year-chevron{transform:rotate(180deg)}
    .year-menu{position:fixed;inset:auto;margin:0;padding:5px;width:112px;max-height:232px;overflow-y:auto;border:1px solid var(--pulse-border);border-radius:10px;background:var(--pulse-menu);color:var(--pulse-foreground);box-shadow:0 8px 26px var(--pulse-shadow);transform-origin:top right;opacity:1;transform:scale(1);transition:opacity 140ms ease,transform 160ms cubic-bezier(.23,1,.32,1)}
    .year-menu::backdrop{background:transparent;pointer-events:none}
    .year-option{width:100%;border:0;border-radius:6px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;gap:18px;font-size:12.5px;text-align:left;background:transparent;color:var(--pulse-foreground);font-variant-numeric:tabular-nums}
    .year-option:hover,.year-option:focus-visible{background:var(--pulse-hover)}
    .year-option[aria-selected=true]{background:color-mix(in srgb,var(--pulse-accent) 12%,var(--pulse-menu))}
    .year-check{color:var(--pulse-accent);width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:0}
    .year-option[aria-selected=true] .year-check{opacity:1}
    
    /* Heatmap Grid with Diagonal Ripple Transition */
    .heat-wrap{overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none;-ms-overflow-style:none}
    .heat-wrap::-webkit-scrollbar{display:none;width:0;height:0}
    .calendar{max-width:640px;margin-inline:auto;width:100%}
    .months{display:grid;margin-left:31px;font-size:11.5px;color:var(--pulse-muted);margin-bottom:8px}
    .months span{white-space:nowrap}
    .heat-row{display:flex;gap:10px}
    .weekdays{display:grid;grid-template-rows:repeat(7,1fr);width:22px;flex:none;font-size:10.5px;color:var(--pulse-muted)}
    .heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:4px;width:100%}
    .heat button{border:0;border-radius:4px;padding:0;min-width:0;aspect-ratio:1;background:var(--pulse-hover);outline-offset:1px;cursor:pointer;transition:transform 0.1s ease;animation:cellPop 0.32s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes cellPop{0%{transform:scale(0.15);opacity:0}100%{transform:scale(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.heat button{animation:none}}
    .heat button:hover{transform:scale(1.25);z-index:2}
    .heat button[data-level="1"],.swatch[data-level="1"]{background:color-mix(in srgb,var(--pulse-accent) 22%,var(--pulse-hover))}
    .heat button[data-level="2"],.swatch[data-level="2"]{background:color-mix(in srgb,var(--pulse-accent) 45%,var(--pulse-hover))}
    .heat button[data-level="3"],.swatch[data-level="3"]{background:color-mix(in srgb,var(--pulse-accent) 68%,var(--pulse-hover))}
    .heat button[data-level="4"],.swatch[data-level="4"]{background:var(--pulse-accent)}
    .heat button.future{opacity:.22;cursor:default}
    .heat-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:12px 0 2px;font-size:11.5px;color:var(--pulse-muted)}
    .scale{display:flex;align-items:center;gap:5px}
    .swatch{width:12px;height:12px;border-radius:3px;background:var(--pulse-hover)}
    
    /* Bar Charts & Cumulative Line Chart */
    .chart-wrap{overflow-x:auto;padding-bottom:12px;padding-top:4px;scrollbar-width:none;-ms-overflow-style:none}
    .chart-wrap::-webkit-scrollbar{display:none;width:0;height:0}
    .chart{height:246px;display:flex;gap:14px;min-width:0;width:100%}
    .chart.wide-scroll{min-width:1380px}
    .axis{width:46px;flex:none;position:relative;font-size:11px;color:var(--pulse-muted)}
    .axis span{position:absolute;right:0;transform:translateY(50%)}
    .plot{position:relative;flex:1;display:flex;align-items:stretch;gap:4px;padding:0 1px}
    .grid-line{position:absolute;left:0;right:0;border-top:1px solid var(--pulse-separator);pointer-events:none;opacity:.45}
    .grid-line:first-child{opacity:.85}
    .bar-column{position:relative;flex:1;min-width:0;display:flex;align-items:flex-end;border:0;border-radius:4px;background:transparent;padding:0;margin-bottom:19px;cursor:pointer}
    .bar-column:hover{background:transparent}
    .bar-column:active{transform:none}
    
    /* Stacked Model Bars with Uniform Dimensions and Rise Animation */
    .stack{display:flex;flex-direction:column-reverse;width:20px;max-width:24px;margin-inline:auto;gap:0;border-radius:4px 4px 0 0;overflow:hidden;transform-origin:bottom;animation:barRise 0.38s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes barRise{from{transform:scaleY(0);opacity:0.2}to{transform:scaleY(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.stack{animation:none}}
    
    .bar-segment{width:100%;min-height:0;display:block;flex:none;pointer-events:auto;background:var(--model-color);transition:opacity 140ms ease}
    .plot[data-highlight] .bar-segment:not([data-highlight=true]){opacity:.22}
    .empty-bar{height:1px;width:100%;background:var(--pulse-track);opacity:.35}
    .x-label{position:absolute;top:calc(100% + 5px);left:50%;transform:translateX(-50%);font-size:11px;color:var(--pulse-muted);white-space:nowrap}
    .chart-empty{position:absolute;left:0;right:0;top:40%;text-align:center;color:var(--pulse-muted);font-size:13px;pointer-events:none}
    
    /* Cumulative Area Line Chart */
    .total-chart-svg{width:100%;height:100%;overflow:visible}
    .total-line-group{transform-origin:bottom;animation:areaRise 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes areaRise{from{transform:scaleY(0);opacity:0.2}to{transform:scaleY(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.total-line-group{animation:none}}
    
    .legend{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 16px}
    .legend button{display:flex;align-items:center;gap:7px;padding:4px 8px;border-radius:6px;font-size:12px;border:0;background:transparent;color:var(--pulse-muted)}
    .legend button:hover,.legend button[aria-pressed=true]{color:var(--pulse-foreground);background:var(--pulse-hover)}
    .legend button[aria-pressed=false]{opacity:.4;text-decoration:line-through}
    .dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none;background:var(--model-color)}
    
    .range{display:flex;align-items:center;gap:10px}
    .range button{height:28px;width:28px;border:0}
    .range strong{font-size:13px;font-weight:500;min-width:106px;text-align:center}
    .chart-summary{font-size:12px;color:var(--pulse-muted);margin-top:2px}
    .chart-summary strong{color:var(--pulse-foreground);font-weight:600}
    
    /* 6-Grid Stats in Token 消费统计 */
    .stats-6-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:4px}
    @media(max-width:700px){.stats-6-grid{grid-template-columns:repeat(2,1fr)}}
    .stat-card-box{background:var(--pulse-card);border:1px solid var(--pulse-border);border-radius:12px;padding:16px;box-shadow:0 4px 14px var(--pulse-shadow);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    .stat-card-head{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:500;color:var(--pulse-muted);margin-bottom:6px}
    .stat-card-head svg{width:15px;height:15px;fill:none;stroke:var(--pulse-accent);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
    .stat-card-num{font-size:21px;font-weight:650;letter-spacing:-.3px;color:var(--pulse-foreground);font-variant-numeric:tabular-nums}
    .stat-card-sub{font-size:11.5px;color:var(--pulse-muted);margin-top:3px}
    
    /* Daily Audit Table & Pagination */
    .table-wrap{overflow:auto;scrollbar-width:none;-ms-overflow-style:none}
    .table-wrap::-webkit-scrollbar{display:none;width:0;height:0}
    .table{width:100%;border-collapse:collapse;text-align:right;font-size:12.5px;white-space:nowrap}
    .table th{font-weight:500;color:var(--pulse-muted);padding:10px 14px;border-bottom:1px solid var(--pulse-separator);background:var(--pulse-hover);font-size:12px}
    .table td{padding:11px 14px;border-bottom:1px solid var(--pulse-separator);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12.5px}
    .table th:first-child,.table td:first-child{text-align:left;font-family:inherit;font-weight:500;color:var(--pulse-foreground)}
    .table tr:last-child td{border-bottom:0}
    .table tr:hover td{background:var(--pulse-hover)}
    .today-tag{font-size:10.5px;font-weight:500;padding:1px 6px;background:rgba(59,130,246,0.14);color:var(--pulse-accent);border-radius:4px;margin-left:6px;font-family:inherit}
    .col-total{font-weight:600;color:var(--pulse-accent)}
    .pagination-bar{display:flex;justify-content:space-between;align-items:center;padding:11px 18px;border-top:1px solid var(--pulse-separator);background:var(--pulse-hover);font-size:12px}
    .pagination-btns{display:flex;align-items:center;gap:6px}
    .page-btn{padding:5px 12px;border-radius:6px;border:1px solid var(--pulse-border);background:var(--pulse-control);color:var(--pulse-foreground);font-size:12px;cursor:pointer;transition:all 0.14s ease}
    .page-btn:hover:not(:disabled){background:var(--pulse-hover)}
    .page-btn:disabled{opacity:0.35;cursor:not-allowed}
    .page-numbers{display:flex;align-items:center;gap:4px}
    .page-num{min-width:26px;height:26px;display:grid;place-items:center;border-radius:5px;border:1px solid transparent;background:transparent;color:var(--pulse-muted);font-size:12px;cursor:pointer}
    .page-num.active{background:var(--pulse-control);color:var(--pulse-foreground);font-weight:600;border-color:var(--pulse-border)}
    
    .footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:4px;padding-top:12px;font-size:10px;color:var(--pulse-muted)}
    .alert{color:var(--pulse-warning);margin-top:6px;font-size:11px}
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
    <!-- Top Header Navigation -->
    <header class="top">
      <div class="brand-group">
        <svg style="width:22px;height:22px;flex-shrink:0;" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="brandSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--pulse-accent)"/>
              <stop offset="100%" stop-color="#f472b6"/>
            </linearGradient>
          </defs>
          <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#brandSparkGrad)"/>
        </svg>
        <div>
          <div class="brand-name">Antigravity Token</div>
          <div class="brand-sub"><span class="live-dot"></span><span id="subtitle">本机统计 · 当前账号</span></div>
        </div>
      </div>
      <div class="actions">
        <button id="locale" type="button" aria-label="Language"><span id="locale-label" class="locale-label">EN</span></button>
        <button id="refresh" type="button" aria-label="Refresh"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 7a5 5 0 1 0-1.3 4.4M13 3v4H9"/></svg></button>
        <button id="close" type="button" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>
      </div>
    </header>

    <!-- User Profile Hero (Larger avatar, masked handle with full email on hover) -->
    <div class="profile-hero">
      <div class="avatar-wrap">
        <img id="profile-avatar" class="avatar-img" src="" alt="Avatar" style="display:none;" />
        <div id="profile-fallback" class="avatar-fallback">A</div>
      </div>
      <div class="profile-name" id="profile-name">Antigravity User</div>
      <div class="profile-handle" id="profile-handle" title="">@user</div>
    </div>

    <!-- Profile Hero Metrics Bar (4 Metrics: 今日用量, 本周用量, 本月用量, 累计用量) -->
    <section class="codex-bar">
      <div class="codex-col">
        <div class="codex-label" id="codex-today-label">今日用量</div>
        <div class="codex-num"><span id="codex-today">—</span> <span class="codex-unit">Token</span></div>
      </div>
      <div class="codex-col">
        <div class="codex-label" id="codex-week-label">本周用量</div>
        <div class="codex-num"><span id="codex-week">—</span> <span class="codex-unit">Token</span></div>
      </div>
      <div class="codex-col">
        <div class="codex-label" id="codex-month-label">本月用量</div>
        <div class="codex-num"><span id="codex-month">—</span> <span class="codex-unit">Token</span></div>
      </div>
      <div class="codex-col">
        <div class="codex-label" id="codex-total-label">累计用量</div>
        <div class="codex-num"><span id="codex-total">—</span> <span class="codex-unit">Token</span></div>
      </div>
    </section>

    <section id="usage-waiting" class="usage-waiting" role="status" hidden></section>

    <!-- Section 1: Token 活动 (Card Container with Icon) -->
    <section class="card-container" id="section-activity">
      <div class="section-header">
        <div class="section-title">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span id="activity-title">Token 活动</span>
        </div>
        <div class="chart-controls">
          <div class="seg-control" id="heat-controls">
            <button type="button" class="seg-btn active" data-heat="day">每日</button>
            <button type="button" class="seg-btn" data-heat="week">每周</button>
            <button type="button" class="seg-btn" data-heat="total">累计</button>
          </div>
          <div class="year-picker">
            <button id="year" type="button" class="year-trigger" aria-label="Year" aria-haspopup="listbox" aria-controls="year-menu" aria-expanded="false">
              <span id="year-label"></span>
              <svg class="year-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
            </button>
            <div id="year-menu" class="year-menu" role="listbox" aria-label="Year" popover="manual"></div>
          </div>
          <div class="year-picker" id="quarter-picker">
            <button id="quarter" type="button" class="year-trigger" aria-label="Quarter" aria-haspopup="listbox" aria-controls="quarter-menu" aria-expanded="false">
              <span id="quarter-label">10-12月</span>
              <svg class="year-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
            </button>
            <div id="quarter-menu" class="year-menu" role="listbox" aria-label="Quarter" popover="manual"></div>
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

      <!-- 3. Cumulative Total Line Chart View -->
      <div id="total-view" hidden>
        <div class="chart-wrap">
          <div class="chart">
            <div class="axis" id="total-axis"></div>
            <div class="plot" id="total-plot"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Token 使用趋势 (Trend & Model Breakdown Chart) -->
    <section class="card-container" id="section-trend">
      <div class="section-header">
        <div class="section-title">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span id="trend-title">Token 使用趋势</span>
        </div>
        <div class="chart-controls">
          <div class="range" id="trend-range">
            <button id="previous" aria-label="Previous">‹</button>
            <strong id="range-label"></strong>
            <button id="next" aria-label="Next">›</button>
          </div>
          <div class="seg-control" id="trend-controls">
            <button type="button" class="seg-btn active" data-trend="daily">日走势</button>
            <button type="button" class="seg-btn" data-trend="model">模型统计</button>
          </div>
        </div>
      </div>

      <div class="legend" id="legend"></div>

      <div class="chart-wrap">
        <div class="chart">
          <div class="axis" id="trend-axis"></div>
          <div class="plot" id="trend-plot"></div>
        </div>
      </div>
    </section>

    <!-- Section 3: Token 消费统计 (6-Grid Stats) -->
    <div class="section-header" style="margin-top:6px; margin-bottom:10px;">
      <div class="section-title">
        <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        <span>Token 消费统计</span>
      </div>
    </div>
    <section class="stats-6-grid">
      <div class="stat-card-box">
        <div class="stat-card-head"><svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><span>总 Token 消费</span></div>
        <div class="stat-card-num" id="stat-total">—</div>
        <div class="stat-card-sub">历史有效计费总量</div>
      </div>
      <div class="stat-card-box">
        <div class="stat-card-head"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg><span>输入 Token (Prompt)</span></div>
        <div class="stat-card-num" id="stat-input">—</div>
        <div class="stat-card-sub">未缓存提示词输入</div>
      </div>
      <div class="stat-card-box">
        <div class="stat-card-head"><svg viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg><span>输出 Token (Gen)</span></div>
        <div class="stat-card-num" id="stat-output">—</div>
        <div class="stat-card-sub">思考推理与回答生成</div>
      </div>
      <div class="stat-card-box">
        <div class="stat-card-head"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg><span>缓存读取 (Cache)</span></div>
        <div class="stat-card-num" id="stat-cache">—</div>
        <div class="stat-card-sub" id="stat-cache-sub">Tokens 命中</div>
      </div>
      <div class="stat-card-box">
        <div class="stat-card-head"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>总会话轮次 (Turns)</span></div>
        <div class="stat-card-num" id="stat-turns">—</div>
        <div class="stat-card-sub">多会话累计执行</div>
      </div>
      <div class="stat-card-box">
        <div class="stat-card-head"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>今日实时消耗</span></div>
        <div class="stat-card-num" id="stat-today">—</div>
        <div class="stat-card-sub" id="stat-today-sub">当日会话实时消耗</div>
      </div>
    </section>

    <!-- Section 4: 每日消费审计明细 (Table with 10-day Pagination) -->
    <section class="card-container" id="section-audit" style="padding:0; overflow:hidden; flex-shrink:0;">
      <div style="padding: 13px 18px; border-bottom: 1px solid var(--pulse-separator); display:flex; justify-content:space-between; align-items:center;">
        <div class="section-title">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span id="audit-title">每日明细</span>
        </div>
        <span class="muted" id="audit-count" style="font-size:11.5px;">共 0 天记录</span>
      </div>
      <div class="table-wrap" style="padding:0; margin:0;">
        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th style="text-align:right;">交互轮次</th>
              <th style="text-align:right;">输入 Tokens</th>
              <th style="text-align:right;">输出 Tokens</th>
              <th style="text-align:right;">缓存读取</th>
              <th style="text-align:right;">当日总计 (Tokens)</th>
            </tr>
          </thead>
          <tbody id="audit-table-body"></tbody>
        </table>
      </div>
      <!-- Pagination Controls (10 days per page) -->
      <div class="pagination-bar" id="audit-pagination">
        <span class="muted" id="pagination-info">第 1 / 1 页</span>
        <div class="pagination-btns">
          <button type="button" class="page-btn" id="page-prev">‹ 上一页</button>
          <div id="page-numbers" class="page-numbers"></div>
          <button type="button" class="page-btn" id="page-next">下一页 ›</button>
        </div>
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
  let value=null,heatMode='day',trendMode='daily',year=null,quarter=null,anchor=null,selectedDate=null,disabledModels=new Set(),lastKey='',busy=false,opener=null;
  let disposed=false,refreshMotion=null,refreshDelay=null,finishRefresh=null,accountKey=null,tipTarget=null,tipModel=null;
  let auditPage=1;const auditPageSize=10;
  const zh=()=>language.language==='zh-CN',w=(cn,en)=>zh()?cn:en;
  const getQuarterRange=(y,q)=>{
    const ranges=[
      {start:`${y}-01-01`,end:`${y}-03-31`,label:zh()?'1-3月':'Jan-Mar',mStart:1,mEnd:3},
      {start:`${y}-04-01`,end:`${y}-06-30`,label:zh()?'4-6月':'Apr-Jun',mStart:4,mEnd:6},
      {start:`${y}-07-01`,end:`${y}-09-30`,label:zh()?'7-9月':'Jul-Sep',mStart:7,mEnd:9},
      {start:`${y}-10-01`,end:`${y}-12-31`,label:zh()?'10-12月':'Oct-Dec',mStart:10,mEnd:12}
    ];
    return ranges[(q||4)-1]||ranges[3];
  };

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
    let html=`<div class="tip-date">${bucket.modelTitle?bucket.modelTitle:dateStr}</div>`;
    if(bucket.isCumulative){
      html+=`<div class="tip-total"><span>${zh()?'累计消耗:':'Cumulative:'}</span><span class="tip-num">${full(bucket.total)} Token</span></div>`;
      html+=`<div class="tip-row" style="color:var(--pulse-accent);font-weight:600;"><span>${zh()?'当日消耗:':'Day added:'}</span><span class="tip-num">+${compact(bucket.dayAdded||0)} Token</span></div>`;
      html+=`<div class="tip-turns"><span>${zh()?'累计交互:':'Total requests:'}</span><span class="tip-num">${full(bucket.requests)} ${zh()?'次':'requests'}</span></div>`;
    }else if(bucket.isSingleModel){
      html+=`<div class="tip-total"><span>${zh()?'模型消耗:':'Model tokens:'}</span><span class="tip-num">${full(bucket.total)} Token</span></div>`;
      html+=`<div class="tip-row"><span>${zh()?'未缓存输入:':'Uncached input:'}</span><span class="tip-num">${compact(bucket.uncached||0)}</span></div>`;
      html+=`<div class="tip-row"><span>${zh()?'缓存读取:':'Cache read:'}</span><span class="tip-num">${compact(bucket.cacheRead||0)}</span></div>`;
      html+=`<div class="tip-row"><span>${zh()?'模型输出:':'Output:'}</span><span class="tip-num">${compact(bucket.output||0)}</span></div>`;
      html+=`<div class="tip-turns"><span>${zh()?'交互轮次:':'Requests:'}</span><span class="tip-num">${full(bucket.requests||0)} ${zh()?'次请求':'requests'}</span></div>`;
    }else if(bucket.total>0){
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
  };

  /* Render 1: Daily Heatmap Grid (Diagonal Ripple Transition & Cell Click to Model Jump) */
  function renderHeat(){
    if(!value)return;
    const q=getQuarterRange(year,quarter);
    const start=week(q.start),end=q.end,weeks=Math.floor((Date.parse(end)-Date.parse(start))/604800000)+1;
    $('heat').replaceChildren();$('months').replaceChildren();$('weekdays').replaceChildren();
    $('heat').style.gridTemplateColumns=`repeat(${weeks},minmax(0,1fr))`;
    const buckets=[];
    for(let i=0;i<weeks*7;i++){
      const date=add(start,i);
      buckets.push(totals(date,date));
    }
    const max=Math.max(1,...buckets.map(b=>b.total));
    for(const [i,bucket]of buckets.entries()){
      const button=node('button','');button.type='button';
      const future=bucket.from>value.today||bucket.to<q.start||bucket.from>q.end;
      button.dataset.level=bucket.total===0?'0':String(Math.min(4,Math.ceil(bucket.total/max*4)));
      if(future){button.className='future';button.disabled=true;}
      
      // Diagonal Ripple Delay: (col + row) * 8ms
      const col=Math.floor(i/7),row=i%7;
      button.style.animationDelay=((col+row)*8)+'ms';
      
      if(!future){
        bindBucket(button,bucket);
        // Cell Click: jump to Trend Section in Model mode and show that day's result!
        button.addEventListener('click',()=>{
          selectedDate=bucket.from;
          trendMode='model';
          for(const btn of view.querySelectorAll('#trend-controls button'))btn.classList.toggle('active',btn.dataset.trend==='model');
          renderTrendSection();
          $('section-trend')?.scrollIntoView({behavior:'smooth',block:'nearest'});
        });
      }
      button.tabIndex=-1;
      $('heat').append(button);
    }
    const usable=[...$('heat').children].filter(b=>!b.disabled),lastActive=[...$('heat').children].reverse().find(b=>!b.disabled&&b.dataset.level!=='0');
    if(usable.length)(lastActive||usable.at(-1)).tabIndex=0;
    $('months').style.gridTemplateColumns=`repeat(${weeks},minmax(0,1fr))`;
    for(let m=q.mStart;m<=q.mEnd;m++){
      const date=`${year}-${String(m).padStart(2,'0')}-01`,col=Math.floor((Date.parse(date)-Date.parse(start))/604800000)+1;
      const label=node('span','',zh()?m+'月':['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]);
      label.style.gridColumn=col;label.style.gridRow=1;$('months').append(label);
    }
    for(let i=0;i<7;i++)$('weekdays').append(node('span','',i%2===0?(zh()?['一','','三','','五','','日'][i]:['M','','W','','F','','S'][i]):''));
    const annual=totals(q.start,q.end);
    text('heat-summary',w(`${year} 年 · ${q.label} · ${full(annual.total)} Token`,`${year} · ${q.label} · ${full(annual.total)} tokens`));
  }

  /* Render 2: Weekly Stacked Bar Chart */
  function renderWeeklyActivity(){
    if(!value)return;syncPalette();
    const q=getQuarterRange(year,quarter);
    const start=week(q.start),end=q.end,weeks=Math.floor((Date.parse(end)-Date.parse(start))/604800000)+1;
    const buckets=[];
    for(let i=0;i<weeks;i++){
      const from=add(start,i*7),to=add(from,6);
      buckets.push(totals(from<q.start?q.start:from,to>q.end?q.end:to,true));
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
      stack.style.animationDelay=(i*12)+'ms';
      stack.style.width='24px';stack.style.maxWidth='28px';
      const segments=value.models.filter(m=>bucket.models[m]?.total>0);
      for(const [j,model]of segments.entries()){
        const r=bucket.models[model],bar=node('i','bar-segment'),height=r.total/ceiling*227;
        bar.dataset.model=model;bar.setAttribute('aria-hidden','true');bar.style.setProperty('--model-color',color(model));bar.style.height=height+'px';
        if(j&&height>=3)bar.style.boxShadow='inset 0 -1px 0 color-mix(in srgb,var(--pulse-background) 48%,transparent)';
        stack.append(bar);
      }
      if(!bucket.total)stack.append(node('i','empty-bar'));
      button.append(stack);
      button.append(node('span','x-label',bucket.from.slice(5)));
      bindBucket(button,bucket);
      $('week-plot').append(button);
    }
  }

  /* Render 3: Cumulative Total Tokens Line & Area Chart */
  function renderTotalChart(){
    if(!value)return;syncPalette();
    const q=getQuarterRange(year,quarter);
    const qDays=(value.days||[]).filter(d=>d.date>=q.start&&d.date<=q.end);
    const plot=$('total-plot'),axis=$('total-axis');
    axis.replaceChildren();plot.replaceChildren();
    if(!qDays.length){
      plot.append(node('div','chart-empty',w('该季度暂无用量记录','No usage recorded in this quarter')));
      return;
    }
    let cum=0;
    const points=qDays.map(d=>{
      const dayTotal=Object.values(d.models).reduce((n,r)=>n+r.total,0);
      cum+=dayTotal;
      return {date:d.date,dayTotal,cumulative:cum,models:d.models,requests:Object.values(d.models).reduce((n,r)=>n+r.requests,0)};
    });
    const maxCum=points.at(-1)?.cumulative||1;
    const ceiling=maxCum>1?Math.ceil(maxCum/(10**Math.floor(Math.log10(maxCum))))*10**Math.floor(Math.log10(maxCum)):1;
    for(let i=0;i<=4;i++){
      const label=node('span','',compact(ceiling*i/4));label.style.bottom=(19+(246-19)*i/4)+'px';axis.append(label);
      const line=node('i','grid-line');line.style.bottom=(19+(246-19)*i/4)+'px';plot.append(line);
    }
    
    // SVG Line & Gradient Area Path
    const svgW=1000,svgH=227;
    const coords=points.map((pt,i)=>{
      const x=points.length>1?(i/(points.length-1))*svgW:svgW/2;
      const y=svgH-(pt.cumulative/ceiling)*(svgH-16);
      return [x,y];
    });
    const pathD='M '+coords.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
    const areaD=pathD+` L ${svgW},${svgH} L 0,${svgH} Z`;
    
    const svgWrap=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svgWrap.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);
    svgWrap.setAttribute('preserveAspectRatio','none');
    svgWrap.className.baseVal='total-chart-svg';
    setMarkup(svgWrap,`
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--pulse-accent)" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="var(--pulse-accent)" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <g class="total-line-group">
        <path d="${areaD}" fill="url(#areaGrad)"/>
        <path d="${pathD}" fill="none" stroke="var(--pulse-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <line id="total-cursor-line" x1="0" y1="0" x2="0" y2="${svgH}" stroke="var(--pulse-accent)" stroke-width="1.2" stroke-dasharray="3,3" opacity="0"/>
      <circle id="total-cursor-dot" r="4.5" fill="var(--pulse-accent)" stroke="var(--pulse-background)" stroke-width="2" opacity="0"/>
    `);
    
    const lineEl=svgWrap.querySelector('#total-cursor-line'),dotEl=svgWrap.querySelector('#total-cursor-dot');
    plot.append(svgWrap);
    
    plot.addEventListener('pointermove',e=>{
      const rect=plot.getBoundingClientRect();
      const relX=(e.clientX-rect.left)/rect.width;
      const idx=Math.min(points.length-1,Math.max(0,Math.round(relX*(points.length-1))));
      const pt=points[idx];
      if(!pt)return;
      const [cx,cy]=coords[idx];
      lineEl.setAttribute('x1',cx);lineEl.setAttribute('x2',cx);lineEl.setAttribute('opacity','0.8');
      dotEl.setAttribute('cx',cx);dotEl.setAttribute('cy',cy);dotEl.setAttribute('opacity','1');
      tooltip({from:pt.date,to:pt.date,total:pt.cumulative,dayAdded:pt.dayTotal,requests:pt.requests,models:pt.models,isCumulative:true},plot,null,e);
    });
    plot.addEventListener('pointerleave',()=>{
      lineEl.setAttribute('opacity','0');dotEl.setAttribute('opacity','0');
      $('tip').hidden=true;tipTarget=null;
    });
  }

  function highlightModel(model){
    if(model){
      $('trend-plot').dataset.highlight=model;
      if($('week-plot'))$('week-plot').dataset.highlight=model;
    }else{
      delete $('trend-plot').dataset.highlight;
      if($('week-plot'))delete $('week-plot').dataset.highlight;
    }
    for(const bar of view.querySelectorAll('.bar-segment')){
      if(model&&bar.dataset.model===model)bar.dataset.highlight='true';else delete bar.dataset.highlight;
    }
  }

  /* Render Section 2: Token 使用趋势 (Daily Trend or Model Breakdown with X-axis as Models) */
  function renderTrendSection(){
    if(!value)return;syncPalette();$('tip').hidden=true;highlightModel(null);
    const plot=$('trend-plot'),axis=$('trend-axis');
    axis.replaceChildren();plot.replaceChildren();

    if(trendMode==='daily'){
      $('trend-range').style.display='flex';
      $('legend').style.display='flex';
      text('trend-title',w('Token 使用趋势 · 日走势','Token Usage Trend · Daily'));
      
      const start=month(anchor,0),end=add(month(anchor,1),-1);
      const buckets=[];
      for(let date=start;date<=end;date=add(date,1))buckets.push(totals(date,date,true));
      text('range-label',start.slice(0,7));
      $('next').disabled=anchor.slice(0,7)>=value.today.slice(0,7);
      
      $('legend').replaceChildren();
      for(const model of value.models){
        const button=node('button',''),dot=node('i','dot');
        dot.style.setProperty('--model-color',color(model));
        button.append(dot,document.createTextNode(modelName(model)));
        button.type='button';button.setAttribute('aria-pressed',String(!disabledModels.has(model)));
        button.addEventListener('click',()=>{if(disabledModels.has(model))disabledModels.delete(model);else disabledModels.add(model);renderTrendSection();});
        button.addEventListener('pointerenter',()=>highlightModel(disabledModels.has(model)?null:model));
        button.addEventListener('pointerleave',()=>highlightModel(null));
        $('legend').append(button);
      }
      
      const max=Math.max(1,...buckets.map(b=>b.total)),ceiling=max>1?Math.ceil(max/(10**Math.floor(Math.log10(max))))*10**Math.floor(Math.log10(max)):1;
      for(let i=0;i<=4;i++){
        const label=node('span','',compact(ceiling*i/4));label.style.bottom=(19+(246-19)*i/4)+'px';axis.append(label);
        const line=node('i','grid-line');line.style.bottom=(19+(246-19)*i/4)+'px';plot.append(line);
      }
      for(const [i,bucket]of buckets.entries()){
        const button=node('button','bar-column');button.type='button';
        const stack=node('div','stack');
        stack.style.animationDelay=(i*12)+'ms';
        const segments=value.models.filter(m=>bucket.models[m]?.total>0);
        for(const [j,model]of segments.entries()){
          const r=bucket.models[model],bar=node('i','bar-segment'),height=r.total/ceiling*227;
          bar.dataset.model=model;bar.setAttribute('aria-hidden','true');bar.style.setProperty('--model-color',color(model));bar.style.height=height+'px';
          if(j&&height>=3)bar.style.boxShadow='inset 0 -1px 0 color-mix(in srgb,var(--pulse-background) 48%,transparent)';
          stack.append(bar);
        }
        if(!bucket.total)stack.append(node('i','empty-bar'));
        button.append(stack);
        if(i%3===0||i===buckets.length-1)button.append(node('span','x-label',String(i+1)));
        bindBucket(button,bucket);
        plot.append(button);
      }
      if(!buckets.some(b=>b.total))plot.append(node('div','chart-empty',w('所选月份暂无用量记录','No usage recorded in this month')));
    }else{
      // Model Statistics Mode: X-Axis represents different models!
      $('trend-range').style.display='none';
      $('legend').style.display='none';
      text('trend-title',selectedDate?(`${w('Token 使用趋势 · 模型统计','Token Usage Trend · Model Statistics')} (${selectedDate})`):w('Token 使用趋势 · 模型统计','Token Usage Trend · Model Statistics'));
      
      let targetDays=[];
      if(selectedDate){
        targetDays=(value.days||[]).filter(d=>d.date===selectedDate);
      }else{
        const start=month(anchor,0),end=add(month(anchor,1),-1);
        targetDays=(value.days||[]).filter(d=>d.date>=start&&d.date<=end);
      }
      
      const modelStats=new Map();
      for(const m of value.models)modelStats.set(m,{total:0,uncached:0,cacheRead:0,cacheWrite:0,output:0,requests:0});
      for(const day of targetDays){
        for(const [m,r]of Object.entries(day.models||{})){
          if(!modelStats.has(m))modelStats.set(m,{total:0,uncached:0,cacheRead:0,cacheWrite:0,output:0,requests:0});
          const st=modelStats.get(m);
          st.total+=r.total||0;st.uncached+=r.uncached||0;st.cacheRead+=r.cacheRead||0;st.cacheWrite+=r.cacheWrite||0;st.output+=r.output||0;st.requests+=r.requests||0;
        }
      }
      
      // Always show all models in fixed order on X-axis (never jump or disappear on date click)
      const allModels=value.models.map(m=>[m,modelStats.get(m)||{total:0,uncached:0,cacheRead:0,cacheWrite:0,output:0,requests:0}]);
      const max=Math.max(1,...allModels.map(([,st])=>st.total)),ceiling=max>1?Math.ceil(max/(10**Math.floor(Math.log10(max))))*10**Math.floor(Math.log10(max)):1;
      for(let i=0;i<=4;i++){
        const label=node('span','',compact(ceiling*i/4));label.style.bottom=(19+(246-19)*i/4)+'px';axis.append(label);
        const line=node('i','grid-line');line.style.bottom=(19+(246-19)*i/4)+'px';plot.append(line);
      }
      
      for(const [i,[model,st]]of allModels.entries()){
        const button=node('button','bar-column');button.type='button';
        const stack=node('div','stack');
        stack.style.animationDelay=(i*20)+'ms';
        stack.style.width='24px';stack.style.maxWidth='28px';
        
        // Single solid bar matching 日走势 style using color(model) - no green, no split bars
        if(st.total>0){
          const bar=node('i','bar-segment'),h=st.total/ceiling*227;
          bar.dataset.model=model;bar.setAttribute('aria-hidden','true');
          bar.style.setProperty('--model-color',color(model));
          bar.style.height=h+'px';
          stack.append(bar);
        }else{
          stack.append(node('i','empty-bar'));
        }
        button.append(stack);
        button.append(node('span','x-label',modelName(model)));
        
        const singleBucket={
          from:selectedDate||anchor.slice(0,7),to:selectedDate||anchor.slice(0,7),
          modelTitle:modelName(model),total:st.total,uncached:st.uncached,cacheRead:st.cacheRead,output:st.output,requests:st.requests,isSingleModel:true
        };
        button.addEventListener('pointerenter',e=>tooltip(singleBucket,button,null,e));
        button.addEventListener('pointerleave',()=>{$('tip').hidden=true;tipTarget=null;});
        button.addEventListener('pointermove',e=>tooltip(singleBucket,button,null,e));
        plot.append(button);
      }
    }
  }

  /* Render Section 3: 6-Grid Stats in Token 消费统计 */
  function renderStats6Grid(){
    if(!value)return;
    let totalUncached=0,totalOutput=0,totalCache=0;
    for(const d of value.days||[]){
      for(const r of Object.values(d.models||{})){
        totalUncached+=r.uncached||0;
        totalOutput+=r.output||0;
        totalCache+=r.cacheRead||0;
      }
    }
    text('stat-total',full(value.totalTokens||0));
    text('stat-input',full(totalUncached));
    text('stat-output',full(totalOutput));
    text('stat-cache',compact(totalCache));
    text('stat-cache-sub',`${full(totalCache)} ${w('Tokens 命中','Tokens hit')}`);
    text('stat-turns',`${full(value.requests||0)} ${w('轮','turns')}`);
    text('stat-today',compact(value.todayTokens||0));
    text('stat-today-sub',`${full(value.todayTokens||0)} ${w('Tokens 当日消耗','Tokens today')}`);
  }

  /* Render Section 4: Daily Audit Table with 10-day Pagination */
  function renderAuditTable(){
    if(!value)return;
    const allDays=(value.days||[])
      .map(d=>{
        const models=Object.values(d.models||{});
        const total=models.reduce((s,m)=>s+(m.total||0),0);
        const uncached=models.reduce((s,m)=>s+(m.uncached||0),0);
        const output=models.reduce((s,m)=>s+(m.output||0),0);
        const cacheRead=models.reduce((s,m)=>s+(m.cacheRead||0),0);
        const turns=models.reduce((s,m)=>s+(m.requests||0),0);
        return {date:d.date,total,uncached,output,cacheRead,turns};
      })
      .filter(d=>d.total>0||d.turns>0)
      .sort((a,b)=>b.date.localeCompare(a.date)); // Newest date first

    text('audit-count',w(`共 ${allDays.length} 天记录`,`${allDays.length} days recorded`));
    const totalPages=Math.max(1,Math.ceil(allDays.length/auditPageSize));
    if(auditPage>totalPages)auditPage=totalPages;
    if(auditPage<1)auditPage=1;
    
    text('pagination-info',w(`第 ${auditPage} / ${totalPages} 页`,`Page ${auditPage} of ${totalPages}`));
    $('page-prev').disabled=auditPage<=1;
    $('page-next').disabled=auditPage>=totalPages;
    
    // Page numbers buttons
    const numWrap=$('page-numbers');numWrap.replaceChildren();
    const startP=Math.max(1,auditPage-2),endP=Math.min(totalPages,startP+4);
    for(let p=startP;p<=endP;p++){
      const btn=node('button','page-num'+(p===auditPage?' active':''),String(p));
      btn.type='button';
      btn.addEventListener('click',()=>{auditPage=p;renderAuditTable();});
      numWrap.append(btn);
    }
    
    // Render current 10-day slice
    const pageRows=allDays.slice((auditPage-1)*auditPageSize,auditPage*auditPageSize);
    const tbody=$('audit-table-body');tbody.replaceChildren();
    for(const r of pageRows){
      const tr=node('tr','');
      const dateTd=node('td','',r.date);
      if(value.today&&r.date===value.today){
        const tag=node('span','today-tag',w('今天','Today'));
        dateTd.append(tag);
      }
      const totalTd=node('td','col-total',full(r.total));
      tr.append(
        dateTd,
        node('td','',full(r.turns)+w(' 轮',' turns')),
        node('td','',full(r.uncached)),
        node('td','',full(r.output)),
        node('td','',full(r.cacheRead)),
        totalTd
      );
      tbody.append(tr);
    }
  }

  $('page-prev').addEventListener('click',()=>{if(auditPage>1){auditPage--;renderAuditTable();}});
  $('page-next').addEventListener('click',()=>{auditPage++;renderAuditTable();});

  function renderProfile(){
    const p=value?.profile||{name:'Antigravity User',email:'',avatar:'',initial:'A'};
    text('profile-name',p.name||'Antigravity User');
    const handleEl=$('profile-handle');
    const handle=p.email&&p.email.includes('@')?`@${p.email.split('@')[0]}`:`@${(p.name||'user').toLowerCase().replace(/\s+/g,'')}`;
    text('profile-handle',handle);
    handleEl.title=p.email||p.name||'Local User';
    
    const avatarImg=$('profile-avatar'),fallback=$('profile-fallback');
    if(p.avatar){
      avatarImg.src=p.avatar;avatarImg.style.display='block';fallback.style.display='none';
      avatarImg.onerror=()=>{avatarImg.style.display='none';fallback.style.display='flex';};
    }else{
      avatarImg.style.display='none';fallback.style.display='flex';
      fallback.textContent=p.initial||'A';
    }
  }

  function renderCodexBar(){
    if(!value)return;
    text('codex-today',compact(value.todayTokens??0));
    text('codex-week',compact(value.weekTokens??0));
    text('codex-month',compact(value.monthTokens??0));
    text('codex-total',compact(value.totalTokens??0));
    text('codex-today-label',w('今日用量','Today'));
    text('codex-week-label',w('本周用量','This Week'));
    text('codex-month-label',w('本月用量','This Month'));
    text('codex-total-label',w('累计用量','Total'));
  }

  function render(){
    if(!value){
      closeYear(false);$('tip').hidden=true;$('usage-waiting').hidden=false;
      text('usage-waiting',w('正在重新连接统计…','Reconnecting usage…'));
      text('coverage','');text('timezone','');$('alert').hidden=true;
      return;
    }
    $('usage-waiting').hidden=true;
    syncPalette();
    renderProfile();
    renderCodexBar();
    dialog.setAttribute('aria-label',w('用量统计','Token usage'));
    text('subtitle',w(`本机 ${hostLabel} · 当前账号`,`Local ${hostLabel} · current account`));
    text('activity-title',w('Token 活动','Token activity'));
    text('locale-label',zh()?'EN':'中');
    for(const [id,lbl]of [['locale',w('切换到英文','Switch to Chinese')],['refresh',w('刷新用量','Refresh usage')],['close',w('关闭','Close')]]){$(id).setAttribute('aria-label',lbl);$(id).title=lbl;}
    text('less',w('少','Less'));text('more',w('多','More'));
    for(const b of view.querySelectorAll('[data-heat]')){
      if(b.dataset.heat==='day')b.textContent=w('每日','Daily');
      else if(b.dataset.heat==='week')b.textContent=w('每周','Weekly');
      else b.textContent=w('累计','Total');
    }
    for(const b of view.querySelectorAll('[data-trend]')){
      if(b.dataset.trend==='daily')b.textContent=w('日走势','Daily');
      else b.textContent=w('模型统计','Models');
    }
    
    // Switch between Daily Heatmap, Weekly Bar Chart, and Cumulative Total Chart
    $('heat-view').hidden=heatMode!=='day';
    $('week-view').hidden=heatMode!=='week';
    $('total-view').hidden=heatMode!=='total';
    for(const b of view.querySelectorAll('[data-heat]'))b.classList.toggle('active',b.dataset.heat===heatMode);

    const years=[];const first=Number(value.firstDate?.slice(0,4)||value.today.slice(0,4)),currentYear=Number(value.today.slice(0,4)),minimum=Math.max(first,currentYear-10);
    for(let y=currentYear;y>=minimum;y--)years.push(y);
    if($('year').dataset.years!==years.join(',')){
      $('year-menu').replaceChildren(...years.map(y=>{const option=node('button','year-option');option.type='button';option.dataset.year=String(y);option.setAttribute('role','option');option.tabIndex=-1;
        setMarkup(option,'<span></span><svg class="year-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>');option.firstElementChild.textContent=String(y);
        option.addEventListener('click',()=>{year=String(y);syncYear();closeYear();renderActivityMode();});return option;}));$('year').dataset.years=years.join(',');
    }
    syncYear();
    buildQuarterMenu();
    syncQuarter();
    text('coverage',w(`已记录 ${full(value.requests)} 次请求${value.firstDate?' · 始于 '+value.firstDate:''}`,`${full(value.requests)} requests recorded${value.firstDate?' · since '+value.firstDate:''}`));
    text('timezone',value.timeZone+' · '+(value.syncing||value.retryingConversations>0?w('正在同步历史…','Syncing history…'):w('本地统计','Local usage')));
    const alerts=[];if(value.unknownRequests)alerts.push(w(`${value.unknownRequests} 次请求日期未知，共 ${compact(value.unknownTokens)} Token`,`${value.unknownRequests} undated requests · ${compact(value.unknownTokens)} tokens`));
    const confirmedMissing=value.confirmedMissingConversations??(value.syncing?0:value.missingConversations);
    if(value.partialRequests||value.unreadableFiles||confirmedMissing>0&&!value.syncing||value.persistenceError)alerts.push(w('部分记录暂不可读取，用量可能不完整','Some records are unavailable; usage may be incomplete'));
    $('alert').hidden=!alerts.length;text('alert',alerts.join(' · '));
    
    renderActivityMode();
    renderTrendSection();
    renderStats6Grid();
    renderAuditTable();
  }

  function renderActivityMode(){
    if(heatMode==='day')renderHeat();
    else if(heatMode==='week')renderWeeklyActivity();
    else renderTotalChart();
  }

  for(const b of view.querySelectorAll('[data-heat]'))b.addEventListener('click',()=>{
    heatMode=b.dataset.heat;
    $('heat-view').hidden=heatMode!=='day';
    $('week-view').hidden=heatMode!=='week';
    $('total-view').hidden=heatMode!=='total';
    for(const btn of view.querySelectorAll('[data-heat]'))btn.classList.toggle('active',btn.dataset.heat===heatMode);
    renderActivityMode();
  });

  for(const b of view.querySelectorAll('[data-trend]'))b.addEventListener('click',()=>{
    trendMode=b.dataset.trend;
    selectedDate=null;
    for(const btn of view.querySelectorAll('[data-trend]'))btn.classList.toggle('active',btn.dataset.trend===trendMode);
    renderTrendSection();
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
    $('tip').hidden=true;closeQuarter(false);$('year-menu').showPopover();$('year').setAttribute('aria-expanded','true');positionYear();
    ($('year-menu').querySelector('[aria-selected=true]')||$('year-menu').firstElementChild)?.focus({preventScroll:true});
  }
  $('year').addEventListener('click',()=>{$('year-menu').matches(':popover-open')?closeYear():openYear();});
  $('year').addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();openYear();if(event.key==='Home')$('year-menu').firstElementChild?.focus();if(event.key==='End')$('year-menu').lastElementChild?.focus();}});
  $('year-menu').addEventListener('keydown',event=>{
    const options=[...$('year-menu').children],current=options.indexOf(view.activeElement);let next=null;
    if(event.key==='ArrowDown')next=Math.min(options.length-1,current+1);else if(event.key==='ArrowUp')next=Math.max(0,current-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=options.length-1;
    if(next!==null){event.preventDefault();options[next]?.focus({preventScroll:true});}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeYear();}else if(event.key==='Tab')closeYear();
  });

  function syncQuarter(){
    const q=getQuarterRange(year,quarter);
    text('quarter-label',q.label);$('quarter').setAttribute('aria-label',w('选择季度','Select quarter')+' · '+q.label);$('quarter-menu').setAttribute('aria-label',w('季度','Quarter'));
    for(const option of $('quarter-menu').children)option.setAttribute('aria-selected',String(option.dataset.quarter===String(quarter)));
  }
  function closeQuarter(restore=true){if(!$('quarter-menu').matches(':popover-open'))return;$('quarter-menu').hidePopover();$('quarter').setAttribute('aria-expanded','false');if(restore)$('quarter').focus({preventScroll:true});}
  function positionQuarter(){
    if(!$('quarter-menu').matches(':popover-open'))return;const menu=$('quarter-menu'),r=$('quarter').getBoundingClientRect(),bounds=dialog.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;
    menu.style.left=Math.max(bounds.left+12,Math.min(r.right-width,bounds.right-width-12))+'px';const below=r.bottom+7;
    menu.style.top=(below+height<=bounds.bottom-12?below:Math.max(bounds.top+12,r.top-height-7))+'px';
  }
  function openQuarter(){
    $('tip').hidden=true;closeYear(false);$('quarter-menu').showPopover();$('quarter').setAttribute('aria-expanded','true');positionQuarter();
    ($('quarter-menu').querySelector('[aria-selected=true]')||$('quarter-menu').firstElementChild)?.focus({preventScroll:true});
  }
  function buildQuarterMenu(){
    $('quarter-menu').replaceChildren();
    const quarters=[
      {q:1,label:zh()?'1-3月':'Jan-Mar'},
      {q:2,label:zh()?'4-6月':'Apr-Jun'},
      {q:3,label:zh()?'7-9月':'Jul-Sep'},
      {q:4,label:zh()?'10-12月':'Oct-Dec'}
    ];
    for(const item of quarters){
      const option=node('button','year-option');option.type='button';option.dataset.quarter=String(item.q);option.setAttribute('role','option');option.tabIndex=-1;
      setMarkup(option,'<span></span><svg class="year-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>');
      option.firstElementChild.textContent=item.label;
      option.addEventListener('click',()=>{quarter=item.q;syncQuarter();closeQuarter();renderActivityMode();});
      $('quarter-menu').append(option);
    }
  }
  $('quarter').addEventListener('click',()=>{$('quarter-menu').matches(':popover-open')?closeQuarter():openQuarter();});
  $('quarter').addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();openQuarter();if(event.key==='Home')$('quarter-menu').firstElementChild?.focus();if(event.key==='End')$('quarter-menu').lastElementChild?.focus();}});
  $('quarter-menu').addEventListener('keydown',event=>{
    const options=[...$('quarter-menu').children],current=options.indexOf(view.activeElement);let next=null;
    if(event.key==='ArrowDown')next=Math.min(options.length-1,current+1);else if(event.key==='ArrowUp')next=Math.max(0,current-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=options.length-1;
    if(next!==null){event.preventDefault();options[next]?.focus({preventScroll:true});}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeQuarter();}else if(event.key==='Tab')closeQuarter();
  });

  view.addEventListener('pointerdown',event=>{
    const path=event.composedPath();
    if(!path.includes($('year'))&&!path.includes($('year-menu')))closeYear(false);
    if(!path.includes($('quarter'))&&!path.includes($('quarter-menu')))closeQuarter(false);
  });
  page.addEventListener('scroll',closePickersOnScroll,{passive:true});function closePickersOnScroll(){closeYear(false);closeQuarter(false);}
  window.addEventListener('resize',()=>{positionYear();positionQuarter();});

  for(const [id,step]of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{anchor=month(anchor,step);renderTrendSection();});
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
  function close(){closeYear(false);closeQuarter(false);conceal();$('tip').hidden=true;opener?.focus({preventScroll:true});}
  $('close').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  const contentKey=data=>JSON.stringify([{...data,updatedAt:undefined},language.language,themeSignature()]);
  const within=event=>event.composedPath().includes(dialog);
  function containFocus(event){if(!disposed&&dialog.open&&!within(event)){$('locale').focus({preventScroll:true});}}
  function containKeys(event){
    if(disposed||!dialog.open)return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();
      if($('year-menu').matches(':popover-open'))closeYear();
      else if($('quarter-menu').matches(':popover-open'))closeQuarter();
      else close();return;
    }
    if(event.key!=='Tab')return;
    if($('year-menu').matches(':popover-open'))closeYear(false);
    if($('quarter-menu').matches(':popover-open'))closeQuarter(false);
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
    open(data,trigger){if(!data||disposed)return;accountKey=data.accountKey;value=data;opener=trigger;year||=data.today.slice(0,4);quarter||=Math.ceil(parseInt(data.today.slice(5,7),10)/3);anchor||=data.today;lastKey=contentKey(data);render();present();},
    update(data){if(disposed)return;if(!data){if(!value)return;value=null;lastKey='';if(dialog.open)render();return;}if(accountKey&&accountKey!==data.accountKey){disabledModels.clear();year=data.today.slice(0,4);quarter=Math.ceil(parseInt(data.today.slice(5,7),10)/3);anchor=data.today;}accountKey=data.accountKey;value=data;if(!dialog.open)return;const key=contentKey(data);if(key===lastKey)return;lastKey=key;render();},
    restoreModal(){if(!disposed&&dialog.open&&dialog.isConnected&&!dialog.matches(':popover-open')){closeYear(false);closeQuarter(false);present();}},
    close,syncGuideDismissed(){},dispose(){disposed=true;themeObserver.disconnect();clearTimeout(refreshDelay);finishRefresh?.();refreshMotion?.cancel();closeYear(false);closeQuarter(false);window.removeEventListener('resize',positionYear);window.removeEventListener('resize',positionQuarter);document.removeEventListener('focusin',containFocus,true);document.removeEventListener('keydown',containKeys,true);document.removeEventListener('wheel',containScroll,true);document.removeEventListener('touchmove',containScroll,true);for(const type of ['pointerdown','mousedown','click'])document.removeEventListener(type,containPointer,true);conceal();dialog.remove();backdrop.remove();},get isOpen(){return dialog.open;}
  };
};
