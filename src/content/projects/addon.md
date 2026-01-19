---
layout: ../../layouts/BlogLayout.astro
title: WoW addon 
description: My experience writing a fully released MMORPG plugin. 
slug: addon 
sortOrder: 40
githubURL: https://github.com/mariusnhaugen/BuffBot
---


A Quality of Life plugin for the MMORPG World of Warcraft. Written in Lua for the games own embedded Lua engine.

#### Learnings 
- Lua
- Reverse engineering APIs with very varied documentation quality.
- Talking to "clients" and change designs based on end user feedback.

#### Why?
There are plugins that allow you to run code to customise your User Interface and automate tasks through Lua scripts and the public API. I've had a fair bit of experience working with these since all the way back in 2010, but i had never written a full plugin from scratch, and I had an idea I thought would be useful.


#### Reverse engineering the game API
Implementing functionality in an embedded Lua engine was always going to require learning the API. Its a locked down environment that tries to protect the end user from malicious or poorly written plugins, with no guarantee for stability. There are also multiple parallel live versions of the game with subtle API differences.
As a result, despite the community maintaining very impressive Wikis, most of the online documentation is ephemeral and I found the most effective strategy was to just try making calls and seeing what came back. The API also differs greatly depending on the year it was implemented, which is really cool to uncover. 
writing anything for the game requires researching and testing almost every API call you're trying to make. Sometimes even making inferences of what the new version of a call would look like based on similar, documented changes. 

