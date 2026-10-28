# Tracker QA — October 28, 2026

The production build passed typechecking and the catalog, recipe, calculator, timestamp and API-proxy checks. The following five flows were exercised in the in-app browser using a separate localhost origin so live user inputs were preserved.

| Flow | Verified behavior |
| --- | --- |
| Market | Exact Minecraft ID search, sourced quote details, watchlist save, reset filters, and clear feedback when minimum price exceeds maximum. |
| Investments | Four artwork arrivals reach `landed`, temporary flight layers disappear, replay works, comparison shows sourced quotes and caps selection at three. |
| Flips and saved plans | Firework Rocket's 777 ingredient cost becomes 259 per output item (recipe yield three); 16 outputs show 5.84K spread at a 624 selling quote. Recipe selection works with Enter. A Diamond order at 5K buy, 8.5K sell and quantity 10 yields 35K; the saved plan and watchlist survive reload. A 10% auction fee produces 26.5K spread. Fractional quantities and fees outside 0–100% disable saving with feedback. |
| Spawners | All nine types load one 3D canvas at a time without browser errors. Per-type inputs persist. Two Skeleton spawners at six hours/day, Bone rate 100/price 2 and Arrow rate 50/price 1 yield 3K/day, 500/hour and 666.67 days payback at 1M purchase price each. |
| Player search | Invalid usernames show validation. `ninianate` produces a shareable player-search URL and the explicit API-not-connected state; unavailable stats remain blank. |

The tip jar was simplified at the owner's request: it now shows only the selectable recipient username and an instruction to pay in-game. Amount presets, custom amount entry and generated payment commands were removed. The absence of amount controls, dialog dismissal and compact desktop layout were checked. No Minecraft or cash payment was executed.

## Bugs corrected

- Page navigation could briefly mount a destination form twice, losing text entered during the transition. Routes now retain the location associated with each animated page.
- Fractional flip quantities were silently floored while the field displayed the original fraction. They now show an error and cannot be saved.
- Auction fees were silently clamped into range. Invalid fees now receive explicit feedback.
- Typing an exact item name could leave the previous item's selling quote in the planner. Name and ID selection now refresh or clear that quote together.
- Recipe rows lacked a keyboard-accessible selection control. Each now has a native button.
- Reversed market price ranges showed a generic empty result. Both fields now point to a specific range error.

## Integration limits

- Player stats still require an authorized API key saved on a backend. The disconnected state was tested; live stats were not.
- Cash tipping is still coming soon. In-game tips display payment instructions and the recipient username only.
- The committed market snapshot remains dated October 24. The existing GitHub Pages schedule refreshes public quotes during its own deploys; it does not update Sites hosting automatically.
- Dependency auditing still reports existing advisories in the shadcn CLI dependency tree. That CLI is not executed by the deployed static website; dependency upgrades were left outside these UI fixes.
