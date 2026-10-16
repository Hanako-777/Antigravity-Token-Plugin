// Shared theme controller for the injected Shadow DOM and the SDK side panel.
module.exports = function createAgPulseTheme() {
  const palettes = {
    dark: {
      scheme: 'dark',
      page: '#0b0f19',
      background: '#0f172a',
      card: '#131b2e',
      'card-end': '#0b0f19',
      foreground: '#f8fafc',
      chip: '#94a3b8',
      muted: '#64748b',
      subtle: '#475569',
      label: '#94a3b8',
      hover: 'rgba(56, 189, 248, 0.12)',
      'hover-text': '#f8fafc',
      accent: '#38bdf8',
      emphasis: '#7dd3fc',
      border: 'rgba(255, 255, 255, 0.1)',
      separator: 'rgba(255, 255, 255, 0.08)',
      track: 'rgba(255, 255, 255, 0.08)',
      control: '#1e293b',
      'control-text': '#cbd5e1',
      menu: '#131b2e',
      selected: '#1e293b',
      ring: '#38bdf8',
      'ring-track': '#1e293b',
      dot: '#38bdf8',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171',
      shadow: 'rgba(0, 0, 0, 0.55)',
      'morandi-blue': '#8FBADD',
      'morandi-slate': '#54748B',
      'morandi-terracotta': '#C4837C'
    },
    light: {
      scheme: 'light',
      page: '#f8fafc',
      background: '#ffffff',
      card: '#ffffff',
      'card-end': '#f1f5f9',
      foreground: '#0f172a',
      chip: '#475569',
      muted: '#64748b',
      subtle: '#94a3b8',
      label: '#475569',
      hover: '#e2e8f0',
      'hover-text': '#0f172a',
      accent: '#0284c7',
      emphasis: '#0369a1',
      border: '#cbd5e1',
      separator: '#e2e8f0',
      track: '#e2e8f0',
      control: '#f1f5f9',
      'control-text': '#334155',
      menu: '#ffffff',
      selected: '#e2e8f0',
      ring: '#0284c7',
      'ring-track': '#e2e8f0',
      dot: '#0284c7',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      shadow: 'rgba(0, 0, 0, 0.08)',
      'morandi-blue': '#5b9bd5',
      'morandi-slate': '#41719c',
      'morandi-terracotta': '#b9770e'
    },
  };
  const declarations = theme => Object.entries(palettes[theme]).map(([key,value])=>`--pulse-${key}:${value}`).join(';');
  function css(selector) {
    return `${selector}{${declarations('dark')}}${selector}[data-pulse-theme="light"]{${declarations('light')}}@media(prefers-color-scheme:light){${selector}:not([data-pulse-theme]){${declarations('light')}}}`;
  }
  // Shadow selectors need the attribute inside :host(), unlike ordinary DOM.
  function shadowCss() {
    return `:host{${declarations('dark')}}:host([data-pulse-theme="light"]){${declarations('light')}}`;
  }
  function normalizeHostTheme(value) {
    const result={};
    if(!value||typeof value!=='object'||Array.isArray(value))return result;
    if(['dark','light','system'].includes(value.mode))result.mode=value.mode;
    for(const mode of ['dark','light']){
      for(const key of ['primary','background','foregroundOverride']){
        const color=value[mode]?.[key];
        if(typeof color!=='string'||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color))continue;
        (result[mode]||={})[key]=(color.length===4?'#'+Array.from(color.slice(1),v=>v+v).join(''):color).toLowerCase();
      }
    }
    return result;
  }
  const luminance=rgb=>rgb.map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const mix=(a,b,amount)=>a.map((value,i)=>Math.round(value+(b[i]-value)*amount));
  const colorCss=color=>'rgb('+color.join(' ')+')';
  function attach(target, { embedded = false } = {}) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=1;
    const context = canvas.getContext('2d', { willReadFrequently:true });
    let stopped=false,hostTheme={};
    function rgb(color) {
      if (!color || !context || !CSS.supports('color',color)) return null;
      context.clearRect(0,0,1,1); context.fillStyle='transparent';context.fillStyle=color; context.fillRect(0,0,1,1);
      const [r,g,b,a]=context.getImageData(0,0,1,1).data;
      if (a<250) return null; // Transparent surfaces do not define a theme.
      return [r,g,b];
    }
    function fromColor(color) {
      const values=rgb(color);return values ? .2126*values[0]+.7152*values[1]+.0722*values[2]>=145?'light':'dark' : null;
    }
    function explicit(element) {
      if (!element) return null;
      for (const key of ['data-theme','data-color-mode','data-theme-mode','data-vscode-theme-kind']) {
        const value=element.getAttribute(key)?.toLowerCase();
        if (/^(light|light-theme|vs|vscode-light|hc-light)$/.test(value)) return 'light';
        if (/^(dark|dark-theme|vs-dark|vscode-dark|hc-black|hc-dark)$/.test(value)) return 'dark';
      }
      const classes=element.classList;
      const light=['light','light-theme','theme-light','vscode-light','vs'].some(value=>classes.contains(value));
      const dark=['dark','dark-theme','theme-dark','vscode-dark','vs-dark','hc-black'].some(value=>classes.contains(value));
      return light===dark ? null : light ? 'light' : 'dark';
    }
    function resolve() {
      const root=document.documentElement;
      // App settings override the OS, including when the app uses a fixed theme.
      const declared=explicit(document.body)||explicit(root);
      if (declared) return declared;
      // The sidecar SDK pushes --background on theme-change messages.
      const sdk=fromColor(getComputedStyle(root).getPropertyValue('--background').trim());
      if (sdk) return sdk;
      if (embedded) {
        for (let element=target.parentElement;element;element=element.parentElement) {
          const theme=explicit(element)||fromColor(getComputedStyle(element).backgroundColor);
          if (theme) return theme;
        }
        const scheme=getComputedStyle(root).colorScheme;
        if (scheme==='light'||scheme==='dark') return scheme;
      }
      if(hostTheme.mode==='light'||hostTheme.mode==='dark')return hostTheme.mode;
      return media.matches ? 'dark' : 'light';
    }
    function hostColor(tokens) {
      // The renderer's active primary wins over saved seeds: a user may have
      // switched back to a preset while retaining custom-theme settings.
      const elements=embedded?[target.parentElement,document.body,document.documentElement]:[document.documentElement,document.body];
      for(const element of elements.filter(Boolean)){
        const style=getComputedStyle(element);
        for(const token of tokens){
          const value=style.getPropertyValue(token).trim();
          if(!value)continue;
          const color=rgb(value)||rgb(`hsl(${value})`);
          if(color)return color;
        }
      }
      return null;
    }
    function readableColor(color,surfaces) {
      const readable=values=>surfaces.every(surface=>contrast(values,surface)>=4.5);
      if(readable(color))return colorCss(color);
      // Keep the selected hue while ensuring small accent text stays legible.
      const ends=[[255,255,255],[0,0,0]];
      const score=values=>Math.min(...surfaces.map(surface=>contrast(values,surface)));
      const end=score(ends[0])>=score(ends[1])?ends[0]:ends[1];
      for(let step=1;step<=100;step++){
        const mixed=mix(color,end,step/100);
        if(readable(mixed))return colorCss(mixed);
      }
      return colorCss(end);
    }
    function surfaceColors(theme) {
      let background=hostColor(['--background','--color-background'])||rgb(hostTheme[theme]?.background);
      if(!background&&embedded){
        for(let element=target.parentElement;element;element=element.parentElement){
          background=rgb(getComputedStyle(element).backgroundColor);if(background)break;
        }
      }
      if(!background)return {};
      // Use actual host card surfaces (including color-mix/OKLCH) where available.
      // If only a seed exists, derive a subtle raised surface in the same hue.
      const dark=luminance(background)<.35,end=dark?[255,255,255]:[0,0,0];
      let card=hostColor(['--popover','--card','--color-card'])||mix(background,end,dark?.05:.015);
      // Wildly incompatible host tokens must not make shared text unreadable.
      const commonContrast=bg=>Math.max(...[[255,255,255],[0,0,0]].map(fg=>Math.min(contrast(fg,background),contrast(fg,bg))));
      if(commonContrast(card)<4.5)card=mix(background,end,dark?.05:.015);
      const hover=mix(card,end,.06),control=mix(card,end,.08),selected=mix(card,end,.12);
      const surfaces=[background,card,hover,control,selected];
      const foreground=hostColor(['--foreground','--color-foreground'])||rgb(hostTheme[theme]?.foregroundOverride)||rgb(palettes[dark?'dark':'light'].foreground);
      const text=rgb(readableColor(foreground,surfaces));
      const values={page:background,background,card,'card-end':card,menu:card,hover,control,selected,
        foreground:text,chip:mix(card,text,.8),muted:mix(card,text,.75),subtle:mix(card,text,.7),label:mix(card,text,.8),
        'hover-text':text,'control-text':mix(card,text,.85),border:mix(card,text,.24),separator:mix(card,text,.14),track:mix(card,text,.14),
        'ring-track':mix(card,text,.24),dot:mix(card,text,.6)};
      for(const key of ['chip','muted','subtle','label','control-text'])values[key]=rgb(readableColor(values[key],surfaces));
      return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,colorCss(value)]));
    }
    function update() {
      if (stopped) return;
      const theme=resolve();
      if (target.dataset.pulseTheme!==theme) target.dataset.pulseTheme=theme;
      const values=surfaceColors(theme);
      const surfaces=[values.card||palettes[theme].card,values.background||palettes[theme].background,values.control||palettes[theme].control].map(rgb);
      const primary=hostColor(['--primary','--color-primary'])||rgb(hostTheme[theme]?.primary);
      if(primary){values.accent=colorCss(primary);values.ring=colorCss(primary);}
      if(primary||values.card)values.emphasis=readableColor(primary||rgb(palettes[theme].emphasis),surfaces);
      // Severity text must also remain readable on custom surfaces.
      if(values.card)for(const key of ['success','warning','danger'])values[key]=readableColor(rgb(palettes[theme][key]),surfaces);
      for(const key of Object.keys(palettes[theme])){
        const property='--pulse-'+key,value=values[key];
        if(value){if(target.style.getPropertyValue(property)!==value)target.style.setProperty(property,value);}
        else if(target.style.getPropertyValue(property))target.style.removeProperty(property);
      }
      return theme;
    }
    const observer=new MutationObserver(update);
    const attributes=['class','style','data-theme','data-color-mode','data-theme-mode','data-vscode-theme-kind'];
    const elements=new Set([document.documentElement,document.body]);
    if (embedded) for(let element=target.parentElement;element;element=element.parentElement) elements.add(element);
    for(const element of elements) if(element) observer.observe(element,{attributes:true,attributeFilter:attributes});
    if(document.head) observer.observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:['href','media','disabled']});
    media.addEventListener('change',update);
    // Catch stylesheet replacement and reparented composers without observing chat text.
    const timer=setInterval(update,1500);
    update();
    return { update, setHostTheme(value) { hostTheme=normalizeHostTheme(value);return update(); }, dispose() { stopped=true;observer.disconnect();media.removeEventListener('change',update);clearInterval(timer); } };
  }
  return { css, shadowCss, attach, normalizeHostTheme };
};
