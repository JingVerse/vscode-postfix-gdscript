import * as vscode from 'vscode';

// ─── Template definitions ────────────────────────────────────────────────────

interface PostfixTemplate {
  name: string;
  description: string;
  body: string | string[];
}

const TEMPLATES: PostfixTemplate[] = [
  { name: 'print',    description: 'print(expr)',           body: 'print({{expr}})' },
  { name: 'printd',   description: 'print_debug(expr)',     body: 'print_debug({{expr}})' },
  { name: 'printerr', description: 'printerr(expr)',        body: 'printerr({{expr}})' },
  { name: 'return',   description: 'return expr',           body: 'return {{expr}}' },
  { name: 'if',       description: 'if expr:',              body: ['if {{expr}}:', '\t$0'] },
  { name: 'ifn',      description: 'if expr == null:',      body: ['if {{expr}} == null:', '\t$0'] },
  { name: 'ifnn',     description: 'if expr != null:',      body: ['if {{expr}} != null:', '\t$0'] },
  { name: 'not',      description: 'if not expr:',          body: ['if not {{expr}}:', '\t$0'] },
  { name: 'while',    description: 'while expr:',           body: ['while {{expr}}:', '\t$0'] },
  { name: 'forloop',  description: 'for i in range(expr):', body: ['for ${1:i} in range({{expr}}):', '\t$0'] },
  { name: 'forin',    description: 'for item in expr:',     body: ['for ${1:item} in {{expr}}:', '\t$0'] },
  { name: 'int',      description: 'int(expr)',              body: 'int({{expr}})' },
  { name: 'float',    description: 'float(expr)',            body: 'float({{expr}})' },
  { name: 'str',      description: 'str(expr)',              body: 'str({{expr}})' },
  { name: 'bool',     description: 'bool(expr)',             body: 'bool({{expr}})' },
  { name: 'type',     description: 'typeof(expr)',           body: 'typeof({{expr}})' },
  { name: 'len',      description: 'len(expr)',              body: 'len({{expr}})' },
  { name: 'size',     description: 'expr.size()',            body: '{{expr}}.size()' },
  { name: 'is_empty', description: 'expr.is_empty()',        body: '{{expr}}.is_empty()' },
  { name: 'append',   description: 'expr.append(item)',      body: '{{expr}}.append(${1:item})' },
  { name: 'push',     description: 'expr.push_back(item)',   body: '{{expr}}.push_back(${1:item})' },
  { name: 'has',      description: 'expr.has(key)',          body: '{{expr}}.has(${1:key})' },
  { name: 'clear',    description: 'expr.clear()',           body: '{{expr}}.clear()' },
  { name: 'emit',     description: 'expr.emit()',            body: '{{expr}}.emit(${1})' },
  { name: 'connect',  description: 'expr.connect(callable)', body: '{{expr}}.connect(${1:callable})' },
  { name: 'await',    description: 'await expr',             body: 'await {{expr}}' },
  { name: 'assert',   description: 'assert(expr)',           body: 'assert({{expr}})' },
  { name: 'as',       description: 'expr as Type',           body: '{{expr}} as ${1:Type}' },
];

// ─── Expression extractor ────────────────────────────────────────────────────

function extractExpression(line: string, dotPos: number): string | null {
  if (dotPos <= 0) return null;
  let i = dotPos - 1;

  function skipBrackets(close: string, open: string) {
    let depth = 1;
    i--;
    while (i >= 0 && depth > 0) {
      if (line[i] === close) depth++;
      else if (line[i] === open) depth--;
      i--;
    }
  }

  while (i >= 0) {
    const ch = line[i];
    if (ch === ')') { skipBrackets(')', '('); continue; }
    if (ch === ']') { skipBrackets(']', '['); continue; }
    if (ch === '.') { i--; continue; }
    if (/[\w$@%]/.test(ch)) { i--; continue; }
    break;
  }

  const expr = line.slice(i + 1, dotPos).trim();
  return expr.length > 0 ? expr : null;
}

// ─── Completion provider ─────────────────────────────────────────────────────

class GDScriptPostfixProvider implements vscode.CompletionItemProvider {
  private get disabledTemplates(): string[] {
    return vscode.workspace
      .getConfiguration('postfix-gdscript')
      .get<string[]>('disabledTemplates', []);
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionItem[] {
    const line = document.lineAt(position).text;
    const textBefore = line.slice(0, position.character);

    const triggerMatch = textBefore.match(/^(.*?)\.(\w*)$/);
    if (!triggerMatch) return [];

    const beforeDot = triggerMatch[1];
    const typed = triggerMatch[2];
    const dotPos = beforeDot.length;

    const expr = extractExpression(beforeDot, dotPos);
    if (!expr) return [];

    const disabled = this.disabledTemplates;
    const activeTemplates = TEMPLATES.filter(t => !disabled.includes(t.name));

    const replaceStart = position.character - typed.length - 1 - expr.length;
    const replaceRange = new vscode.Range(
      position.line, replaceStart,
      position.line, position.character,
    );

    return activeTemplates.map(template => {
      const item = new vscode.CompletionItem(
        `.${template.name}`,
        vscode.CompletionItemKind.Snippet,
      );
      item.detail = template.description;
      item.filterText = `${expr}.${template.name}`;
      item.sortText = `0_${template.name}`;

      const rawBody = Array.isArray(template.body)
        ? template.body.join('\n')
        : template.body;
      const snippetBody = rawBody.replace(/\{\{expr\}\}/g, expr);

      item.insertText = new vscode.SnippetString(snippetBody);
      item.range = replaceRange;
      return item;
    });
  }
}

// ─── Activation ──────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('GDScript Postfix');
  output.appendLine('GDScript Postfix Completion activated');

  const provider = new GDScriptPostfixProvider();

  // 注册所有可能的 GDScript language ID
  // Godot Tools 用 'gdscript'，但保险起见也注册文件扩展名
  const selectors: vscode.DocumentSelector = [
    { language: 'gdscript' },
    { pattern: '**/*.gd' },
  ];

  const disposable = vscode.languages.registerCompletionItemProvider(
    selectors,
    provider,
    '.', // trigger character
  );
  context.subscriptions.push(disposable);
  context.subscriptions.push(output);

  // 诊断：打印当前打开文件的 language ID
  if (vscode.window.activeTextEditor) {
    const langId = vscode.window.activeTextEditor.document.languageId;
    output.appendLine(`Active file language ID: "${langId}"`);
  }

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      output.appendLine(`File opened, language ID: "${editor.document.languageId}"`);
    }
  });
}

export function deactivate() {}
