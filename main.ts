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
      var cursorStart = editor.getCursor("from");
      var cursorEnd = editor.getCursor("to");
      var content = editor.getRange(cursorStart, cursorEnd);
      return {
        start : cursorStart,
        end : cursorEnd,
        content : content,
      };
    }
  }

  toggleCodeBlock(editor: CodeMirror.Editor) {
    let selectedText = this.getSelectedText(editor);
    let content = selectedText.content;
    let selectedStartLine = selectedText.start.line;
    let selectedEndLine = selectedText.end.line;
    let codeBlockMatch = content.match(/^```\n([\s\S]*)\n```$/);
    let replacement = '';

    if (codeBlockMatch) {
      replacement = codeBlockMatch[1];
      selectedEndLine -= 2;
    } else {
      replacement = '```\n' + selectedText.content + '\n```';
      selectedEndLine += 2;
      if (selectedText.start.ch > 0) {
        replacement = '\n' + replacement;
        selectedStartLine += 1;
      }
      if (selectedText.end.ch < editor.getLine(selectedText.end.line).length) {
        replacement += '\n';
        selectedEndLine += 1;
      }
    }

    editor.replaceRange(replacement, selectedText.start, selectedText.end);
    editor.setSelection(
        {line : selectedStartLine, ch : 0},
        {line : selectedEndLine, ch : editor.getLine(selectedEndLine).length});
  }

  toggleInlineCode(editor: CodeMirror.Editor) {
    let selectedText = this.getSelectedText(editor);
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
    editor.setSelection(
        selectedText.start,
        {line : selectedText.end.line, ch : selectedText.end.ch + ch_diff});
  }

  toggleCode(editor: CodeMirror.Editor) {
    // TODO: Code block if multiple lines selected or nothing selected.
    let selectedText = this.getSelectedText(editor);
    if (!selectedText) {
      return;
    }
    if (selectedText.content.match(/\n/)) {
      this.toggleCodeBlock(editor);
    } else {
      this.toggleInlineCode(editor);
    }
  };
}
