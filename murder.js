#!/usr/bin/env node
"use strict";const s=require("fastify")();const r=require("./src/popy.js");const t=process.env.PORT||8080;s.get("/",r);s.listen({host:"0.0.0.0",port:t});
