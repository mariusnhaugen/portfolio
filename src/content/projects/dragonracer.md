---
layout: ../../layouts/BlogLayout.astro
title: DragonRacer
description: A task tracker for Old School RuneScape Leagues, syncing in-game progress into the browser through a game plugin and a server of my own.
slug: dragonracer
sortOrder: 101
repos:
  - label: Web Client
    url: https://github.com/mariusnhaugen/dragonracer
  - label: Server
    url: https://github.com/mariusnhaugen/dragonracer-server
  - label: RuneLite Plugin
    url: https://github.com/mariusnhaugen/dragonracer-plugin
learnings:
  - Designing a system across three runtimes that each own a different piece of the data
  - Decoding packed bitfields — turning 62 opaque 32-bit integers back into a list of task IDs
  - Spring Boot on Java 21, with validation that refuses to boot on a malformed catalogue
  - Putting the schema behind an endpoint so one side can change without releasing the other
  - HTTP caching in earnest — ETags and conditional requests on both ends of the wire
  - Testing network code properly with MSW rather than hand-rolled fetch stubs
  - Writing my own trade-offs down as limitations instead of quietly hoping nobody asks
---

#### What?
A task tracker for Old School RuneScape *Leagues*, a seasonal game mode where players race through a few hundred tasks across the world for points. The official wiki publishes the full task list, but it is a static table — no way to check things off, group them, or filter down to what you can actually do right now.
<br>
<br>
DragonRacer is three programs: a **React client** in the browser, a **Spring Boot server** that owns the task catalogue and per-player progress, and a **RuneLite plugin** that watches the game client and reports your state upward. All three are written and talking to each other.

#### Why?
I spent a previous League with a spreadsheet open on a second monitor, alt-tabbing to tick rows off by hand. That is a solvable problem, and one where I am unambiguously the target user.
<br>
<br>
It is also the first project of mine that genuinely needs to be more than one program. The client cannot know what you have completed in-game, and the game plugin has no business rendering a task table. Splitting the work three ways was the point rather than an accident of scope.

#### The client
React 19 on Vite, with Tailwind v4 — which drops the config file entirely and moves design tokens into CSS under `@theme`. I leaned into that and wrote the palette out as a small [design system](https://github.com/mariusnhaugen/dragonracer/blob/main/design-system.md) modelled on the wiki's own dark colours, so the app feels like it belongs next to the tab it replaces.
<br>
<br>
All the interface state — filters, user-defined groups, per-task tags, which regions are pinned to the filter bar — lives in a single object persisted to localStorage. Loading a player from the server then *replaces* your completions with whatever the game says. That replace-rather-merge decision is the one place a regression would quietly destroy someone's work, so it is the behaviour I most wanted pinned down by a test.

#### The server, and the part that was actually interesting
The game does not expose "which tasks have you finished" as a list. It exposes *varps* — plain 32-bit integers holding per-player state — and Leagues packs task completion into 62 of them as one long bitfield, a single bit per task. Task `t` lives in varp number `t >>> 5`, at bit `t & 31`. That gives 62 × 32 = 1984 addressable slots for a catalogue that currently uses 1592.
<br>
<br>
So the server's job is arithmetic: take the raw integers the plugin dumped, walk the catalogue, and shift out the bits that are set. Everything else is scaffolding around that one loop — Java 21, SQLite through `JdbcTemplate`, Bean Validation on the way in, Micrometer on the way out.
<br>
<br>
The scaffolding I care most about is the startup check. `TaskCatalogService` refuses to boot if the task IDs are non-contiguous, duplicated, or run past the addressable bit capacity, because a catalogue that is off by one does not fail — it silently mis-decodes every player who ever submits. A crash on startup is a much better outcome than a year of subtly wrong data.

#### The plugin, and keeping it dumb
The RuneLite plugin reads your own account on seasonal worlds every ten seconds, and only submits when something has actually changed since the last poll, so an idle account generates no traffic at all.
<br>
<br>
The design decision I like here is that the plugin does not know which varps matter. It asks the server for a `/manifest` — the list of varp IDs to dump — on login and every twenty minutes after. When Jagex shifts the numbering, or a new League moves the bitfield somewhere else, that is a server-side edit and a redeploy. Nobody has to download a new plugin. The plugin stays a dumb pipe, which is exactly what you want from the component you cannot ship a hotfix to.
<br>
<br>
Sync is off by default, and RuneLite shows its own confirmation before any submission, because posting to an external service exposes the player's IP to it. That is their data to consent to, not mine to assume.

#### Caching, properly
The task catalogue is a few hundred kilobytes that change roughly never, and refetching it on every page load is wasteful. The server hashes the payload into a SHA-256 `ETag` and serves it with `Cache-Control: public, max-age=3600`; the client stores the response alongside that tag and sends `If-None-Match` on the next request. A `304` means the copy in localStorage is still good.
<br>
<br>
I have used ETags before in the sense that a framework was doing it somewhere below me. Writing both halves of the conversation myself, in two different languages, was the first time the mechanism actually clicked.

#### What I knowingly left broken
`POST /submit` is unauthenticated. Anyone can submit under any username and overwrite that player's record. There is no way to prove ownership of an OSRS account from a plugin without an auth flow Jagex would have to sanction, so the endpoint trusts its caller and leans on rate limiting to make abuse tedious rather than impossible.
<br>
<br>
That rate limiting is itself per-instance and keyed on the socket address, so behind a reverse proxy every caller would share one bucket. SQLite is fine for a single-writer hobby workload and is the first thing to replace if it ever isn't. None of these are oversights, but writing them into the README as limitations felt more useful than leaving them as things I merely knew.

#### What's next
Submitting the plugin to the RuneLite hub, which is a review process of its own, and pointing everything at a real deployed host. The rest is the same work as [writing a game plugin before](/projects/addon) — the interesting parts of both projects turned out to be the same kind of experimentation-over-documentation against an API nobody wrote down.
