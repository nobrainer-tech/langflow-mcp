<!-- ENG-RULES:START -->
## Engineering rules

The waste in AI-written code is not wrong code — it is too much code. Left alone,
an agent pulls in three dependencies and five layers of abstraction for something
the standard library does in ten lines; asked to fix it, it writes two hundred
more. These rules exist to stop that before the first line is written: don't
write what needn't be written, reuse what can be reused, don't complicate what
can stay simple.

1. **Do not preserve backward compatibility.** Delete what is obsolete. No
   compatibility layers, no migrations, no leftover fallbacks.
2. **Choose the simplest implementation that meets the current requirement.**
   No pre-emptive abstraction, no configuration layer nobody asked for.
3. **Grow the system in layers.** Get a minimal end-to-end version working
   first, then add on top of it. Never tear down something that works for the
   sake of unfinished complexity.
4. **Keep components modular and concerns separated.**
5. **Prefer mature, maintained libraries.** Do not rewrite one yourself without
   a clear reason.
6. **Check what the project's existing dependencies already do** before adding a
   package or writing your own. Do not assume a library lacks a capability —
   read its docs and types first.
7. **Make architectural decisions for the long term.** Do not accept a "this way
   for now, we'll swap it later" stopgap.
8. **Look at how mature products solve the same problem.** Use proven patterns
   instead of inventing from zero.

**Exception to rule 1 — anything holding state or money.** A service on a cron
touching a live account, a repo mid-migration, an API with external consumers:
there, deleting an "obsolete" path is an incident, not a cleanup. Rule 1 applies
only behind a test that covers the path being removed.
<!-- ENG-RULES:END -->
