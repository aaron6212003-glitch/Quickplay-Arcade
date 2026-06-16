import fs from 'fs';
import { parse } from 'acorn';

const code = fs.readFileSync('js/locker.js', 'utf8');

// Parse the code into an AST
const ast = parse(code, { ecmaVersion: 2022, sourceType: 'module' });

const declared = new Set([
  'console', 'window', 'document', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'Math', 'Date', 'Promise', 'AudioContext', 'webkitAudioContext', 'increment', 'alert', 'confirm', 'localStorage', 'navigator', 'location', 'sessionStorage', 'XMLHttpRequest', 'fetch', 'Image'
]);
const referenced = new Set();

function walk(node, scope = new Set()) {
  if (!node) return;

  // Track declarations in scope
  const newScope = new Set(scope);
  if (node.type === 'VariableDeclaration') {
    for (const decl of node.declarations) {
      if (decl.id.type === 'Identifier') {
        newScope.add(decl.id.name);
      }
    }
  } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    if (node.id && node.id.type === 'Identifier') {
      newScope.add(node.id.name);
    }
  } else if (node.type === 'ImportDeclaration') {
    for (const spec of node.specifiers) {
      newScope.add(spec.local.name);
    }
  }

  // Check identifier references
  if (node.type === 'Identifier') {
    // Only check if it's a reference, not a declaration or property key
    referenced.add(node.name);
  }

  // Walk children
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          walk(child, newScope);
        }
      } else {
        // Skip walking property keys in MemberExpressions and ObjectPatterns/Properties unless they are computed
        if (node.type === 'MemberExpression' && key === 'property' && !node.computed) continue;
        if (node.type === 'Property' && key === 'key' && !node.computed) continue;
        if (node.type === 'MethodDefinition' && key === 'key' && !node.computed) continue;
        walk(node[key], newScope);
      }
    }
  }
}

walk(ast);

// Collect declared variables in module scope
const moduleScope = new Set();
for (const node of ast.body) {
  if (node.type === 'VariableDeclaration') {
    for (const decl of node.declarations) {
      if (decl.id.type === 'Identifier') moduleScope.add(decl.id.name);
    }
  } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    if (node.id && node.id.type === 'Identifier') moduleScope.add(node.id.name);
  } else if (node.type === 'ImportDeclaration') {
    for (const spec of node.specifiers) {
      moduleScope.add(spec.local.name);
    }
  }
}

// Find referenced variables that are neither declared in global nor in module scope
const undefinedGlobals = [];
for (const name of referenced) {
  if (!declared.has(name) && !moduleScope.has(name)) {
    undefinedGlobals.push(name);
  }
}

console.log("Undefined Globals found:", undefinedGlobals);
