# Context occupancy, provider references and compaction

## What the percentage means

The main context percentage remains:

`estimatedTokensUsed / maxContextTokens`

Both counters come from the current request's Antigravity `contextWindowMetadata`. The denominator is the host's active window, not a guessed provider specification. A valid host limit is never replaced by a larger model catalog value. Missing/invalid/zero host limits leave the percentage unavailable; a known provider model cannot fabricate it. Zero usage remains zero, and over-capacity estimates remain visible as such.

## Separate reference information

The collector and this document distinguish the following sources. The compact card shows the host used/total counters once, plus the sampled model and account quotas; it omits duplicate references and unsupported trigger fields:

1. **Active window (host):** the reported capacity used by this session.
2. **Provider capacity reference:** a sourced upstream specification for an exactly identified model. It does not promise that this account, host, mode or request can use that capacity. Gemini's published input budget and a combined context window are not interchangeable.
3. **Compaction threshold:** unknown unless a reliable host-specific source establishes the trigger. `maxContextTokens` alone is not evidence of such a threshold. The current inspected schema provides only `estimatedTokensUsed` and `maxContextTokens`, so this implementation does not claim fixed 256K/160K/80K triggers.

References checked on **2026-10-14**:

| Exact model family | Published reference | Source |
| --- | --- | --- |
| Gemini 3.8 Flash | Input limit 1,048,576 | [Google model specification](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) |
| GPT-OSS 120B | Context window 131,072 | [OpenAI model specification](https://developers.openai.com/api/docs/models/gpt-oss-120b) |
| Claude Sonnet 4.6 | 1M | [Anthropic model specification](https://platform.claude.com/docs/en/models/sonnet-4-6/overview) |
| Claude Opus 4.6 | 1M | [Anthropic context-window documentation](https://platform.claude.com/docs/en/build-with-claude/context-windows) |
| Claude Sonnet 5.5 | 1M | [Anthropic model specification](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) |
| Claude Opus 5.5 | 1M | [Anthropic model specification](https://platform.claude.com/docs/en/models/opus-5-5/overview) |

Claude references retain the literal published `1M` label; they are not converted into a guessed precise 1,048,576-token figure. The raw numeric provider-reference field is null for these label-only entries. References are static, dated documentation lookups, not a live capabilities query.

## Model recognition

Version spellings such as `claude-sonnet-5.5` and `claude-sonnet-5-5` normalize consistently. The parser preserves explicit thinking/effort labels; it does not invent them for every model. Exact unrecognized models, custom suffixes, TTS variants, incomplete family names and unknown placeholders do not inherit another model's reference.

Host enum aliases were checked against the installed App's model catalog on the same date: M318 = Gemini High, M319 = Medium, **M320 = Low**, M35 = Claude Sonnet 4.6 (Thinking), M26 = Claude Opus 4.6 (Thinking). M317 is not assumed to be Gemini Low. Alias mappings can change in future host versions; the active percentage still uses the host counters even if a reference alias later becomes outdated.

## Persistence and verification

Saved context restores its host counters and recalculates ratios, remaining tokens and provider references from the recognized model. Arbitrary saved source URLs, thresholds, ratios and unknown fields are not trusted or copied. Earlier records lacking reference fields remain supported. No request timing, token usage, cache calculation or account-quota semantics change.

Regressions cover host/reference disagreement, missing and invalid counters, zero and over-capacity usage, alias equivalence, unsupported variants, restart restoration and malicious/corrupt saved fields. Browser tests check English/Chinese display, stable panels, omitted diagnostic rows and unchanged occupancy. A signed-in local conversation validates that occupancy retains the original host denominator. These checks do not establish a universal platform compaction threshold or signed-in Linux/macOS GUI compatibility.

## 中文说明

控件百分比仍使用宿主返回的「当前已用量 ÷ 当前窗口容量」。供应商容量在后台数据和本说明里单独作为参考，不覆盖当前会话的分母；原生规格、当前产品窗口和压缩触发阈值是不同概念。未核实的压缩阈值不展示，不套用固定数值。

模型 ID 的小数点和连字符写法统一解析，精确识别已核实型号；未知型号不继承其他型号的容量。恢复保存记录时重新计算派生值，并拒绝任意来源 URL、非法阈值和未知字段。

## Optional recorded-text breakdown (PR #15)

The collector can retain an optional **Recorded text estimate** in its numeric diagnostic result. This breakdown is not rendered in the compact App or IDE context card. This classifies readable transcript strings into user text, assistant replies/thinking, tool output and system/checkpoint text. It does not replace the host occupancy percentage, request Token counters, cache hit rate or daily/monthly usage ledger.

The heuristic is `ceil(ASCII UTF-16 code units / 4 + non-ASCII UTF-16 code units / 1.5)` for each logged string. It is not a model tokenizer. Hidden prompts, binary media, structured/non-string content and tool-call arguments are excluded. Unrecognized text-bearing step types mark the result partial rather than silently pretending to provide complete coverage. `ready`/`complete` means the readable log rows matched all current host steps; it does not mean all model input is visible. Missing logs or optional I/O failure show **Unavailable**, not a fabricated zero. Loading and unavailable states are not saved as measured history.

**Undo and branch identity:** records use their explicit zero-based `step_index`, never their line number. They must match the current host step type and, when supplied by the host, its creation timestamp. No steps means no included rows. Records beyond a rewind boundary and mismatched old-branch records are excluded. The last appended revision at a given index wins. Missing identity timestamps or missing/malformed rows are partial. The installed App logs whole-second times while its RPC returns nanoseconds, so comparison uses the coarser declared precision and such matches remain partial. Same-type branch replacements within one recorded second cannot be conclusively distinguished. Host enum prefixes normalize exactly; the observed `RUN_COMMAND` and `VIEW_FILE` → `GENERIC` log mappings are explicitly supported with partial identity, while unknown tool mappings are excluded. Saved estimates are separately labelled as saved; a fresh host boundary replaces the previous estimate even when cumulative request usage is retained. Deleting or rewinding a conversation continues to leave already recorded consumption in the usage ledger unchanged.

**Recorded events:** compaction counts represent explicit `COMPACTION`/`CONTEXT_COMPACTION` records or a `CHECKPOINT` beginning with a recognized summary marker. Quoted markers in user/tool text and falling input counters do not prove compaction. Counts do not prove which historic text is still in the active window, nor a trigger threshold. Image-step counts use only exact `GENERATE_IMAGE`/`IMAGE_GENERATION` types; broad model-name or `generate` keyword guesses are rejected. These event schemas have synthetic regression coverage; no real local compaction/image record was available for acceptance. Unsupported future host types remain unclassified.

**Scope and resource controls:** the reader uses only `~/.gemini/antigravity/brain` for App, or `~/.gemini/antigravity-ide/brain` for IDE, then the authenticated conversation GUID's `.system_generated/logs/transcript_full.jsonl` (fallback `transcript.jsonl`). There is no wildcard search and no CLI transcript collection. Real-path checks reject files redirected outside the exact conversation log path. Numeric caches are separated by the authenticated account hash and conversation and are cleared on account/backend changes.

The collector performs asynchronous 64 KiB reads and yields after each chunk. Each pass reads at most 2 MiB and stops after its 100 ms scheduling budget at a chunk boundary; later polls resume scanning. Only one reader job runs at a time. An LRU retains at most eight conversations and 8,192 numeric row summaries per conversation; oversized boundaries or row sets report unavailable/partial. Huge JSONL strings are projected incrementally, retaining only counters and a transient 256-character marker prefix, never their whole body. Optional failure cannot block speed, cache, context or quota collection.

File replacement, truncation, same-size rewrites and changes to the first/last consumed chunk reset the projection. These bounded SHA-256 anchors detect common rewrites without rescanning the entire history on every poll. A rewrite restricted to an unsampled interior region with unchanged row identities may not be detected until a rescan; this is an append-oriented diagnostic, not an audit log or a filesystem integrity monitor.

`node --expose-gc tools/check-transcript-resources.mjs` generates a synthetic 41 MiB single-line log, verifies multiple bounded passes and event-loop progress, checks the estimate and records observed heap usage. It runs in Windows/Linux/macOS CI alongside undo, index revision, corrupt-line, incomplete-line, truncation, path and persistence regressions. Memory budgets bound this optional feature rather than introducing another whole-response size limit. A read-only Windows App check matched all 93 steps of an existing local conversation without changing host context counters; it correctly remained partial because log timestamps had less precision and some host tool types were represented as GENERIC.

### 中文补充

后台“已记录文本估算”按用户、回复与思考、工具输出、系统文本分类；紧凑卡片不展示这组诊断。它是可读取日志的字符估算，不是当前上下文占用、模型精确 Token 或账单用量；隐藏提示、媒体与工具调用参数不计入。撤回使用明确步骤索引，并核对当前步骤类型和可用的创建时间；零步骤不统计任何旧记录。压缩标记仅表示日志中有记录，不推断当前窗口组成或触发阈值。

App 与 IDE 分别只读自己的日志根目录，按当前账号和对话隔离数字缓存；CLI 不启用此读取器。后台分块读取，缓存与每次读取量有界，不保存对话正文。缺失日志、无法核对身份、坏行或超出预算会明确显示不可用或不完整，不影响速度、缓存率、上下文、额度和用量账本。已记录消费不会因撤回或删除对话而扣减。
