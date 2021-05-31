import {App, MarkdownView, Plugin} from 'obsidian';

export default class ToggleCode extends Plugin {
  async onload() {
    this.addCommand({
      id : "toggle-code",
      name : "Toggle text to monospace font.",
      checkCallback : (checking: boolean) => {
        let view = this ?.app ?.workspace ?.activeLeaf ?.view;
        if (view instanceof MarkdownView) {
          let editor = view.sourceMode.cmEditor;
          if (editor) {
            if (!checking) {
              this.toggleCode(editor);
            }
            return true;
          }
        }
        return false;
      },
      hotkeys : [
        {
          modifiers : [ "Ctrl" ],
          key : "`",
        },
      ],
    });
  }

  getSelectedText(editor: CodeMirror.Editor) {
    if (editor.somethingSelected()) {
      let cursorStart = editor.getCursor("from");
      let cursorEnd = editor.getCursor("to");
      let content = editor.getRange(cursorStart, cursorEnd);
      return {
        start : cursorStart,
        end : cursorEnd,
        content : content,
      };
    }
  }

  getTokenAtCursor(editor: CodeMirror.Editor) {
    // TODO: Use findWordAt instead of getTokenAt?
    let cursor = editor.getCursor();
    let token = editor.getTokenAt(cursor);

    // let word = editor.findWordAt(cursor);
    // console.log('word', editor.getRange(word.anchor, word.head));

    if (token.start > 0 && token.end < editor.getLine(cursor.line).length) {
      let s = editor.getRange({line : cursor.line, ch : token.start - 1},
                              {line : cursor.line, ch : token.end + 1});
      if (s[0] == '`' && s[s.length - 1] == '`') {
        token.start -= 1;
        token.end += 1;
      }
    }
    let start = {line : cursor.line, ch : token.start};
    let end = {line : cursor.line, ch : token.end};
    return { start: start, end: end, content: editor.getRange(start, end), }
  }

  getSelectedLines(editor: CodeMirror.Editor) {
    if (editor.somethingSelected()) {
      let cursorStart = editor.getCursor("from");
      let cursorEnd = editor.getCursor("to");

      cursorStart.ch = 0;
      cursorEnd.ch = editor.getLine(cursorEnd.line).length;

      let content = editor.getRange(cursorStart, cursorEnd);

      return {
        start : cursorStart,
        end : cursorEnd,
        content : content,
      };
    }
  }

  toggleInlineCode(editor: CodeMirror.Editor) {
    let selectedText = this.getSelectedText(editor);
    let wasSelection = true;
    let cursor = editor.getCursor();
    if (!selectedText) {
      selectedText = this.getTokenAtCursor(editor);
      wasSelection = false;
    }

    let content = selectedText.content;
    let replacement = '';

    if (content.length >= 2 && content[0] == '`' &&
        content[content.length - 1] == '`') {
      // Toggle off.
      replacement = content.substring(1, content.length - 1);
    } else {
      // Toggle on.
      replacement = '`' + content + '`';
    }

    editor.replaceRange(replacement, selectedText.start, selectedText.end);

    // Set selection to the modified text.
    let ch_diff = replacement.length - selectedText.content.length;
    if (wasSelection) {
      editor.setSelection(
          selectedText.start,
          {line : selectedText.end.line, ch : selectedText.end.ch + ch_diff});
    } else {
      editor.setCursor({line: cursor.line, ch: cursor.ch + ch_diff / 2});
    }
  }

  toggleCodeBlock(editor: CodeMirror.Editor) {
    let selectedLines = this.getSelectedLines(editor);
    let selectedStartLine = selectedLines.start.line;
    let selectedEndLine = selectedLines.end.line;
    let content = selectedLines.content;
    let codeBlockMatch = content.match(/^```\n([\s\S]*)\n```$/);
    let replacement = '';

    if (codeBlockMatch) {
      replacement = codeBlockMatch[1];
      selectedEndLine -= 2;
    } else {
      replacement = '```\n' + content + '\n```';
      selectedEndLine += 2;
    }

    editor.replaceRange(replacement, selectedLines.start, selectedLines.end);
    editor.setSelection(
        {line : selectedStartLine, ch : 0},
        {line : selectedEndLine, ch : editor.getLine(selectedEndLine).length});
  }

  toggleCode(editor: CodeMirror.Editor) {
    if (editor.getCursor("from").line == editor.getCursor("to").line) {
      this.toggleInlineCode(editor);
    } else {
      this.toggleCodeBlock(editor);
    }
  }
}
