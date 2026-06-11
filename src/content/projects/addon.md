---
layout: ../../layouts/BlogLayout.astro
title: Game Plugin 
description: My experience writing a fully released MMORPG plugin. 
slug: addon 
sortOrder: 99
githubURL: https://github.com/mariusnhaugen/BuffBot
learnings:
  - Lua
  - Reverse engineering APIs with very varied documentation quality.
  - Talking to users and change designs based on end user feedback directly.
  - Maintaining a piece of software through multiple game patches
---

#### What?
A Quality of Life plugin ("addon") for the MMORPG World of Warcraft. Written in Lua for the games own embedded engine, reviewed by a third party and released on the the most popular [plugin repository](https://www.curseforge.com/wow/addons/buffbot).
At the time of writing, reaching nearly 300 players.


#### Why?
There are plugins that allow you to run scripts to customise your User Interface and automate tasks through Lua scripts. I've had a fair bit of experience working with these since all the way back in 2015, and despite reaching thousands of users with them,  I had never written a full plugin from scratch. 
Also the joy of making something I would have use for myself.

#### Reverse engineering the game API
Implementing functionality in an embedded Lua engine was always going to require learning the API. It is a heavily sandboxed environment as it tries to protect the end user from malicious or poorly written plugins, with no guarantee for API stability. As a result, despite the community maintaining very impressive Wikis, most of the online documentation is ephemeral and I found the most effective strategy was to experiment. 
<br>
<br>
The API also differs greatly depending on the year each feature was implemented, which made digging around feel like digital archaeology. 

