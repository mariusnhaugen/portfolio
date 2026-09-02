---
layout: ../../layouts/BlogLayout.astro
title: Colorscan
description: A CLI that finds the dominant colours in an image and prints them as a ranked, swatched list — plus a small MCP server that hands the same analysis to Claude.
slug: colorscan
sortOrder: 102
repos:
  - url: https://github.com/mariusnhaugen/colorscan
learnings:
  - Working with raw pixel buffers for the first time, and what a decode pipeline actually hands you
  - Bitpacking integers as map keys, in a loop where a single allocation per pixel is a real cost
  - Picking a constraint that designs an edge case away rather than patching around it
  - Pinning a dependency's default behaviour with a test instead of handling every input shape myself
  - Writing an MCP server, and how differently a tool has to report to a model than to a person
  - Perceptual colour spaces, and why distance in RGB is a poor proxy for "looks similar"
---

#### What?
A command-line tool that reads an image and tells you which colours it is actually made of — a ranked list of the most common colours, each printed next to a swatch of itself in 24-bit terminal colour, with the pixel count and share of the image.
<br>
<br>
TypeScript, one runtime dependency, and a test suite. `--top N` for how many colours to report, `--bucket-size N` for how aggressively near-identical shades get grouped together.

#### Why?
It came out of a brief, and I took it because I had never touched image processing before. That turned out to be the interesting part: I started from "libraries can probably parse pixels for me" and no clearer model than that, and the first two hours were mostly finding out what shape the problem really has.
<br>
<br>
The answer is less mysterious than I expected. [sharp](https://sharp.pixelplumbing.com/) — a Node wrapper around libvips, a C library older than I am — hands you `.raw()` pixel data as a flat byte buffer: `[r, g, b, r, g, b, …]`, or four-wide if there is an alpha channel. Once you have that, finding the dominant colour is not an imaging problem at all. It is one pass over a very long array with a counter.

#### The loop is the whole program
Everything expensive happens once per pixel, and a 100-megapixel image means a hundred million iterations of it. So the decisions that mattered were all about what you are allowed to do inside that loop.
<br>
<br>
Colours are grouped into buckets before counting, so that two shades a human would call the same blue don't compete as separate entries. Each quantized colour becomes the key of a `Map` — and the obvious key types are both wrong. An object can't be one at all, because JS maps compare objects by reference, so every pixel would mint a fresh key. A string like `"128,64,32"` works, but costs an allocation and a hash *per pixel*. Instead the three channels get packed into a single integer — `r << 16 | g << 8 | b` — which is three shifts and two ors, no allocation, and a number key the engine can hash cheaply.

#### Designing the edge case away
Quantizing is just discarding low bits — `(v >> shift) << shift` rounds a channel down to its bucket. That is why `--bucket-size` only accepts powers of two.
<br>
<br>
The obvious alternative is `Math.round(v / size) * size`, which handles any bucket width. It also produces uneven buckets, and quietly walks off the end of the range: `Math.round(255 / 10) * 10` is **260**, a value that cannot exist in a colour channel. I could have clamped it. Restricting the input to powers of two instead means the out-of-range case never arises — the constraint removes the problem rather than catching it, and it is the decision from this project I have thought about most since.

#### The bug that looked like a feature
The first working version reported each bucket by its floor — the value you get after shifting the low bits off. It passed its tests and produced visibly wrong output: every colour came back slightly darker than the image, because rounding down is a bias, not a rounding.
<br>
<br>
The fix is to keep counting by bucket but stop *reporting* the bucket. Each entry carries a running per-channel sum alongside its count, and the colour reported is the mean of the real pixels that landed in it. Grouping still does its job, and a solid-colour image now reports exactly its own colour rather than an invented one nearby.

#### Letting a test own someone else's behaviour
sharp's pipeline normalizes 1-channel grayscale and 2-channel grey-plus-alpha images up to RGB or RGBA before you ever see the buffer. I could have written explicit handling for those formats — and then maintained it.
<br>
<br>
What I did instead was write a test that asserts sharp behaves that way. The CLI is then allowed to assume three or four channels, and if a future sharp release ever changes that default, the suite fails immediately rather than the tool silently misreading every grayscale image. It is a small file that exists purely to make an assumption load-bearing in public instead of implicit in my head.
<br>
<br>
A smaller version of the same instinct: the ANSI colour codes are only emitted when stdout is a TTY. Pipe the output into a file or another program and you get plain text, because escape sequences in a log are someone else's problem later.

#### The MCP server
Afterwards I wrapped the same core in a small [MCP](https://modelcontextprotocol.io/) server, so Claude can analyse an image directly rather than me reading colours off a screenshot and typing them back in.
<br>
<br>
What stuck with me was how much the *output* had to change. The CLI reports to a person — swatches, padded columns, aligned counts — and every one of those choices is noise to a model that cannot see a swatch and does not care about alignment. Same algorithm, an audience with completely different senses.

#### What I'd do next
Alpha handling is deliberately blunt: fully transparent pixels are skipped, everything else counts at full weight. Partial transparency isn't weighted at all, because the brief only concerned RGB and a half-measure there would imply a precision the tool doesn't have.
<br>
<br>
The bigger one is the colour space. RGB distance is not perceptual distance — greens get perceptually crowded in RGB, so a fixed bucket width groups them differently than an eye would. Doing this properly means bucketing in something like OKLab, which is built so that Euclidean distance approximates the smallest difference a person can actually notice, and then clustering with k-means or median-cut instead of a fixed grid. That is a substantially more interesting program than the one I wrote, and the one I'd write next.
