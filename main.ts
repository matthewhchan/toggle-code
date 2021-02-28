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

  toggleCode(editor: CodeMirror.Editor) {
    // TODO: Toggle off inline code.
    // TODO: Code block if multiple lines selected or nothing selected.
    let selectedText = this.getSelectedText(editor);
    if (!selectedText) {
      return;
    }
    let newString = '`' + selectedText.content + '`';
    editor.replaceRange(newString, selectedText.start, selectedText.end);
    editor.setSelection(
        selectedText.start,
        {line : selectedText.end.line, ch : selectedText.end.ch + 2});
  };
}
