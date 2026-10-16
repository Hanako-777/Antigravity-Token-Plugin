// The CLI contract is independent of desktop ModelUsageStats semantics.
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const tokens = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
export const states = ['idle', 'thinking', 'working', 'tool_use', 'initializing'];

// Empirical statusLine policy: Sonnet 4.6 / GPT-OSS 120B / Gemini 3.8 Flash High,
// cache writes zero. Do not reuse desktop or cumulative token semantics.
function cacheRate(model, version, input, read, write, state) {
  const unavailable = reason => ({ percentage: null, basis: null, reason });
  if ([input, read, write].includes(null)) return unavailable('missing-or-invalid-counts');
  // During generation/tool execution a zero read may be a transient reset,
  // not a completed model request. The contract exposes no request-ready flag.
  if (read === 0 && ['thinking', 'working', 'tool_use', 'initializing'].includes(state)) return unavailable('awaiting-stable-usage');
  const total = input + read + write;
  if (!Number.isSafeInteger(total)) return unavailable('unsafe-total');
  if (total === 0) return unavailable('empty-input');
  if (read === 0) return { percentage: 0, basis: 'zero-read', reason: null };
  if (write !== 0) return unavailable('unverified-cache-write');
  if (!['1.3.2', '1.3.3'].includes(version)) return unavailable('unverified-cli-version');
  // A supplied ID is authoritative. A conflicting display name cannot opt in.
  const identity = typeof model.id === 'string' && model.id.trim() ? model.id.trim() : model.display_name;
  const sonnet = typeof identity === 'string' && /^claude(?:-| )sonnet(?:-| )4(?:-|\.)6(?: \(thinking\))?$/i.test(identity);
  const gpt = typeof identity === 'string' && /^gpt-oss(?:-| )120b(?:-medium| \(medium\))?$/i.test(identity);
  const gemini = typeof identity === 'string' && /^(?:gemini-3\.8-flash-high|gemini 3\.8 flash \(high\))$/i.test(identity);
  const supported = sonnet || gpt || (gemini && version === '1.3.3');
  if (!supported) return unavailable('unverified-model');
  return { percentage: read / total * 100, basis: `separate-input-cli-${version}`, reason: null };
}

export function cleanText(value, limit = 120) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\|$)/g, '')
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function normalize(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid status payload');
  const context = object(payload.context_window), usage = object(context.current_usage);
  const model = object(payload.model);
  const input = tokens(usage.input_tokens), read = tokens(usage.cache_read_input_tokens);
  const write = tokens(usage.cache_creation_input_tokens);
  const used = number(context.used_percentage), remaining = number(context.remaining_percentage);
  const quotas = Object.entries(object(payload.quota)).slice(0, 16).map(([key, raw]) => {
    const value = object(raw), fraction = number(value.remaining_fraction);
    const reset = typeof value.reset_time === 'string' ? Date.parse(value.reset_time) : NaN;
    return {
      id: cleanText(key, 64), remaining: fraction !== null && fraction <= 1 ? fraction * 100 : null,
      resetInSeconds: number(value.reset_in_seconds), resetTime: Number.isFinite(reset) ? reset : null,
    };
  }).filter(value => value.id);
  return {
    model: cleanText(model.display_name || model.id) || null,
    state: states.includes(payload.agent_state) ? payload.agent_state : null,
    width: Number.isInteger(payload.terminal_width) && payload.terminal_width > 0 ? Math.min(500, payload.terminal_width) : 80,
    context: { usedPercentage: used ?? (remaining !== null && remaining <= 100 ? 100 - remaining : null),
      capacity: tokens(context.context_window_size) || null },
    cacheReadTokens: read, cacheCreationTokens: write,
    cacheRate: cacheRate(model, payload.version, input, read, write, payload.agent_state),
    inputTokens: input, outputTokens: tokens(usage.output_tokens),
    quotas,
  };
}

export function compact(value) {
  if (value === null) return '--';
  const [scaled, suffix] = value >= 1e6 ? [value / 1e6, 'M'] : value >= 1e3 ? [value / 1e3, 'K'] : [value, ''];
  return `${Number(scaled.toFixed(suffix ? 1 : 0))}${suffix}`;
}

export function percentage(value) {
  return value === null ? '--' : `${Number(value.toFixed(1))}%`;
}

export function countdown(quota, now = Date.now()) {
  // Absolute time prevents a replayed reset_in_seconds from looking fresh.
  const seconds = quota.resetTime !== null ? Math.max(0, (quota.resetTime - now) / 1000) : quota.resetInSeconds;
  if (seconds === null) return null;
  if (seconds < 60) return '<1m';
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h${Math.floor(seconds % 3600 / 60)}m`;
  return `${Math.floor(seconds / 86400)}d${Math.floor(seconds % 86400 / 3600)}h`;
}
