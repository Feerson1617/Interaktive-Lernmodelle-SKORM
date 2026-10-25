// Parse JavaScript rather than rejecting fetch/import outright. Dynamic references
// are reported for application-specific browser coverage, never claimed proven safe.
import { parse } from 'acorn';
import { readFileSync } from 'node:fs';
const inputs = JSON.parse(readFileSync(0, 'utf8'));
const references = [], dynamic = [];
const literal = node => node?.type === 'Literal' && typeof node.value === 'string' ? node.value
  : node?.type === 'TemplateLiteral' && node.expressions.length === 0 ? node.quasis[0].value.cooked : null;
for (const input of inputs) {
  let ast;
  try { ast = parse(input.code, { ecmaVersion: 'latest', sourceType: input.module ? 'module' : 'script', locations: true }); }
  catch (error) { throw new Error(`${input.path}: ${error.message}`); }
  function reference(node, kind, base = input.path) {
    const value = literal(node);
    if (value !== null) references.push({ path: input.path, base, value, kind });
    else dynamic.push({ path: input.path, line: node?.loc?.start.line, kind });
  }
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) reference(node.source, 'module');
    if (node.type === 'ImportExpression') reference(node.source, 'module');
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      const name = node.callee?.name || node.callee?.property?.name;
      if (name === 'URL' && node.arguments[1]?.type === 'MemberExpression' && node.arguments[1].object?.type === 'MetaProperty') reference(node.arguments[0], 'url');
      else if (['fetch', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'sendBeacon', 'load', 'loadAsync', 'importScripts'].includes(name)) {
        // new URL() is inspected separately with the module's own base.
        if (node.arguments[0]?.callee?.name !== 'URL') reference(node.arguments[0], name, input.document);
      } else if (name === 'open' && node.arguments.length >= 2) reference(node.arguments[1], 'XHR/open', input.document);
    }
    if (node.type === 'AssignmentExpression' && ['src', 'href', 'srcset', 'poster'].includes(node.left?.property?.name)) reference(node.right, 'assigned URL', input.document);
    if (node.type === 'CallExpression' && node.callee?.property?.name === 'setAttribute' && ['src', 'href', 'srcset', 'poster'].includes(literal(node.arguments[0]))) reference(node.arguments[1], 'attribute URL', input.document);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc') continue;
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(ast);
}
process.stdout.write(JSON.stringify({ references, dynamic }));
