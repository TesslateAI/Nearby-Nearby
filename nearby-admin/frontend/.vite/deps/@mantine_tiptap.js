import {
  index_default
} from "./chunk-7Q2UKGAI.js";
import {
  EditorContent
} from "./chunk-FQANTOJZ.js";
import "./chunk-ZZORJHGI.js";
import {
  ActionIcon,
  Box,
  Button,
  ColorPicker,
  ColorSwatch,
  Group,
  Popover,
  SimpleGrid,
  TextInput,
  Tooltip,
  Typography,
  UnstyledButton,
  createSafeContext,
  factory,
  rem,
  useProps,
  useResolvedStylesApi,
  useStyles
} from "./chunk-BTBELDQZ.js";
import "./chunk-HQ6ZTAWL.js";
import "./chunk-V2X5ZORR.js";
import {
  require_jsx_runtime
} from "./chunk-J3GJSMK3.js";
import {
  useDisclosure,
  useInputState,
  useWindowEvent
} from "./chunk-HQB7GKHE.js";
import {
  require_react
} from "./chunk-32E4H3EV.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/@mantine/tiptap/esm/extensions/Link.mjs
var Link = index_default.extend({
  addKeyboardShortcuts: () => ({
    "Mod-k": () => {
      window.dispatchEvent(new Event("edit-link"));
      return true;
    }
  })
}).configure({ openOnClick: false });

// node_modules/@mantine/tiptap/esm/RichTextEditor.module.css.mjs
var classes = { "root": "m_dd3f7539", "Typography": "m_f2016866", "content": "m_c2204cc2", "linkEditorDropdown": "m_8a991b4f", "control": "m_c2207da6", "controlIcon": "m_9cdfeb3f", "controlsGroup": "m_2ab47ef2", "linkEditor": "m_b67b711e", "linkEditorInput": "m_296cf94c", "linkEditorExternalControl": "m_cfef614", "linkEditorSave": "m_3b28e7bb", "toolbar": "m_4574a3c4", "taskList": "m_8b44009a" };

// node_modules/@mantine/tiptap/esm/extensions/TaskList.mjs
var getTaskListExtension = (TipTapTaskList) => TipTapTaskList.extend({
  addKeyboardShortcuts: () => ({
    "Mod-[": ({ editor }) => {
      editor.chain().focus().liftListItem("taskItem").run();
      return true;
    },
    "Mod-]": ({ editor }) => {
      editor.chain().focus().sinkListItem("taskItem").run();
      return true;
    }
  })
}).configure({
  HTMLAttributes: {
    class: `${classes.taskList} mantine-RichTextEditor-taskList`
  }
});

// node_modules/@mantine/tiptap/esm/RichTextEditor.mjs
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var import_react7 = __toESM(require_react(), 1);

// node_modules/@mantine/tiptap/esm/labels.mjs
var DEFAULT_LABELS = {
  // Controls labels
  linkControlLabel: "Link",
  colorPickerControlLabel: "Text color",
  highlightControlLabel: "Highlight text",
  colorControlLabel: (color) => `Set text color ${color}`,
  boldControlLabel: "Bold",
  italicControlLabel: "Italic",
  underlineControlLabel: "Underline",
  strikeControlLabel: "Strikethrough",
  clearFormattingControlLabel: "Clear formatting",
  unlinkControlLabel: "Remove link",
  bulletListControlLabel: "Bullet list",
  orderedListControlLabel: "Ordered list",
  sourceCodeControlLabel: "Switch between text/source code",
  h1ControlLabel: "Heading 1",
  h2ControlLabel: "Heading 2",
  h3ControlLabel: "Heading 3",
  h4ControlLabel: "Heading 4",
  h5ControlLabel: "Heading 5",
  h6ControlLabel: "Heading 6",
  blockquoteControlLabel: "Blockquote",
  alignLeftControlLabel: "Align text: left",
  alignCenterControlLabel: "Align text: center",
  alignRightControlLabel: "Align text: right",
  alignJustifyControlLabel: "Align text: justify",
  codeControlLabel: "Code",
  codeBlockControlLabel: "Code block",
  subscriptControlLabel: "Subscript",
  superscriptControlLabel: "Superscript",
  unsetColorControlLabel: "Unset color",
  hrControlLabel: "Horizontal line",
  undoControlLabel: "Undo",
  redoControlLabel: "Redo",
  // Task list
  tasksControlLabel: "Task list",
  tasksSinkLabel: "Decrease task level",
  tasksLiftLabel: "Increase task level",
  // Link editor
  linkEditorInputLabel: "Enter URL",
  linkEditorInputPlaceholder: "https://example.com/",
  linkEditorExternalLink: "Open link in a new tab",
  linkEditorInternalLink: "Open link in the same tab",
  linkEditorSave: "Save",
  // Color picker control
  colorPickerCancel: "Cancel",
  colorPickerClear: "Clear color",
  colorPickerColorPicker: "Color picker",
  colorPickerPalette: "Color palette",
  colorPickerSave: "Save",
  colorPickerColorLabel: (color) => `Set text color ${color}`
};

// node_modules/@mantine/tiptap/esm/RichTextEditor.context.mjs
var [RichTextEditorProvider, useRichTextEditorContext] = createSafeContext("RichTextEditor component was not found in tree");

// node_modules/@mantine/tiptap/esm/RichTextEditorContent/RichTextEditorContent.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var RichTextEditorContent = factory((_props, ref) => {
  const props = useProps("RichTextEditorContent", null, _props);
  const { classNames, className, style, styles, vars, ...others } = props;
  const ctx = useRichTextEditorContext();
  if (ctx.withTypographyStyles) {
    return (0, import_jsx_runtime.jsx)(
      Typography,
      {
        ...ctx.getStyles("Typography", { className, style, styles, classNames }),
        unstyled: ctx.unstyled,
        ref,
        children: (0, import_jsx_runtime.jsx)(
          Box,
          {
            component: EditorContent,
            editor: ctx.editor,
            ...ctx.getStyles("content", { classNames, styles }),
            ...others
          }
        )
      }
    );
  }
  return (0, import_jsx_runtime.jsx)(
    Box,
    {
      component: EditorContent,
      editor: ctx.editor,
      ...ctx.getStyles("content", { classNames, styles, className, style }),
      ...others
    }
  );
});
RichTextEditorContent.classes = classes;
RichTextEditorContent.displayName = "@mantine/tiptap/RichTextEditorContent";

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/controls.mjs
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);

// node_modules/@mantine/tiptap/esm/icons/Icons.mjs
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
function IconBase(props) {
  return (0, import_jsx_runtime2.jsx)(
    "svg",
    {
      ...props,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      strokeWidth: "1.5",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  );
}
function IconBold(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 5h6a3.5 3.5 0 0 1 0 7h-6z" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7" })
  ] });
}
function IconItalic(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 5l6 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 19l6 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M14 5l-4 14" })
  ] });
}
function IconUnderline(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 5v5a5 5 0 0 0 10 0v-5" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 19h14" })
  ] });
}
function IconStrikethrough(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 12l14 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M16 6.5a4 2 0 0 0 -4 -1.5h-1a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-1.5a4 2 0 0 1 -4 -1.5" })
  ] });
}
function IconClearFormatting(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 15l4 4m0 -4l-4 4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 6v-1h11v1" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 19l4 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M13 5l-4 14" })
  ] });
}
function IconH1(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M19 18v-8l-2 2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h2" })
  ] });
}
function IconH2(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 12a2 2 0 1 1 4 0c0 .591 -.417 1.318 -.816 1.858l-3.184 4.143l4 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h2" })
  ] });
}
function IconH3(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M19 14a2 2 0 1 0 -2 -2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 16a2 2 0 1 0 2 -2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h2" })
  ] });
}
function IconH4(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 18v-8l-4 6h5" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h2" })
  ] });
}
function IconH5(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 18h2a2 2 0 1 0 0 -4h-2v-4h4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h2" })
  ] });
}
function IconH6(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M19 14a2 2 0 1 0 0 4a2 2 0 0 0 0 -4z" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M21 12a2 2 0 1 0 -4 0v4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6v12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 18h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h2" })
  ] });
}
function IconList(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 6l11 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 12l11 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 18l11 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 6l0 .01" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 12l0 .01" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 18l0 .01" })
  ] });
}
function IconListNumbers(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6h9" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 12h9" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 18h8" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M6 10v-6l-2 2" })
  ] });
}
function IconUnlink(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 22v-2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 15l6 -6" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 17h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M2 7h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 2v2" })
  ] });
}
function IconBlockquote(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M6 15h15" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M21 19h-15" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M15 11h6" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M21 7h-6" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 9h1a1 1 0 1 1 -1 1v-2.5a2 2 0 0 1 2 -2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 9h1a1 1 0 1 1 -1 1v-2.5a2 2 0 0 1 2 -2" })
  ] });
}
function IconAlignLeft(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6l16 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12l10 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 18l14 0" })
  ] });
}
function IconAlignRight(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6l16 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M10 12l10 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M6 18l14 0" })
  ] });
}
function IconAlignCenter(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6l16 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M8 12l8 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M6 18l12 0" })
  ] });
}
function IconAlignJustified(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 6l16 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 12l16 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 18l12 0" })
  ] });
}
function IconSubscript(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 7l8 10m-8 0l8 -10" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M21 20h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2" })
  ] });
}
function IconSuperscript(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 7l8 10m-8 0l8 -10" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M21 11h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2" })
  ] });
}
function IconCode(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M7 8l-4 4l4 4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 8l4 4l-4 4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M14 4l-4 16" })
  ] });
}
function IconHighlight(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 19h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12.5 5.5l4 4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4.5 13.5l4 4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M21 15v4h-8l4 -4z" })
  ] });
}
function IconLineDashed(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 12h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M17 12h2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 12h2" })
  ] });
}
function IconCircleOff(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20.042 16.045a9 9 0 0 0 -12.087 -12.087m-2.318 1.677a9 9 0 1 0 12.725 12.73" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3 3l18 18" })
  ] });
}
function IconColorPicker(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 7l6 6" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 16l11.7 -11.7a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4l-11.7 11.7h-4v-4z" })
  ] });
}
function IconX(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M18 6l-12 12" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M6 6l12 12" })
  ] });
}
function IconPalette(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" })
  ] });
}
function IconCheck(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 12l5 5l10 -10" })
  ] });
}
function IconLink(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 15l6 -6" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" })
  ] });
}
function IconExternalLink(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 13l9 -9" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M15 4h5v5" })
  ] });
}
function IconArrowBackUp(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M9 14l-4 -4l4 -4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M5 10h11a4 4 0 1 1 0 8h-1" })
  ] });
}
function IconArrowForwardUp(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M15 14l4 -4l-4 -4" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M19 10h-11a4 4 0 1 0 0 8h1" })
  ] });
}
function IconListCheck(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3.5 5.5l1.5 1.5l2.5 -2.5" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3.5 11.5l1.5 1.5l2.5 -2.5" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M3.5 17.5l1.5 1.5l2.5 -2.5" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 6l9 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 12l9 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M11 18l9 0" })
  ] });
}
function IconIndentIncrease(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 6l-11 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 12l-7 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 18l-11 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M4 8l4 4l-4 4" })
  ] });
}
function IconIndentDecrease(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 6l-7 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 12l-9 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M20 18l-7 0" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M8 8l-4 4l4 4" })
  ] });
}
function IconBraces(props) {
  return (0, import_jsx_runtime2.jsxs)(IconBase, { ...props, children: [
    (0, import_jsx_runtime2.jsx)("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
    (0, import_jsx_runtime2.jsx)(
      "path",
      {
        d: "M19 3v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914\n           a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18\n           a1 1 0 0 1 1 1Z"
      }
    ),
    (0, import_jsx_runtime2.jsx)("path", { d: "M10 11l-2 2 2 2" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M14 11l2 2-2 2" })
  ] });
}

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/RichTextEditorControl.mjs
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var import_react2 = __toESM(require_react(), 1);
var defaultProps = {
  interactive: true
};
var RichTextEditorControl = factory((_props, ref) => {
  const props = useProps("RichTextEditorControl", defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    vars,
    interactive,
    active,
    onMouseDown,
    disabled,
    ...others
  } = props;
  const ctx = useRichTextEditorContext();
  return (0, import_jsx_runtime3.jsx)(
    UnstyledButton,
    {
      ...others,
      ...ctx.getStyles("control", { className, style, classNames, styles }),
      disabled,
      "data-rich-text-editor-control": true,
      tabIndex: interactive ? 0 : -1,
      "data-interactive": interactive || void 0,
      "data-disabled": disabled || void 0,
      "data-active": active || void 0,
      "aria-pressed": active && interactive || void 0,
      "aria-hidden": !interactive || void 0,
      ref,
      unstyled: ctx.unstyled,
      variant: ctx.variant || "default",
      onMouseDown: (event) => {
        event.preventDefault();
        onMouseDown == null ? void 0 : onMouseDown(event);
      }
    }
  );
});
RichTextEditorControl.classes = classes;
RichTextEditorControl.displayName = "@mantine/tiptap/RichTextEditorControl";
var RichTextEditorControlBase = (0, import_react2.forwardRef)(({ className, icon: Icon, ...others }, ref) => {
  const ctx = useRichTextEditorContext();
  return (0, import_jsx_runtime3.jsx)(RichTextEditorControl, { ref, ...others, children: (0, import_jsx_runtime3.jsx)(Icon, { ...ctx.getStyles("controlIcon") }) });
});
RichTextEditorControlBase.displayName = "@mantine/tiptap/RichTextEditorControlBase";
function createControl({
  label,
  isActive,
  operation,
  icon,
  isDisabled
}) {
  const Control = (0, import_react2.forwardRef)((props, ref) => {
    const { editor, labels } = useRichTextEditorContext();
    const _label = labels[label];
    return (0, import_jsx_runtime3.jsx)(
      RichTextEditorControlBase,
      {
        "aria-label": _label,
        title: _label,
        active: (isActive == null ? void 0 : isActive.name) ? editor == null ? void 0 : editor.isActive(isActive.name, isActive.attributes) : false,
        ref,
        onClick: () => editor == null ? void 0 : editor.chain().focus()[operation.name](operation.attributes).run(),
        icon: props.icon || icon,
        disabled: (isDisabled == null ? void 0 : isDisabled(editor)) || false,
        ...props
      }
    );
  });
  Control.displayName = `@mantine/tiptap/${label}`;
  return Control;
}

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/controls.mjs
var BoldControl = createControl({
  label: "boldControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconBold, { ...props }),
  isActive: { name: "bold" },
  operation: { name: "toggleBold" }
});
var ItalicControl = createControl({
  label: "italicControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconItalic, { ...props }),
  isActive: { name: "italic" },
  operation: { name: "toggleItalic" }
});
var UnderlineControl = createControl({
  label: "underlineControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconUnderline, { ...props }),
  isActive: { name: "underline" },
  operation: { name: "toggleUnderline" }
});
var StrikeThroughControl = createControl({
  label: "strikeControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconStrikethrough, { ...props }),
  isActive: { name: "strike" },
  operation: { name: "toggleStrike" }
});
var ClearFormattingControl = createControl({
  label: "clearFormattingControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconClearFormatting, { ...props }),
  operation: { name: "unsetAllMarks" }
});
var UnlinkControl = createControl({
  label: "unlinkControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconUnlink, { ...props }),
  operation: { name: "unsetLink" }
});
var BulletListControl = createControl({
  label: "bulletListControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconList, { ...props }),
  isActive: { name: "bulletList" },
  operation: { name: "toggleBulletList" }
});
var OrderedListControl = createControl({
  label: "orderedListControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconListNumbers, { ...props }),
  isActive: { name: "orderedList" },
  operation: { name: "toggleOrderedList" }
});
var H1Control = createControl({
  label: "h1ControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconH1, { ...props }),
  isActive: { name: "heading", attributes: { level: 1 } },
  operation: { name: "toggleHeading", attributes: { level: 1 } }
});
var H2Control = createControl({
  label: "h2ControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconH2, { ...props }),
  isActive: { name: "heading", attributes: { level: 2 } },
  operation: { name: "toggleHeading", attributes: { level: 2 } }
});
var H3Control = createControl({
  label: "h3ControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconH3, { ...props }),
  isActive: { name: "heading", attributes: { level: 3 } },
  operation: { name: "toggleHeading", attributes: { level: 3 } }
});
var H4Control = createControl({
  label: "h4ControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconH4, { ...props }),
  isActive: { name: "heading", attributes: { level: 4 } },
  operation: { name: "toggleHeading", attributes: { level: 4 } }
});
var H5Control = createControl({
  label: "h5ControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconH5, { ...props }),
  isActive: { name: "heading", attributes: { level: 5 } },
  operation: { name: "toggleHeading", attributes: { level: 5 } }
});
var H6Control = createControl({
  label: "h6ControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconH6, { ...props }),
  isActive: { name: "heading", attributes: { level: 6 } },
  operation: { name: "toggleHeading", attributes: { level: 6 } }
});
var BlockquoteControl = createControl({
  label: "blockquoteControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconBlockquote, { ...props }),
  isActive: { name: "blockquote" },
  operation: { name: "toggleBlockquote" }
});
var AlignLeftControl = createControl({
  label: "alignLeftControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconAlignLeft, { ...props }),
  operation: { name: "setTextAlign", attributes: "left" }
});
var AlignRightControl = createControl({
  label: "alignRightControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconAlignRight, { ...props }),
  operation: { name: "setTextAlign", attributes: "right" }
});
var AlignCenterControl = createControl({
  label: "alignCenterControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconAlignCenter, { ...props }),
  operation: { name: "setTextAlign", attributes: "center" }
});
var AlignJustifyControl = createControl({
  label: "alignJustifyControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconAlignJustified, { ...props }),
  operation: { name: "setTextAlign", attributes: "justify" }
});
var SubscriptControl = createControl({
  label: "subscriptControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconSubscript, { ...props }),
  isActive: { name: "subscript" },
  operation: { name: "toggleSubscript" }
});
var SuperscriptControl = createControl({
  label: "superscriptControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconSuperscript, { ...props }),
  isActive: { name: "superscript" },
  operation: { name: "toggleSuperscript" }
});
var CodeControl = createControl({
  label: "codeControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconCode, { ...props }),
  isActive: { name: "code" },
  operation: { name: "toggleCode" }
});
var CodeBlockControl = createControl({
  label: "codeBlockControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconCode, { ...props }),
  isActive: { name: "codeBlock" },
  operation: { name: "toggleCodeBlock" }
});
var HighlightControl = createControl({
  label: "highlightControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconHighlight, { ...props }),
  isActive: { name: "highlight" },
  operation: { name: "toggleHighlight" }
});
var HrControl = createControl({
  label: "hrControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconLineDashed, { ...props }),
  operation: { name: "setHorizontalRule" }
});
var UnsetColorControl = createControl({
  label: "unsetColorControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconCircleOff, { ...props }),
  operation: { name: "unsetColor" }
});
var UndoControl = createControl({
  label: "undoControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconArrowBackUp, { ...props }),
  isDisabled: (editor) => !(editor == null ? void 0 : editor.can().undo()),
  operation: { name: "undo" }
});
var RedoControl = createControl({
  label: "redoControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconArrowForwardUp, { ...props }),
  isDisabled: (editor) => !(editor == null ? void 0 : editor.can().redo()),
  operation: { name: "redo" }
});
var TaskListControl = createControl({
  label: "tasksControlLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconListCheck, { ...props }),
  isActive: { name: "taskList" },
  operation: { name: "toggleTaskList" }
});
var TaskListSinkControl = createControl({
  label: "tasksSinkLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconIndentIncrease, { ...props }),
  operation: { name: "sinkListItem", attributes: "taskItem" },
  isDisabled: (editor) => !(editor == null ? void 0 : editor.can().sinkListItem("taskItem"))
});
var TaskListLiftControl = createControl({
  label: "tasksLiftLabel",
  icon: (props) => (0, import_jsx_runtime4.jsx)(IconIndentDecrease, { ...props }),
  operation: { name: "liftListItem", attributes: "taskItem" },
  isDisabled: (editor) => !(editor == null ? void 0 : editor.can().liftListItem("taskItem"))
});

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/RichTextEditorLinkControl.mjs
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var import_react3 = __toESM(require_react(), 1);
var LinkIcon = (props) => (0, import_jsx_runtime5.jsx)(IconLink, { ...props });
var RichTextEditorLinkControl = factory(
  (_props, ref) => {
    var _a;
    const props = useProps("RichTextEditorLinkControl", null, _props);
    const {
      classNames,
      className,
      style,
      styles,
      vars,
      icon,
      popoverProps,
      disableTooltips,
      initialExternal,
      ...others
    } = props;
    const ctx = useRichTextEditorContext();
    const stylesApiProps = { classNames, styles };
    const [url, setUrl] = useInputState("");
    const [external, setExternal] = (0, import_react3.useState)(initialExternal);
    const [opened, { open, close }] = useDisclosure(false);
    const handleOpen = () => {
      var _a2;
      open();
      const linkData = (_a2 = ctx.editor) == null ? void 0 : _a2.getAttributes("link");
      setUrl((linkData == null ? void 0 : linkData.href) || "");
      setExternal((linkData == null ? void 0 : linkData.href) ? (linkData == null ? void 0 : linkData.target) === "_blank" : initialExternal);
    };
    const handleClose = () => {
      close();
      setUrl("");
      setExternal(initialExternal);
    };
    const setLink = () => {
      var _a2, _b;
      handleClose();
      url === "" ? (_a2 = ctx.editor) == null ? void 0 : _a2.chain().focus().extendMarkRange("link").unsetLink().run() : (_b = ctx.editor) == null ? void 0 : _b.chain().focus().extendMarkRange("link").setLink({ href: url, target: external ? "_blank" : null }).run();
    };
    const handleInputKeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setLink();
      }
    };
    useWindowEvent("edit-link", handleOpen, false);
    const { resolvedClassNames, resolvedStyles } = useResolvedStylesApi({ classNames, styles, props });
    return (0, import_jsx_runtime5.jsxs)(
      Popover,
      {
        trapFocus: true,
        shadow: "md",
        withinPortal: true,
        opened,
        onChange: (_opened) => !_opened && handleClose(),
        offset: -44,
        zIndex: 1e4,
        ...popoverProps,
        children: [
          (0, import_jsx_runtime5.jsx)(Popover.Target, { children: (0, import_jsx_runtime5.jsx)(
            RichTextEditorControlBase,
            {
              icon: icon || LinkIcon,
              ...others,
              "aria-label": ctx.labels.linkControlLabel,
              title: ctx.labels.linkControlLabel,
              onClick: handleOpen,
              active: (_a = ctx.editor) == null ? void 0 : _a.isActive("link"),
              ref,
              classNames: resolvedClassNames,
              styles: resolvedStyles,
              className,
              style,
              variant: ctx.variant
            }
          ) }),
          (0, import_jsx_runtime5.jsx)(Popover.Dropdown, { ...ctx.getStyles("linkEditorDropdown", stylesApiProps), children: (0, import_jsx_runtime5.jsxs)("div", { ...ctx.getStyles("linkEditor", stylesApiProps), children: [
            (0, import_jsx_runtime5.jsx)(
              TextInput,
              {
                placeholder: ctx.labels.linkEditorInputPlaceholder,
                "aria-label": ctx.labels.linkEditorInputLabel,
                type: "url",
                value: url,
                onChange: setUrl,
                classNames: { input: ctx.getStyles("linkEditorInput", stylesApiProps).className },
                onKeyDown: handleInputKeydown,
                rightSection: (0, import_jsx_runtime5.jsx)(
                  Tooltip,
                  {
                    label: external ? ctx.labels.linkEditorExternalLink : ctx.labels.linkEditorInternalLink,
                    events: { hover: true, focus: true, touch: true },
                    withinPortal: true,
                    withArrow: true,
                    disabled: disableTooltips,
                    zIndex: 1e4,
                    children: (0, import_jsx_runtime5.jsx)(
                      UnstyledButton,
                      {
                        onClick: () => setExternal((e) => !e),
                        "data-active": external || void 0,
                        ...ctx.getStyles("linkEditorExternalControl", stylesApiProps),
                        children: (0, import_jsx_runtime5.jsx)(IconExternalLink, { style: { width: rem(14), height: rem(14) } })
                      }
                    )
                  }
                )
              }
            ),
            (0, import_jsx_runtime5.jsx)(
              Button,
              {
                variant: "default",
                onClick: setLink,
                ...ctx.getStyles("linkEditorSave", stylesApiProps),
                children: ctx.labels.linkEditorSave
              }
            )
          ] }) })
        ]
      }
    );
  }
);
RichTextEditorLinkControl.classes = classes;
RichTextEditorLinkControl.displayName = "@mantine/tiptap/RichTextEditorLinkControl";

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/RichTextEditorColorPickerControl.mjs
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var import_react4 = __toESM(require_react(), 1);
var RichTextEditorColorPickerControl = (0, import_react4.forwardRef)((props, ref) => {
  const { popoverProps, colors, colorPickerProps, ...others } = useProps(
    "RichTextEditorColorPickerControl",
    null,
    props
  );
  const { editor, labels, getStyles, variant } = useRichTextEditorContext();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [state, setState] = (0, import_react4.useState)("palette");
  const currentColor = (editor == null ? void 0 : editor.getAttributes("textStyle").color) || "var(--mantine-color-text)";
  const handleChange = (value, shouldClose = true) => {
    (editor == null ? void 0 : editor.chain()).focus().setColor(value).run();
    shouldClose && close();
  };
  const handleClear = () => {
    (editor == null ? void 0 : editor.chain()).focus().unsetColor().run();
    close();
  };
  const controls = colors.map((color, index) => (0, import_jsx_runtime6.jsx)(
    ColorSwatch,
    {
      component: "button",
      color,
      onClick: () => handleChange(color),
      size: 26,
      radius: "xs",
      style: { cursor: "pointer" },
      title: labels.colorPickerColorLabel(color),
      "aria-label": labels.colorPickerColorLabel(color)
    },
    index
  ));
  return (0, import_jsx_runtime6.jsxs)(
    Popover,
    {
      opened,
      withinPortal: true,
      trapFocus: true,
      onChange: (_opened) => !_opened && close(),
      ...popoverProps,
      children: [
        (0, import_jsx_runtime6.jsx)(Popover.Target, { children: (0, import_jsx_runtime6.jsx)(
          RichTextEditorControl,
          {
            ...others,
            variant,
            "aria-label": labels.colorPickerControlLabel,
            title: labels.colorPickerControlLabel,
            ref,
            onClick: toggle,
            children: (0, import_jsx_runtime6.jsx)(ColorSwatch, { color: currentColor, size: 14 })
          }
        ) }),
        (0, import_jsx_runtime6.jsxs)(Popover.Dropdown, { ...getStyles("linkEditorDropdown"), children: [
          state === "palette" && (0, import_jsx_runtime6.jsx)(SimpleGrid, { cols: 7, spacing: 2, children: controls }),
          state === "colorPicker" && (0, import_jsx_runtime6.jsx)(
            ColorPicker,
            {
              defaultValue: currentColor,
              onChange: (value) => handleChange(value, false),
              ...colorPickerProps
            }
          ),
          (0, import_jsx_runtime6.jsx)(Tooltip.Group, { closeDelay: 200, children: (0, import_jsx_runtime6.jsxs)(Group, { justify: "flex-end", gap: "xs", mt: "sm", children: [
            state === "palette" && (0, import_jsx_runtime6.jsx)(
              ActionIcon,
              {
                variant: "default",
                onClick: close,
                title: labels.colorPickerCancel,
                "aria-label": labels.colorPickerCancel,
                children: (0, import_jsx_runtime6.jsx)(IconX, { style: { width: rem(16), height: rem(16) } })
              }
            ),
            (0, import_jsx_runtime6.jsx)(
              ActionIcon,
              {
                variant: "default",
                onClick: handleClear,
                title: labels.colorPickerClear,
                "aria-label": labels.colorPickerClear,
                children: (0, import_jsx_runtime6.jsx)(IconCircleOff, { style: { width: rem(16), height: rem(16) } })
              }
            ),
            state === "palette" ? (0, import_jsx_runtime6.jsx)(
              ActionIcon,
              {
                variant: "default",
                onClick: () => setState("colorPicker"),
                title: labels.colorPickerColorPicker,
                "aria-label": labels.colorPickerColorPicker,
                children: (0, import_jsx_runtime6.jsx)(IconColorPicker, { style: { width: rem(16), height: rem(16) } })
              }
            ) : (0, import_jsx_runtime6.jsx)(
              ActionIcon,
              {
                variant: "default",
                onClick: () => setState("palette"),
                "aria-label": labels.colorPickerPalette,
                title: labels.colorPickerPalette,
                children: (0, import_jsx_runtime6.jsx)(IconPalette, { style: { width: rem(16), height: rem(16) } })
              }
            ),
            state === "colorPicker" && (0, import_jsx_runtime6.jsx)(
              ActionIcon,
              {
                variant: "default",
                onClick: close,
                title: labels.colorPickerSave,
                "aria-label": labels.colorPickerSave,
                children: (0, import_jsx_runtime6.jsx)(IconCheck, { style: { width: rem(16), height: rem(16) } })
              }
            )
          ] }) })
        ] })
      ]
    }
  );
});
RichTextEditorColorPickerControl.displayName = "@mantine/tiptap/ColorPickerControl";

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/RichTextEditorColorControl.mjs
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var import_react5 = __toESM(require_react(), 1);
var RichTextEditorColorControl = (0, import_react5.forwardRef)((props, ref) => {
  const { color, ...others } = useProps("RichTextEditorColorControl", null, props);
  const { editor, labels, variant } = useRichTextEditorContext();
  const currentColor = (editor == null ? void 0 : editor.getAttributes("textStyle").color) || null;
  const label = labels.colorControlLabel(color);
  return (0, import_jsx_runtime7.jsx)(
    RichTextEditorControl,
    {
      ...others,
      variant,
      active: currentColor === color,
      "aria-label": label,
      title: label,
      onClick: () => (editor == null ? void 0 : editor.chain()).focus().setColor(color).run(),
      ref,
      children: (0, import_jsx_runtime7.jsx)(ColorSwatch, { color, size: 14 })
    }
  );
});
RichTextEditorColorControl.displayName = "@mantine/tiptap/RichTextEditorColorControl";

// node_modules/@mantine/tiptap/esm/RichTextEditorControl/RichTextEditorSourceCodeControl.mjs
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var import_react6 = __toESM(require_react(), 1);
var defaultProps2 = {};
var RichTextEditorSourceCodeControl = (0, import_react6.forwardRef)((props, ref) => {
  const { ...others } = useProps("RichTextEditorSourceCodeControl", defaultProps2, props);
  const { editor, labels, variant, onSourceCodeTextSwitch } = useRichTextEditorContext();
  const [isSourceCodeModeActive, setIsSourceCodeModeActive] = (0, import_react6.useState)(false);
  const handleStateChange = () => {
    if (isSourceCodeModeActive) {
      editor == null ? void 0 : editor.commands.setContent(editor.getText(), { emitUpdate: true });
    } else {
      editor == null ? void 0 : editor.commands.setContent(`<textarea>${editor.getHTML()}</textarea>`);
    }
    const isSourceCodeModeActiveNew = !isSourceCodeModeActive;
    setIsSourceCodeModeActive(isSourceCodeModeActiveNew);
    onSourceCodeTextSwitch == null ? void 0 : onSourceCodeTextSwitch(isSourceCodeModeActiveNew);
  };
  return (0, import_jsx_runtime8.jsx)(
    RichTextEditorControl,
    {
      ...others,
      variant,
      active: isSourceCodeModeActive,
      "aria-label": labels.sourceCodeControlLabel,
      title: labels.sourceCodeControlLabel,
      onClick: () => handleStateChange(),
      ref,
      children: (0, import_jsx_runtime8.jsx)(IconBraces, { style: { width: rem(16), height: rem(16) } })
    }
  );
});
RichTextEditorSourceCodeControl.displayName = "@mantine/tiptap/RichTextEditorSourceCodeControl";

// node_modules/@mantine/tiptap/esm/RichTextEditorControlsGroup/RichTextEditorControlsGroup.mjs
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var RichTextEditorControlsGroup = factory(
  (_props, ref) => {
    const props = useProps("RichTextEditorControlsGroup", null, _props);
    const { classNames, className, style, styles, vars, variant, ...others } = props;
    const ctx = useRichTextEditorContext();
    return (0, import_jsx_runtime9.jsx)(
      Box,
      {
        ref,
        variant: variant || ctx.variant,
        ...ctx.getStyles("controlsGroup", { className, style, styles, classNames }),
        ...others
      }
    );
  }
);
RichTextEditorControlsGroup.classes = classes;
RichTextEditorControlsGroup.displayName = "@mantine/tiptap/RichTextEditorControlsGroup";

// node_modules/@mantine/tiptap/esm/RichTextEditorToolbar/RichTextEditorToolbar.mjs
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var RichTextEditorToolbar = factory((_props, ref) => {
  const props = useProps("RichTextEditorToolbar", null, _props);
  const {
    classNames,
    className,
    style,
    styles,
    vars,
    sticky,
    stickyOffset,
    mod,
    variant,
    ...others
  } = props;
  const ctx = useRichTextEditorContext();
  return (0, import_jsx_runtime10.jsx)(
    Box,
    {
      ref,
      mod: [{ sticky }, mod],
      variant: variant || ctx.variant,
      ...ctx.getStyles("toolbar", { className, style, styles, classNames }),
      ...others,
      __vars: { "--rte-sticky-offset": rem(stickyOffset) }
    }
  );
});
RichTextEditorToolbar.classes = classes;
RichTextEditorToolbar.displayName = "@mantine/tiptap/RichTextEditorToolbar";

// node_modules/@mantine/tiptap/esm/RichTextEditor.mjs
var defaultProps3 = {
  withCodeHighlightStyles: true,
  withTypographyStyles: true,
  variant: "default"
};
var RichTextEditor = factory((_props, ref) => {
  const props = useProps("RichTextEditor", defaultProps3, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    vars,
    editor,
    withCodeHighlightStyles,
    withTypographyStyles,
    onSourceCodeTextSwitch,
    labels,
    children,
    variant,
    attributes,
    ...others
  } = props;
  const getStyles = useStyles({
    name: "RichTextEditor",
    classes,
    props,
    className,
    style,
    classNames,
    styles,
    unstyled,
    attributes,
    vars
  });
  const mergedLabels = (0, import_react7.useMemo)(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  return (0, import_jsx_runtime11.jsx)(
    RichTextEditorProvider,
    {
      value: {
        editor,
        getStyles,
        labels: mergedLabels,
        withCodeHighlightStyles,
        withTypographyStyles,
        onSourceCodeTextSwitch,
        unstyled,
        variant
      },
      children: (0, import_jsx_runtime11.jsx)(Box, { ...getStyles("root"), ...others, ref, children })
    }
  );
});
RichTextEditor.classes = classes;
RichTextEditor.displayName = "@mantine/tiptap/RichTextEditor";
RichTextEditor.Content = RichTextEditorContent;
RichTextEditor.Control = RichTextEditorControl;
RichTextEditor.Toolbar = RichTextEditorToolbar;
RichTextEditor.ControlsGroup = RichTextEditorControlsGroup;
RichTextEditor.Bold = BoldControl;
RichTextEditor.Italic = ItalicControl;
RichTextEditor.Strikethrough = StrikeThroughControl;
RichTextEditor.Underline = UnderlineControl;
RichTextEditor.ClearFormatting = ClearFormattingControl;
RichTextEditor.H1 = H1Control;
RichTextEditor.H2 = H2Control;
RichTextEditor.H3 = H3Control;
RichTextEditor.H4 = H4Control;
RichTextEditor.H5 = H5Control;
RichTextEditor.H6 = H6Control;
RichTextEditor.BulletList = BulletListControl;
RichTextEditor.OrderedList = OrderedListControl;
RichTextEditor.Link = RichTextEditorLinkControl;
RichTextEditor.Unlink = UnlinkControl;
RichTextEditor.Blockquote = BlockquoteControl;
RichTextEditor.AlignLeft = AlignLeftControl;
RichTextEditor.AlignRight = AlignRightControl;
RichTextEditor.AlignCenter = AlignCenterControl;
RichTextEditor.AlignJustify = AlignJustifyControl;
RichTextEditor.Superscript = SuperscriptControl;
RichTextEditor.Subscript = SubscriptControl;
RichTextEditor.Code = CodeControl;
RichTextEditor.CodeBlock = CodeBlockControl;
RichTextEditor.ColorPicker = RichTextEditorColorPickerControl;
RichTextEditor.Color = RichTextEditorColorControl;
RichTextEditor.Highlight = HighlightControl;
RichTextEditor.Hr = HrControl;
RichTextEditor.UnsetColor = UnsetColorControl;
RichTextEditor.Undo = UndoControl;
RichTextEditor.Redo = RedoControl;
RichTextEditor.TaskList = TaskListControl;
RichTextEditor.TaskListSink = TaskListSinkControl;
RichTextEditor.TaskListLift = TaskListLiftControl;
RichTextEditor.SourceCode = RichTextEditorSourceCodeControl;
export {
  AlignCenterControl,
  AlignJustifyControl,
  AlignLeftControl,
  AlignRightControl,
  BlockquoteControl,
  BoldControl,
  BulletListControl,
  ClearFormattingControl,
  CodeBlockControl,
  CodeControl,
  DEFAULT_LABELS,
  H1Control,
  H2Control,
  H3Control,
  H4Control,
  H5Control,
  H6Control,
  HighlightControl,
  HrControl,
  ItalicControl,
  Link,
  OrderedListControl,
  RedoControl,
  RichTextEditor,
  RichTextEditorColorControl,
  RichTextEditorColorPickerControl,
  RichTextEditorContent,
  RichTextEditorControl,
  RichTextEditorControlsGroup,
  RichTextEditorLinkControl,
  RichTextEditorSourceCodeControl,
  StrikeThroughControl,
  SubscriptControl,
  SuperscriptControl,
  TaskListControl,
  TaskListLiftControl,
  TaskListSinkControl,
  UnderlineControl,
  UndoControl,
  UnlinkControl,
  UnsetColorControl,
  getTaskListExtension,
  useRichTextEditorContext
};
//# sourceMappingURL=@mantine_tiptap.js.map
