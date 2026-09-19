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
  - Learning/reverse engineering game internals like the varp system.
  - Designing a system across three runtimes and their data contracts.
  - Building software within a third party environment, and within the rules of an open source project.
  - Working with packed bitfields, and turning opaque 32-bit integers back into a list of task IDs
  - Putting the schema behind a manifest endpoint so one side can change without rereleasing the other
  - HTTP caching techniques in data-rich applications. ETags and conditional requests on both ends of the wire
  - Testing network code properly with MSW rather than hand-rolled fetch stubs
---

## What?

A task tracker and planner for Old School RuneScape Leagues, a seasonal game mode where players race through a few hundred tasks across the world for points. The official wiki publishes the [full task list](https://oldschool.runescape.wiki/w/Demonic_Pacts_League/Tasks), but it is a table with no filtering which makes planning on the move unneccesarily tedious.
<br>
<br>
DragonRacer is three programs: a React client, a Spring Boot server that owns the task catalogue and per-player progress, and a RuneLite plugin that scrapes the game client and reports your state upward.

<br>
<br>

## Why?

I have over several years maintained a spreadsheet for me and my friends that initially was just a dashboard of your current progress with pretty graphs, that eventually evolved to include planners to help hit certain milestones efficiently. This project is the evolution of that spreadsheet. The primary issue was having to spend time on manual data entry while racing to complete the tasks, and I set out to fix it.
<br>
<br>

I was envisioning an app with groups and tags that would allow you to filter down to what you can actually act on right now, and hide all the clutter.
<br>
<br>

## Three different agentic approaches

On top of solving the problem, I had the idea to use this project to really explore agentic workflows. The React client is written exclusively utilising agents, and a focus on context management, handoff documents and parallelized agent work.

The server is written how I'd expect most engineers to be utilising agents, using the agent as a research assistant and pair programmer. Some of the interfaces or function signatures are written manually to describe intent to the agent, and simpler stuff was left to the LLM to handle but reviewed with care.

The plugin was written completely by hand, while using the agent purely for research and information.
<br>
<br>

## The Architecture

<div class="my-10 overflow-x-auto">
<svg viewBox="0 0 720 150" role="img" aria-label="Diagram: the plugin posts varps to the server and reads a manifest from it; the server, backed by SQLite, serves the catalogue and player endpoints to the client." style="width:100%;min-width:560px;height:auto;font-family:inherit;font-weight:300">
  <defs>
    <marker id="dr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
    </marker>
  </defs>
  <g fill="none" stroke="#9ca3af" stroke-width="1">
    <rect x="10" y="52" width="130" height="68" rx="10" />
    <rect x="290" y="48" width="140" height="76" rx="10" />
    <rect x="310" y="4" width="100" height="30" rx="8" />
    <rect x="570" y="52" width="140" height="68" rx="10" />
    <path d="M 360 34 L 360 48" />
    <path d="M 285 72 L 147 72" marker-end="url(#dr-arrow)" />
    <path d="M 145 104 L 283 104" marker-end="url(#dr-arrow)" />
    <path d="M 435 72 L 566 72" marker-end="url(#dr-arrow)" />
    <path d="M 435 104 L 566 104" marker-end="url(#dr-arrow)" />
  </g>
  <g fill="#e5e7eb" font-size="15" text-anchor="middle">
    <text x="75" y="91">Plugin</text>
    <text x="360" y="91">Server</text>
    <text x="360" y="24">SQLite</text>
    <text x="640" y="91">Client</text>
  </g>
  <g fill="#9ca3af" font-size="13" text-anchor="middle">
    <text x="215" y="63">/manifest</text>
    <text x="215" y="122" fill="#FFFFFF"  >/submit</text>
    <text x="500" y="63">/catalogue</text>
    <text x="500" y="122" fill="#FFFFFF" >/player</text>
  </g>
</svg>
</div>

<p class="caption"><em>The player data flows entirely one way, with the server as the source of truth for manifest and task catalogue.</em></p>

The game does not expose completed tasks as a list. It exposes _varps_ ("varplayers"). These are 32-bit integers holding player state as bitpacked booleans. Leagues tasks being essentially a 1600 task long todo list, they are shoved into ints where a single bit represents a task. Task `t` lives in varp number `t >>> 5`, at bit `t & 31`.

<div class="my-10 overflow-x-auto">
<svg viewBox="0 0 720 258" role="img" aria-label="Diagram: task 100 resolves to slot 3 of the varp list, which is game varp 2619, and to bit 4 within that varp." style="width:100%;min-width:640px;height:auto;font-family:inherit;font-weight:300">
  <defs>
    <marker id="dr-bit-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
    </marker>
  </defs>
  <text x="10" y="20" fill="#e5e7eb" font-size="15">task t = 100<tspan fill="#9ca3af">&#160;&#160;→&#160;&#160;t &gt;&gt;&gt; 5 = 3 (slot),&#160;&#160;t &amp; 31 = 4 (bit)</tspan></text>
  <g fill="#9ca3af" font-size="10" text-anchor="middle">
    <text x="155" y="50">0</text>
    <text x="229" y="50">1</text>
    <text x="303" y="50">2</text>
    <text x="377" y="50">3</text>
    <text x="451" y="50">4</text>
    <text x="525" y="50">5</text>
    <text x="599" y="50">6</text>
  </g>
  <g fill="none" stroke="#9ca3af" stroke-width="1">
    <rect x="120" y="58" width="70" height="32" rx="6" />
    <rect x="194" y="58" width="70" height="32" rx="6" />
    <rect x="268" y="58" width="70" height="32" rx="6" />
    <rect x="416" y="58" width="70" height="32" rx="6" />
    <rect x="490" y="58" width="70" height="32" rx="6" />
    <rect x="564" y="58" width="70" height="32" rx="6" />
    <path d="M 377 92 L 377 126" marker-end="url(#dr-bit-arrow)" />
  </g>
  <rect x="342" y="58" width="70" height="32" rx="6" fill="none" stroke="#a0f000" stroke-width="1" />
  <text x="112" y="79" fill="#9ca3af" font-size="13" text-anchor="end">varp list</text>
  <g fill="#e5e7eb" font-size="14" text-anchor="middle">
    <text x="155" y="79">2616</text>
    <text x="229" y="79">2617</text>
    <text x="303" y="79">2618</text>
    <text x="377" y="79">2619</text>
    <text x="451" y="79">2620</text>
    <text x="525" y="79">2621</text>
    <text x="599" y="79">2622</text>
    <text x="665" y="79" fill="#9ca3af">…</text>
  </g>
  <rect x="309" y="128" width="136" height="28" rx="8" fill="none" stroke="#a0f000" stroke-width="1" />
  <text x="377" y="147" fill="#e5e7eb" font-size="14" text-anchor="middle">varp 2619</text>
  <g fill="none" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3 3">
    <path d="M 309 156 L 120 168" />
    <path d="M 445 156 L 696 168" />
  </g>
  <g fill="none" stroke="#9ca3af" stroke-width="1">
    <rect x="120" y="168" width="576" height="30" rx="6" />
    <path d="M 138 168 L 138 198 M 156 168 L 156 198 M 174 168 L 174 198 M 192 168 L 192 198 M 210 168 L 210 198 M 228 168 L 228 198 M 246 168 L 246 198 M 264 168 L 264 198 M 282 168 L 282 198 M 300 168 L 300 198 M 318 168 L 318 198 M 336 168 L 336 198 M 354 168 L 354 198 M 372 168 L 372 198 M 390 168 L 390 198 M 408 168 L 408 198 M 426 168 L 426 198 M 444 168 L 444 198 M 462 168 L 462 198 M 480 168 L 480 198 M 498 168 L 498 198 M 516 168 L 516 198 M 534 168 L 534 198 M 552 168 L 552 198 M 570 168 L 570 198 M 588 168 L 588 198 M 606 168 L 606 198 M 624 168 L 624 198 M 642 168 L 642 198 M 660 168 L 660 198 M 678 168 L 678 198" />
    <path d="M 615 226 L 615 202" marker-end="url(#dr-bit-arrow)" />
  </g>
  <rect x="606" y="168" width="18" height="30" fill="none" stroke="#a0f000" stroke-width="1" />
  <text x="615" y="189" fill="#a0f000" font-size="13" text-anchor="middle">1</text>
  <text x="113" y="188" fill="#9ca3af" font-size="11" text-anchor="end">31</text>
  <text x="703" y="188" fill="#9ca3af" font-size="11" text-anchor="start">0</text>
  <text x="615" y="244" fill="#9ca3af" font-size="12" text-anchor="middle">bit 4</text>
</svg>
</div>

<p class="caption"><em>Task 100 resolves to slot 3 of the varp list — game varp 2619 — at bit 4. Bits run 31 down to 0, so bit 4 is the fifth from the right.</em></p>

For the technically curious reader: the most recent league had 62 reserved ints stored on the player, giving 62 × 32 = 1984 addressable bits. At the moment 1592 are in use, with good headroom for future expansion.

Changes to these are bound to happen, so the general approach was to make the client and the plugin as simple as possible to minimize changes needed during maintenance.

### The server

The server has three main jobs. These are: serving a manifest to the plugin, storing and later serving player information, and serving the client with the master task list. All the varp mappings exist only on the server, the client only renders them.
<br>
<br>
The manifest is a list of varp IDs that the plugin should dump. Since it is a non-contiguous and ever changing list, keeping it server-side and loading it at runtime is a practical way to not have to cut new plugin releases (and go through the RuneLite approval process) every time there is a change.
<br>
<br>
The player information is in the form of varps, posted directly from the plugin. SQLite stores the varps directly as a JSON blob to keep storage requirements small. On read the server decodes the varps into a JSON document before sending it to the client.
<br>
<br>
The task catalogue is a few thousand lines of JSON that only change a couple of times per year, and refetching it on every page load is wasteful. The server hashes the task list `/catalogue` into an ETag and serves it with a cache-control policy that allows the client to ask [if the resource has been changed without triggering a full refetch.](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-None-Match)
<br>
<br>
Between the server side decoding, master task list and the plugin manifest, when there are changes in the task list, it only requires one central update to the server.

#### Agent Approach: Pair programmer

This turned out to be my favorite way to use the agents, which I kind of suspected given it was also the least restrictive. Having the agent available to build out unit tests and quickly fix mistakes, while also having the freedom to get into the gritty details and hand-craft the core program loops really does combine the best of both worlds. This approach balances development velocity and my own understanding of the core parts of the program the best. Learning this way also feels very quick since you do not get derailed into dealing with small bugs in the middle of working out a complicated piece of functionality.

### The plugin

The RuneLite plugin reads your own account on seasonal worlds every ten seconds, and only submits when something has actually changed since the last poll, so an idle account generates no traffic at all.
<br>
<br>
The plugin has no concept of which varps it should look up. It asks the server for a `/manifest` on login and every twenty minutes after.

On a ten second cycle, the plugin reads all the varps from the player object and, if there is a mismatch against the local cache, it posts the new varps to the server.
<br>
<br>
Sync is off by default, because posting to an external service exposes IP addresses, and RuneLite shows its own confirmation before any submission as is required by the RuneLite Plugin Hub.

#### Agent Approach: Research only

The agent here was invaluable in pointing out rules and guidance from the RuneLite team that traditionally would've taken a good amount of time to research before beginning a project of this nature. Restricting myself to writing everything by hand made for more intentionality in the code, but I think led to me being more hesitant to add "nice to have" functionality. I'm quite proud of making software that does one thing, and does that thing well, and I noticed way less "accidental" feature creep when working this way. That being said, I definitely missed quickly being able to refactor or add unit tests without having to take the time to do it manually.

### The client

React 19 on Vite, with Tailwind v4, using Opus 4.6. The UI is essentially a datatable with a filter bar, which made it a decent candidate to see what I could get an agent to do.

This was written while _intentionally looking at the code as little as possible_. The goal was to see how efficiently or competently I could output a web UI limited to just prompting.
<br>
<br>
Since the ultimate source of truth is the actual in-game player data, the cache can get away with replacing all the completion data when a new username is loaded, significantly reducing complexity. All the interface state such as filters, tasks and user-defined groups are persisted to localStorage.

#### Agent Approach: Prompting only

I developed this with my code editor intentionally closed. Overall, I'd call this a success. The visual style is not exactly what I'd choose were I doing it manually, but it looks fairly good and is (most importantly) very usable. Already you can see newer models are way easier to direct in terms of visual style as well. The UI came together surprisingly quickly and even implemented some more technical features with accurate changes. Most of the prompting was either me giving it style guidance or testing out different approaches to writing plans into PRDs so I could parallelize the work. In the end, I also learned a lot about effective prompting and effective planning when you're planning for a new agent that doesn't have conversation/planning context. However, I did notice that some bugs took way longer than they normally would to detangle as a result of the implementation being unfamiliar.

### Tradeoffs and considerations

`POST /submit` is unauthenticated. Anyone can submit under any username and overwrite that player's record. There is no way to prove ownership of an OSRS account from a plugin without an auth flow Jagex would have to sanction, so the endpoint trusts its caller and leans on rate limiting to make abuse tedious rather than impossible. Since the data flows one way with the game itself as the source of truth, any naive overwrite attempts would just get overwritten back to the true state every 10 seconds by an active player anyway.
<br>
<br>
The rate limiting is itself per-instance and keyed on the socket address, so behind a reverse proxy every caller would share one bucket.
Storing up to 2 kB per player, SQLite is fine for a workload of this size even if this was to somehow become more popular than the game itself. It would only really need to be replaced if the server ever needed multiple instances to keep up with throughput.
