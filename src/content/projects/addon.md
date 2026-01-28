---
layout: ../../layouts/BlogLayout.astro
title: WoW addon 
description: My experience writing a fully released MMORPG plugin. 
slug: addon 
sortOrder: 40
githubURL: https://github.com/mariusnhaugen/BuffBot
---
A Quality of Life plugin for the MMORPG World of Warcraft. Written in Lua for the games own embedded engine.

#### Learnings 
- Lua
- Reverse engineering APIs with very varied documentation quality.
- Talking to clients and change designs based on end user feedback directly.

#### Why?
There are plugins that allow you to run scripts to customise your User Interface and automate tasks through Lua scripts. I've had a fair bit of experience working with these since all the way back in 2010, and despite reaching thousands of users with them,  I had never written a full plugin from scratch. 
Also the joy of making something I would have use for myself.
#### Reverse engineering the game API
Implementing functionality in an embedded Lua engine was always going to require learning the API. The environment is locked down since it tries to protect the end user from malicious or poorly written plugins, with no guarantee for API stability. 

As a result, despite the community maintaining very impressive Wikis, most of the online documentation is ephemeral and I found the most effective strategy was to experiment. 

The API also differs greatly depending on the year each feature was implemented, which made digging around feel like digital archaeology. 

