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

A command-line tool that reads an image and gives you a ranked list of the most common colours in the image, with a printed swatch of terminal colours.
<br>
<br>
Written in TypeScript, with [Sharp](https://www.npmjs.com/package/sharp).
<br>
<br>
`--top N` for how many colours to report,
`--bucket-size N` for how aggressively colours get grouped together.

#### Why?

I had never touched image processing before, and I wanted to create a small CLI tool to have a play around with MCP servers.
<br>
<br>

#### How?

I started with the assumption that "libraries can probably parse pixels for me" and no idea where to begin. A conversational research session with claude taught me about sharp, a Node wrapper on libvips, a pixel parsing library with roots back to 1989. I decided to take that on as a dependency to speed up the project. I had an mvp up and running in about an hour, but ended up spending several times that researching efficiency improvements and even the biology of the human eye.

Sharp hands you raw pixel data as a flat byte buffer: `[r, g, b, r, g, b, …]`, or four-wide if there is an alpha channel:`[r, g, b, a, …]`. Once you have that, finding the dominant colour is one pass over a very long array, and counting.

#### The loop

A simple loop passes over the sharp output once, quantizing each pixel into a bucket, before bitpacking the values into a key and lastly hashing into a map that holds the occurrence of each bucketed value. Anything that happens once per pixel, intuitively will be executed a lot. More precisely, a 100-megapixel image means one hundred million iterations (4k: 8.3m). This was therefore the focus of a lot of the time put into optimization.
<br>
<br>
Colours are grouped into buckets before counting, so that shades of similar colours don't compete as separate entries. Each quantized colour becomes the key of a `Map`. Since javascript maps compare objects by reference, every pixel would become its own key. Instead I opted for bitpacking an integer to avoid the allocation overhead of using strings. Three channels get packed into a single integer: 00000000rrrrrrrrggggggggbbbbbbbb, which can be hashed cheaply.

<div class="my-10 overflow-x-auto">
<svg viewBox="0 0 720 250" role="img" aria-label="Diagram: a pixel's channels 183, 92 and 41 are quantized down to 176, 80 and 32 by discarding their low four bits, then packed into a single 32-bit integer whose three low bytes hold red, green and blue, giving the Map key 11554848." style="width:100%;min-width:600px;height:auto;font-family:inherit;font-weight:300">
  <defs>
    <marker id="cs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
    </marker>
  </defs>
  <g fill="#9ca3af" font-size="11" text-anchor="middle">
    <text x="142" y="22">r</text>
    <text x="214" y="22">g</text>
    <text x="286" y="22">b</text>
  </g>
  <g fill="none" stroke="#9ca3af" stroke-width="1">
    <rect x="110" y="30" width="64" height="34" rx="6" />
    <rect x="182" y="30" width="64" height="34" rx="6" />
    <rect x="254" y="30" width="64" height="34" rx="6" />
    <rect x="110" y="94" width="64" height="34" rx="6" />
    <rect x="182" y="94" width="64" height="34" rx="6" />
    <rect x="254" y="94" width="64" height="34" rx="6" />
    <rect x="110" y="158" width="576" height="34" rx="6" />
    <path d="M 254 158 L 254 192 M 398 158 L 398 192 M 542 158 L 542 192" />
    <path d="M 214 64 L 214 90" marker-end="url(#cs-arrow)" />
    <path d="M 214 128 L 214 154" marker-end="url(#cs-arrow)" />
  </g>
  <g fill="#e5e7eb" font-size="15" text-anchor="middle">
    <text x="142" y="53">183</text>
    <text x="214" y="53">92</text>
    <text x="286" y="53">41</text>
    <text x="142" y="117">176</text>
    <text x="214" y="117">80</text>
    <text x="286" y="117">32</text>
  </g>
  <g fill="#e5e7eb" font-size="14" text-anchor="middle">
    <text x="182" y="181">00000000</text>
    <text x="326" y="181">10110000</text>
    <text x="470" y="181">01010000</text>
    <text x="614" y="181">00100000</text>
  </g>
  <g fill="#9ca3af" font-size="11" text-anchor="middle">
    <text x="182" y="208">unused</text>
    <text x="326" y="208">r</text>
    <text x="470" y="208">g</text>
    <text x="614" y="208">b</text>
  </g>
  <g fill="#9ca3af" font-size="13" text-anchor="end">
    <text x="100" y="53">pixel</text>
    <text x="100" y="117">bucketed</text>
    <text x="100" y="181">packed</text>
  </g>
  <g fill="#9ca3af" font-size="13">
    <text x="236" y="84">(v &gt;&gt; 4) &lt;&lt; 4</text>
    <text x="236" y="148">r &lt;&lt; 16 | g &lt;&lt; 8 | b</text>
  </g>
  <text x="398" y="238" fill="#9ca3af" font-size="14" text-anchor="middle">Map key <tspan fill="#a0f000">11554848</tspan></text>
</svg>
</div>

<p class="caption"><em>One pixel through the loop at the default bucket size of 16: each channel loses its low four bits, and the three pack into a single integer the Map can hash without allocating.</em></p>

#### Designing away an edge case

Quantizing is done by discarding low bits: `(v >> shift) << shift` shaves off the bottom bits of a coluor value and effectively rounds a channel down to the chosen bucket size.(i.e `(00010111 >> 2) << 2 becomes 00010100`) This is why `--bucket-size` only accepts powers of two. Since we are working with 8bit values(0-255), using bitshifting was to me an intuitive way to manipulate the values.
<br>
<br>
My initial approach was a variation of `Math.round(v / size) * size`, which handles any bucket width. However, it also (sort of unintuitively) produces uneven buckets, and quietly walks off the end of the range: `Math.round(255 / 10) * 10 = 260`, a value that cannot exist in a colour channel. Instead of clamping it and dealing with off-by-one errors, the bitshifting approach stays within the legal values by design. It does have a small downside of restricting the input to powers of two, which I deem a small price to pay for a cli tool.

#### The bug that looked like a feature

The first working version reported each bucket by its floor — the value you get after shifting the low bits off. It passed its tests and produced visibly wrong output: every colour came back slightly darker than the image, because rounding down is a bias, not a rounding.
<br>
<br>
The fix is to keep counting by bucket but stop _reporting_ the bucket. Each entry carries a running per-channel sum alongside its count, and the colour reported is the mean of the real pixels that landed in it. Grouping still does its job, and a solid-colour image now reports exactly its own colour rather than an invented one nearby.

#### Pinning behaviour in tests

Sharp's pipeline normalizes 1-channel grayscale and 2-channel grey-plus-alpha images up to RGB or RGBA before you ever see the buffer. I could have written explicit handling for those formats, but instead I sent claude off to verify with generated images that this behaviour was consistent. I then added a small test suite to pin this behaviour and alert me should this ever change in the future.
<br>
<br>
The CLI is then allowed to assume three or four channels, and if a future sharp release ever changes that default, the suite fails loudly rather than silently misreading every grayscale image.

#### The MCP server

After the core CLI was functional, I wrapped the same core in a small MCP server, written mostly with a Claude oneshot prompt, so I can utilise the Claude CLI's ability to take in pasted images as files, and analyse an image directly rather than going through the extra steps of opening an image editor, pasting, saving and lastly running the CLI on the file.

This was my first MCP server I rolled from scratch, and the differences in developing for an agent vs human consumption was incredibly insightful.

#### What I'd do next

- Lookup table
  - For larger bucket size, you get few enough buckets that you can preassign an array that houses every possible bucket, and keep occurrences in a flat array.i.e the default bucketSize of 16 has 16x16x16=4096 possible buckets.
  - This avoids pointer chasing and gives us a contigous buffer.
- Alpha handling: fully transparent pixels are skipped, everything else counts at full weight. Partial transparency isn't weighted at all, because the brief only concerned RGB and a half-measure there would imply a precision the tool doesn't have.
- The bigger one is the colour space. RGB distance is not perceptual distance — greens get perceptually crowded in RGB, so a fixed bucket width groups them differently than an eye would. Doing this properly means bucketing in something like OKLab, which is built so that Euclidean distance approximates the smallest difference a person can actually notice, and then clustering with k-means or median-cut instead of a fixed grid. That is a substantially more interesting program than the one I wrote, and the one I'd write next.
