"use strict";function t(t,n,e){const o=t.params.originSize||0;n.header("x-proxy-bypass",1);if(o>0){n.header("content-length",o)}return n.code(200).send(e)}module.exports=t;
