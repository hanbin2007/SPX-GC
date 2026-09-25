const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("legacy SPX update defaults to an SPX graphic", () => {
  const source = fs.readFileSync(path.join(__dirname, "../views/view-renderer.handlebars"), "utf8");
  const start = source.indexOf("case 'updateTemplate':");
  const end = source.indexOf("break;", start);
  assert.ok(start >= 0 && end > start, "renderer update handler exists");
  const handler = new Function(
    "incomingData", "data", "validateLayerNro", "setTimeout", "updateLayer",
    `let projectFormat; let LayerNro; ${source.slice(start + "case 'updateTemplate':".length, end)}`
  );
  let result;
  handler({}, { webplayout: "1", fields: [] }, (layer) => layer,
    (fn) => fn(), (layer, fields, format) => { result = { layer, fields, format }; });
  assert.equal(result.format, "SPX");

  handler({ projectFormat: "OGRAF" }, { webplayout: "2", fields: [] }, (layer) => layer,
    (fn) => fn(), (layer, fields, format) => { result = { layer, fields, format }; });
  assert.equal(result.format, "OGRAF");
});
