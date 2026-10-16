// Shared local usage views. Values and model labels are inserted as text.
module.exports = function createUsageDashboard({root,language,setMarkup,hostLabel='Antigravity',guideDismissed=true,onDismissGuide,onLanguage,onRefresh}) {
  const dialog=document.createElement('dialog');dialog.id='usage-dashboard';dialog.setAttribute('popover','manual');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',language.language==='zh-CN'?'用量统计':'Token usage');
  dialog.style.cssText='width:min(1080px,calc(100vw - 40px));max-width:none;height:min(880px,calc(100dvh - 40px));max-height:none;box-sizing:border-box;overflow:hidden;visibility:visible;pointer-events:auto;padding:0;border:1px solid var(--pulse-border);border-radius:18px;background:var(--pulse-background);color:var(--pulse-foreground);box-shadow:0 24px 100px #0006';
  const shell=document.createElement('div'),view=shell.attachShadow({mode:'open'});shell.style.height='100%';dialog.append(shell);root.append(dialog);
  const backdrop=document.createElement('style');backdrop.textContent='#usage-dashboard{position:fixed;inset:0;margin:auto}#usage-dashboard::backdrop{background:#0006;backdrop-filter:blur(3px);pointer-events:auto}';root.append(backdrop);
  const css=document.createElement('style');css.textContent=`
    :host{display:block;height:100%;color:var(--pulse-foreground);font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;font-variant-numeric:tabular-nums}
    *{box-sizing:border-box}button,select{font:inherit;color:inherit}button{cursor:pointer}button,select{border:1px solid var(--pulse-border);background:transparent;border-radius:7px}button{transition:background 140ms ease,transform 120ms cubic-bezier(.23,1,.32,1)}button:active{transform:scale(.97)}button:focus-visible,select:focus-visible{outline:2px solid var(--pulse-accent);outline-offset:3px}button[disabled]{opacity:.35;cursor:default}
    .page{height:100%;max-height:none;overflow-y:auto;overflow-x:hidden;padding:22px 28px 28px;display:flex;flex-direction:column;gap:18px;background:var(--pulse-background);scrollbar-gutter:stable}
    
    /* Top Header Navbar */
    .top{display:flex;justify-content:space-between;align-items:center}
    .brand-group{display:flex;align-items:center;gap:10px}
    .brand-name{font-size:16px;font-weight:650;letter-spacing:-.3px;color:var(--pulse-foreground);line-height:1.2}
    .brand-sub{font-size:11px;color:var(--pulse-muted);display:flex;align-items:center;margin-top:2px}
    .live-dot{display:inline-block;width:5px;height:5px;background:var(--pulse-success);border-radius:50%;margin-right:6px}
    .actions{display:flex;gap:7px;align-items:center}
    .actions button{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;padding:0;line-height:1;border-radius:8px;color:var(--pulse-muted)}
    .actions button:hover{background:var(--pulse-hover);color:var(--pulse-foreground)}
    .actions svg{display:block;width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .locale-label{display:block;min-width:16px;height:16px;line-height:16px;text-align:center;font-size:11px}
    
    /* User Profile Hero (Centered at Top) */
    .profile-hero{display:flex;flex-direction:column;align-items:center;text-align:center;margin:4px 0 10px}
    .avatar-wrap{position:relative;width:66px;height:66px;margin-bottom:8px}
    .avatar-img{width:66px;height:66px;border-radius:50%;object-fit:cover;border:2px solid var(--pulse-border);box-shadow:0 4px 14px rgba(0,0,0,0.12);display:block}
    .avatar-fallback{width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,var(--pulse-accent),#ec4899);color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:600;border:2px solid var(--pulse-border)}
    .profile-name{font-size:18px;font-weight:650;color:var(--pulse-foreground);line-height:1.25;letter-spacing:-.2px}
    .profile-email{font-size:12px;color:var(--pulse-muted);margin-top:2px}
    
    /* Codex 5-Metrics Hero Bar */
    .codex-bar{background:var(--pulse-card);border:1px solid var(--pulse-border);border-radius:12px;padding:12px 14px;display:grid;grid-template-columns:1fr 1fr 1.25fr 0.9fr 1fr;box-shadow:0 4px 16px var(--pulse-shadow);margin-bottom:2px}
    .codex-col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:2px 6px;min-width:0}
    .codex-col:not(:last-child){border-right:1px solid var(--pulse-separator)}
    .codex-num{font-size:17px;font-weight:600;letter-spacing:-.3px;color:var(--pulse-foreground);font-variant-numeric:tabular-nums;white-space:nowrap}
    .codex-label{font-size:10.5px;color:var(--pulse-muted);margin-top:3px;white-space:nowrap}
    .codex-sub{font-size:9.5px;opacity:0.75;margin-left:3px}
    
    /* Card Container Wrapper */
    .card-container{background:var(--pulse-card);border:1px solid var(--pulse-border);border-radius:14px;padding:18px 20px 20px;box-shadow:0 4px 18px var(--pulse-shadow)}
    
    /* Section Headers */
    .section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    .section-title{font-size:14px;font-weight:600;display:flex;align-items:center;gap:7px;color:var(--pulse-foreground)}
    .section-title svg{width:16px;height:16px;fill:none;stroke:var(--pulse-accent);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
    .chart-controls{display:flex;gap:10px;align-items:center}
    
    /* HUD Pill Segmented Controls */
    .seg-control{display:inline-flex;align-items:center;background:var(--pulse-hover);padding:3px;border-radius:8px;gap:2px}
    .seg-btn{padding:4px 12px;border-radius:6px;border:none;background:transparent;font-size:11.5px;color:var(--pulse-muted);cursor:pointer;transition:all 0.18s ease}
    .seg-btn:hover{color:var(--pulse-foreground)}
    .seg-btn.active,.seg-btn[aria-pressed=true]{background:var(--pulse-control);color:var(--pulse-foreground);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.12)}
    
    /* Year Picker */
    .year-picker{position:relative;flex:none}
    .year-trigger{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:76px;height:28px;padding:0 9px;background:var(--pulse-control);color:var(--pulse-foreground);font-size:11px;border-radius:7px}
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
    
    /* Heatmap Grid with Diagonal Ripple Transition */
    .heat-wrap{overflow-x:auto;padding:2px 2px 6px}
    .calendar{min-width:680px}
    .months{display:grid;margin-left:31px;font-size:10px;color:var(--pulse-muted);margin-bottom:7px}
    .months span{white-space:nowrap}
    .heat-row{display:flex;gap:9px}
    .weekdays{display:grid;grid-template-rows:repeat(7,1fr);width:22px;flex:none;font-size:9px;color:var(--pulse-muted)}
    .heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px;width:100%}
    .heat button{border:0;border-radius:3px;padding:0;min-width:0;aspect-ratio:1;background:var(--pulse-hover);outline-offset:1px;cursor:pointer;transition:transform 0.1s ease;animation:cellPop 0.32s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes cellPop{0%{transform:scale(0.15);opacity:0}100%{transform:scale(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.heat button{animation:none}}
    .heat button:hover{transform:scale(1.22);z-index:2}
    .heat button[data-level="1"],.swatch[data-level="1"]{background:color-mix(in srgb,var(--pulse-accent) 22%,var(--pulse-hover))}
    .heat button[data-level="2"],.swatch[data-level="2"]{background:color-mix(in srgb,var(--pulse-accent) 45%,var(--pulse-hover))}
    .heat button[data-level="3"],.swatch[data-level="3"]{background:color-mix(in srgb,var(--pulse-accent) 68%,var(--pulse-hover))}
    .heat button[data-level="4"],.swatch[data-level="4"]{background:var(--pulse-accent)}
    .heat button.future{opacity:.22;cursor:default}
    .heat-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:10px 0 2px;font-size:10px;color:var(--pulse-muted)}
    .scale{display:flex;align-items:center;gap:4px}
    .swatch{width:11px;height:11px;border-radius:3px;background:var(--pulse-hover)}
    
    /* Bar Charts & Cumulative Line Chart */
    .chart-wrap{overflow-x:auto;padding-bottom:12px;padding-top:4px}
    .chart{height:246px;display:flex;gap:14px;min-width:650px}
    .chart.wide-scroll{min-width:1380px}
    .axis{width:42px;flex:none;position:relative;font-size:10px;color:var(--pulse-muted)}
    .axis span{position:absolute;right:0;transform:translateY(50%)}
    .plot{position:relative;flex:1;display:flex;align-items:stretch;gap:5px;padding:0 1px}
    .grid-line{position:absolute;left:0;right:0;border-top:1px solid var(--pulse-separator);pointer-events:none;opacity:.45}
    .grid-line:first-child{opacity:.85}
    .bar-column{position:relative;flex:1;min-width:26px;display:flex;align-items:flex-end;border:0;border-radius:4px;background:transparent;padding:0;margin-bottom:19px;cursor:pointer}
    .bar-column:hover{background:transparent}
    .bar-column:active{transform:none}
    
    /* Stacked Model Bars with Uniform Dimensions and Rise Animation */
    .stack{display:flex;flex-direction:column-reverse;width:20px;max-width:24px;margin-inline:auto;gap:0;border-radius:4px 4px 0 0;overflow:hidden;transform-origin:bottom;animation:barRise 0.38s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes barRise{from{transform:scaleY(0);opacity:0.2}to{transform:scaleY(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.stack{animation:none}}
    
    .bar-segment{width:100%;min-height:0;display:block;flex:none;pointer-events:auto;background:var(--model-color);transition:opacity 140ms ease}
    .plot[data-highlight] .bar-segment:not([data-highlight=true]){opacity:.22}
    .empty-bar{height:1px;width:100%;background:var(--pulse-track);opacity:.35}
    .x-label{position:absolute;top:calc(100% + 5px);left:50%;transform:translateX(-50%);font-size:10px;color:var(--pulse-muted);white-space:nowrap}
    .chart-empty{position:absolute;left:0;right:0;top:40%;text-align:center;color:var(--pulse-muted);font-size:12px;pointer-events:none}
    
    /* Cumulative Area Line Chart */
    .total-chart-svg{width:100%;height:100%;overflow:visible}
    .total-line-group{transform-origin:bottom;animation:areaRise 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards}
    @keyframes areaRise{from{transform:scaleY(0);opacity:0.2}to{transform:scaleY(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.total-line-group{animation:none}}
    
    .legend{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 16px}
    .legend button{display:flex;align-items:center;gap:7px;padding:4px 8px;border-radius:6px;font-size:11px;border:0;background:transparent;color:var(--pulse-muted)}
    .legend button:hover,.legend button[aria-pressed=true]{color:var(--pulse-foreground);background:var(--pulse-hover)}
    .legend button[aria-pressed=false]{opacity:.4;text-decoration:line-through}
    .dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none;background:var(--model-color)}
    
    .range{display:flex;align-items:center;gap:10px}
    .range button{height:26px;width:26px;border:0}
    .range strong{font-size:12px;font-weight:500;min-width:106px;text-align:center}
    .chart-summary{font-size:11px;color:var(--pulse-muted);margin-top:2px}
    .chart-summary strong{color:var(--pulse-foreground);font-weight:600}
    
    /* Table */
    .table-wrap{overflow:auto;margin-top:4px}
    .table{width:100%;border-collapse:collapse;text-align:right;font-size:11px;white-space:nowrap}
    .table th{font-weight:500;color:var(--pulse-muted);padding:8px 12px;border-bottom:1px solid var(--pulse-separator)}
    .table td{padding:11px 12px;border-bottom:1px solid var(--pulse-separator)}
    .table th:first-child,.table td:first-child{text-align:left;padding-left:0}
    .table td:first-child span{margin-right:7px}
    .table tr:last-child td{border-bottom:0}
    
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

    <!-- User Profile Hero (Centered) -->
    <div class="profile-hero">
      <div class="avatar-wrap">
        <img id="profile-avatar" class="avatar-img" src="" alt="Avatar" style="display:none;" />
        <div id="profile-fallback" class="avatar-fallback">A</div>
      </div>
      <div class="profile-name" id="profile-name">Antigravity User</div>
      <div class="profile-email" id="profile-email"></div>
    </div>

    <!-- Codex 5-Metrics Hero Bar (Today Tokens placed BEFORE Total Tokens) -->
    <section class="codex-bar">
      <div class="codex-col">
        <div class="codex-num" id="codex-today">—</div>
        <div class="codex-label" id="codex-today-label">今日实际消耗</div>
      </div>
      <div class="codex-col">
        <div class="codex-num" id="codex-total">—</div>
        <div class="codex-label" id="codex-total-label">累计 Token 数</div>
      </div>
      <div class="codex-col">
        <div class="codex-num" id="codex-peak">—</div>
        <div class="codex-label" id="codex-peak-label">单日使用峰值<span class="codex-sub" id="codex-peak-date"></span></div>
      </div>
      <div class="codex-col">
        <div class="codex-num" id="codex-days">—</div>
        <div class="codex-label" id="codex-days-label">活跃使用天数</div>
      </div>
      <div class="codex-col">
        <div class="codex-num" id="codex-requests">—</div>
        <div class="codex-label" id="codex-requests-label">累计交互轮次</div>
      </div>
    </section>

    <section id="usage-waiting" class="usage-waiting" role="status" hidden></section>

    <!-- Section 1: Token 活动 (Wrapped in Card Container with Icon) -->
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
          <div class="chart wide-scroll">
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

    <!-- Section 2: 按模型统计 (Wrapped in Card Container with Icon) -->
    <section class="card-container" id="section-details">
      <div class="section-header">
        <div>
          <div class="section-title">
            <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span id="detail-title">按模型统计</span>
          </div>
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
  let value=null,heatMode='day',period='day',year=null,anchor=null,disabledModels=new Set(),lastKey='',busy=false,opener=null;
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
    if(bucket.isCumulative){
      html+=`<div class="tip-total"><span>${zh()?'累计消耗:':'Cumulative:'}</span><span class="tip-num">${full(bucket.total)} Token</span></div>`;
      html+=`<div class="tip-row" style="color:var(--pulse-accent);font-weight:600;"><span>${zh()?'当日消耗:':'Day added:'}</span><span class="tip-num">+${compact(bucket.dayAdded||0)} Token</span></div>`;
      html+=`<div class="tip-turns"><span>${zh()?'累计交互:':'Total requests:'}</span><span class="tip-num">${full(bucket.requests)} ${zh()?'次':'requests'}</span></div>`;
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
    button.addEventListener('click',()=>{anchor=bucket.from;renderChart();});
  };

  /* Render 1: Daily Heatmap Grid (Diagonal Staggered Ripple Animation) */
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
    for(const [i,bucket]of buckets.entries()){
      const button=node('button','');button.type='button';
      const future=bucket.from>value.today||bucket.to<year+'-01-01'||bucket.from>year+'-12-31';
      button.dataset.level=bucket.total===0?'0':String(Math.min(4,Math.ceil(bucket.total/max*4)));
      if(future){button.className='future';button.disabled=true;}
      
      // Diagonal Ripple Delay: (col + row) * 8ms
      const col=Math.floor(i/7),row=i%7;
      button.style.animationDelay=((col+row)*8)+'ms';
      
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
    const annual=totals(year+'-01-01',year+'-12-31');
    text('heat-summary',w(`${year} 年 · ${full(annual.total)} Token`,`${year} · ${full(annual.total)} tokens`));
  }

  /* Render 2: Weekly Stacked Bar Chart (Uniform dimensions, wide-scroll plot) */
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
      if(i%2===0||i===buckets.length-1)button.append(node('span','x-label',bucket.from.slice(5)));
      bindBucket(button,bucket);
      $('week-plot').append(button);
    }
  }

  /* Render 3: Cumulative Total Tokens Line & Area Chart */
  function renderTotalChart(){
    if(!value)return;syncPalette();
    const yearStr=String(year);
    const yearDays=(value.days||[]).filter(d=>d.date.startsWith(yearStr));
    const plot=$('total-plot'),axis=$('total-axis');
    axis.replaceChildren();plot.replaceChildren();
    if(!yearDays.length){
      plot.append(node('div','chart-empty',w('该年份暂无用量记录','No usage recorded in this year')));
      return;
    }
    let cum=0;
    const points=yearDays.map(d=>{
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
    
    // Pointermove tracking on SVG
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

  /* Render Lower Model Breakdown Chart & Table */
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

  function renderProfile(){
    const p=value?.profile||{name:'Antigravity User',email:'',avatar:'',initial:'A'};
    text('profile-name',p.name||'Antigravity User');
    text('profile-email',p.email||'');
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
    text('codex-total',compact(value.totalTokens??0));
    let peakVal=0,peakDate='';
    for(const d of value.days||[]){
      const t=Object.values(d.models||{}).reduce((sum,m)=>sum+(m.total||0),0);
      if(t>peakVal){peakVal=t;peakDate=d.date;}
    }
    text('codex-peak',compact(peakVal));
    text('codex-peak-date',peakDate?` (${peakDate.slice(5)})`:'');
    const activeDays=(value.days||[]).filter(d=>Object.values(d.models||{}).reduce((s,m)=>s+(m.total||0),0)>0).length;
    text('codex-days',`${activeDays} ${w('天','days')}`);
    text('codex-requests',`${full(value.requests)} ${w('轮','turns')}`);
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
    text('detail-title',w('按模型统计','Usage by model'));
    text('locale-label',zh()?'EN':'中');
    for(const [id,lbl]of [['locale',w('切换到英文','Switch to Chinese')],['refresh',w('刷新用量','Refresh usage')],['close',w('关闭','Close')]]){$(id).setAttribute('aria-label',lbl);$(id).title=lbl;}
    text('less',w('少','Less'));text('more',w('多','More'));
    for(const b of view.querySelectorAll('[data-heat]')){
      if(b.dataset.heat==='day')b.textContent=w('每日','Daily');
      else if(b.dataset.heat==='week')b.textContent=w('每周','Weekly');
      else b.textContent=w('累计','Total');
    }
    for(const b of view.querySelectorAll('[data-period]'))b.textContent=({day:w('天','Day'),week:w('周','Week'),month:w('月','Month')})[b.dataset.period];
    
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
    text('coverage',w(`已记录 ${full(value.requests)} 次请求${value.firstDate?' · 始于 '+value.firstDate:''}`,`${full(value.requests)} requests recorded${value.firstDate?' · since '+value.firstDate:''}`));
    text('timezone',value.timeZone+' · '+(value.syncing||value.retryingConversations>0?w('正在同步历史…','Syncing history…'):w('本地统计','Local usage')));
    const alerts=[];if(value.unknownRequests)alerts.push(w(`${value.unknownRequests} 次请求日期未知，共 ${compact(value.unknownTokens)} Token`,`${value.unknownRequests} undated requests · ${compact(value.unknownTokens)} tokens`));
    const confirmedMissing=value.confirmedMissingConversations??(value.syncing?0:value.missingConversations);
    if(value.partialRequests||value.unreadableFiles||confirmedMissing>0&&!value.syncing||value.persistenceError)alerts.push(w('部分记录暂不可读取，用量可能不完整','Some records are unavailable; usage may be incomplete'));
    $('alert').hidden=!alerts.length;text('alert',alerts.join(' · '));
    
    renderActivityMode();
    renderChart();
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
    update(data){if(disposed)return;if(!data){if(!value)return;value=null;lastKey='';if(dialog.open)render();return;}if(accountKey&&accountKey!==data.accountKey){disabledModels.clear();year=data.today.slice(0,4);anchor=data.today;}accountKey=data.accountKey;value=data;if(!dialog.open)return;const key=contentKey(data);if(key===lastKey)return;lastKey=key;render();},
    restoreModal(){if(!disposed&&dialog.open&&dialog.isConnected&&!dialog.matches(':popover-open')){closeYear(false);present();}},
    close,syncGuideDismissed(){},dispose(){disposed=true;themeObserver.disconnect();clearTimeout(refreshDelay);finishRefresh?.();refreshMotion?.cancel();closeYear(false);window.removeEventListener('resize',positionYear);document.removeEventListener('focusin',containFocus,true);document.removeEventListener('keydown',containKeys,true);document.removeEventListener('wheel',containScroll,true);document.removeEventListener('touchmove',containScroll,true);for(const type of ['pointerdown','mousedown','click'])document.removeEventListener(type,containPointer,true);conceal();dialog.remove();backdrop.remove();},get isOpen(){return dialog.open;}
  };
};
