# The Nightstand is a capped attention budget, not a queue

The app's primary job is deciding what to read next, and the usual mechanism — a priority field on every book — fails because nothing stops everything becoming high priority. Instead there is one ordered list of five Slots, and a book being read holds its Slot for the entire time it is being read, so the cap bounds total active attention rather than just the queue behind it. Acquisition is deliberately not a membership condition: a Wanted book on the Nightstand is the instruction to buy it, which is why there is no separate ranked wishlist.

## Consequences

- The only ways to free a Slot are finishing and abandoning, which gives abandoning a purpose it does not usually have.
- The cap is fixed at five in code, not exposed in settings. A limit that can be raised in two taps is not a forcing function.
- A silently-stalled book squats a Slot. Rather than tracking reading progress, the app detects this from `started_on` and the date a book was slotted, and surfaces the slot's age.
