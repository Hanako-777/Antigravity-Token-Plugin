# TPS timing quality

Desktop and IDE share the same calculation. Eligible response tokens are summed
and divided by the sum of their streaming durations. TTFT is separate; it is
never added to the TPS denominator. No speed ceiling or synthetic duration is used.

## Quarantined rates

- Invalid/inconsistent output token scopes, or conflicting duplicate request records.
- Multiple attempt usage records with differing token counts, when the API supplies
  only one request timing summary. A single `retryInfos` item is not a retry.
- Tool-only planner output with a stream under 1 second, TTFT at least 2 seconds,
  and TTFT at least 20 times the streaming duration. This is a conservative
  summary-only heuristic, not proof of buffering. Tool-only association requires
  the generator's step indices; no association is inferred from neighboring steps.
- Short samples above `max(8 × median, median + 12 × MAD)` of at least five
  otherwise eligible samples lasting at least 1 second from the same model,
  provider and token basis. Different models never supply the baseline.
- Nonfinite calculated rates.

Ordinary short text samples remain eligible and are flagged. Sustained high rates
remain eligible, even when above the baseline; they receive a warning. Thresholds
are deliberately conservative policy and may need real-world tuning.
No chunk timeline is exposed by the current Antigravity API, so the DSH `dt`
detector cannot be reproduced and actual server generation time cannot be recovered.

## Display and persistence

An unreliable latest request shows **Timing uncertain / 计时异常**, never the prior
request's rate. The UI keeps only the calculation basis; exclusion counts and
reasons remain numeric diagnostic metadata and are explained in the README. Tokens,
cache, context and TTFT are retained. If no eligible samples exist, TPS is unknown.

Old saved rates are masked until the full trajectory can be read and recalculated.
Other saved usage survives. Full coverage recalculations replace prior rates even
if fewer samples now qualify. Partial or regressing host responses do not replace
the saved full coverage snapshot. Only numeric aggregates and fixed reason codes
are saved; no prompts, output/tool arguments, request identifiers or raw trajectory
are added to persisted statistics.

References: DSH discussions
[7960](https://github.com/deepseek-ai/deepseek-harness/discussions/7960) and
[6129](https://github.com/deepseek-ai/deepseek-harness/discussions/6129).
