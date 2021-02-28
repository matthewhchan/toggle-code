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

  getReplacement(text: string) {
    if (text.length >= 2 && text[0] == '`' && text[text.length - 1] == '`') {
      return text.substring(1, text.length - 1);
    }
    return '`' + text + '`';
  }

  toggleCode(editor: CodeMirror.Editor) {
    // TODO: Code block if multiple lines selected or nothing selected.
    let selectedText = this.getSelectedText(editor);
    if (!selectedText) {
      return;
    }
    let newString = this.getReplacement(selectedText.content);
    editor.replaceRange(newString, selectedText.start, selectedText.end);
    let ch_diff = newString.length - selectedText.content.length;
    editor.setSelection(
        selectedText.start,
        {line : selectedText.end.line, ch : selectedText.end.ch + ch_diff});
  };
}
