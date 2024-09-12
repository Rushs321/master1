"use strict";
function copyHeaders(response, reply) {
  for (const [key, value] of Object.entries(response.headers)) {
    try {
      reply.header(key, value);
    } catch (e) {
      console.log(e.message);
    }
  }
}
module.exports = copyHeaders;
