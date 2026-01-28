---
layout: ../../layouts/BlogLayout.astro
title: Web Scraper
description: Exploring web scraping and html parsing in Rust.
slug: webscraper 
sortOrder: 10
githubURL: https://github.com/mariusnhaugen/webspider
---
I wanted to write a web scraper both for unlocking writing different parsers or doing data analysis projects in the future, and to have an afternoon project to have some fun.

I ended up writing more html parsing than I initially intended, and parsing html directly from the WikiMedia API.

I also ended up writing a [second version](https://github.com/mariusnhaugen/aocinput) of this repo to automate getting and swapping Advent of Code input, which proved incredibly useful the week after, as it was the start of December.


#### Learnings 
- web security concepts
	- robots.txt
	- user agents
	- authenticating to external clients using tokens
- html parsing
- using the WikiMedia API