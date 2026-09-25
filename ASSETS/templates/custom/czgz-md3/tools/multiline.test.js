const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

test("SPX textarea line breaks survive template decoding", (t) => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    runScripts: "outside-only",
    url: "http://localhost/"
  });
  t.after(() => dom.window.close());
  dom.window.eval(fs.readFileSync(path.join(__dirname, "../core/md3.js"), "utf8"));

  const { decode } = dom.window.CZ;
  assert.equal(decode("08:30 | 开场&lt;br&gt;09:00 | 致辞"), "08:30 | 开场\n09:00 | 致辞");
  assert.equal(decode("第一行<BR/>第二行"), "第一行\n第二行");
  assert.equal(decode("第一行\\n第二行"), "第一行\n第二行");
  assert.equal(decode("第一行\n第二行"), "第一行\n第二行");
});
