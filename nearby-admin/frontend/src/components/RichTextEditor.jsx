import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import DOMPurify from 'dompurify';
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { Text, Box, Button, Group, Tooltip, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useDebouncedCallback } from '@mantine/hooks';

const CustomRichTextEditor = forwardRef(({
  value = '',
  onChange,
  placeholder,
  label,
  description,
  error,
  minRows = 3,
  maxLength,
  showCharCount = false,
  disabled = false,
  withAsterisk = false,
  ...props
}, ref) => {
  const isInitialMount = useRef(true);

  // Memoize extensions to prevent recreation on every render
  const extensions = useMemo(() => [
    StarterKit.configure({
      link: false,
      underline: false,
    }),
    Underline,
    LinkExtension.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      protocols: ['http', 'https', 'mailto'],
      validate: href => /^https?:\/\//.test(href) || /^mailto:/.test(href),
    }),
    CharacterCount.configure({}),
  ], [maxLength]);

  // Debounced onChange - only updates form state after user stops typing
  const debouncedOnChange = useDebouncedCallback((html) => {
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
    onChange?.(sanitizedHtml);
  }, 300);

  const editor = useEditor({
    extensions,
    content: value || '',
    onUpdate: ({ editor }) => {
      // Editor updates freely, debounced callback syncs to form
      debouncedOnChange(editor.getHTML());
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        style: 'height: 96px !important; max-height: 96px !important; overflow-y: auto !important;'
      },
      handlePaste: maxLength ? (view, event, slice) => {
        const currentLength = view.state.doc.textContent.length;
        const pastedText = slice.content.textBetween(0, slice.content.size, ' ');
        const remaining = maxLength - currentLength;
        if (remaining <= 0) {
          return true; // block paste if already at limit
        }
        if (pastedText.length > remaining) {
          // Truncate pasted text to fit
          const truncated = pastedText.substring(0, remaining);
          view.dispatch(view.state.tr.insertText(truncated));
          return true; // handled
        }
        return false; // let TipTap handle normally
      } : undefined
    }
  });

  // Only sync external changes (like loading from server), not from typing
  useEffect(() => {
    if (!editor || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentContent = editor.getHTML();
    if (value && value !== currentContent) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const currentLength = editor?.storage?.characterCount?.characters() || 0;
  const isOverLimit = maxLength && currentLength > maxLength;

  return (
    <Box ref={ref}>
      {/* Label */}
      {label && (
        <Text
          component="label"
          size="sm"
          fw={500}
          mb={2}
          style={{ display: 'block' }}
        >
          {label}
          {withAsterisk && (
            <Text component="span" c="red" ml={4}>
              *
            </Text>
          )}
        </Text>
      )}

      <RichTextEditor
        editor={editor}
        styles={{
          root: {
            border: error ? '1px solid var(--mantine-color-error)' : '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
            height: '128px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          },
          toolbar: {
            border: 'none',
            borderBottom: '1px solid var(--mantine-color-default-border)',
            borderRadius: 0,
            height: '40px',
            minHeight: '40px',
            maxHeight: '40px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--mantine-color-gray-0)',
            flex: 'none'
          },
          content: {
            border: 'none',
            height: '96px !important',
            maxHeight: '96px !important',
            minHeight: '96px !important',
            overflow: 'hidden',
            flex: '1',
            position: 'relative',
            '& .ProseMirror': {
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              height: '96px !important',
              maxHeight: '96px !important',
              minHeight: '96px !important',
              overflowY: 'auto !important',
              overflowX: 'hidden !important',
              padding: '12px',
              outline: 'none',
              fontSize: '14px',
              border: 'none',
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--mantine-color-body)',
              resize: 'none',
              boxSizing: 'border-box',
              '&:focus': {
                outline: 'none'
              }
            }
          }
        }}
        {...props}
      >
        <div style={{
          height: '32px',
          padding: '4px 8px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          backgroundColor: 'var(--mantine-color-gray-0)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {/* Heading Dropdown */}
          <Menu shadow="md" width={120}>
            <Menu.Target>
              <Button
                size="compact-xs"
                variant="subtle"
                rightSection={<IconChevronDown size={12} />}
                style={{
                  height: '24px',
                  fontSize: '11px',
                  minWidth: '60px'
                }}
              >
                {editor?.isActive('heading', { level: 1 }) ? 'H1' :
                 editor?.isActive('heading', { level: 2 }) ? 'H2' :
                 editor?.isActive('heading', { level: 3 }) ? 'H3' : 'Normal'}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => editor?.chain().focus().setParagraph().run()}>
                Normal
              </Menu.Item>
              <Menu.Item onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
                Heading 1
              </Menu.Item>
              <Menu.Item onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                Heading 2
              </Menu.Item>
              <Menu.Item onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                Heading 3
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--mantine-color-gray-4)', margin: '0 4px' }} />

          {/* Text Formatting */}
          <Tooltip label="Bold (Ctrl+B)" withArrow>
            <Button
              size="compact-xs"
              variant={editor?.isActive('bold') ? 'light' : 'subtle'}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              style={{
                minWidth: '24px',
                height: '24px',
                fontWeight: 'bold',
                fontSize: '12px',
                color: 'var(--mantine-color-dark-7)'
              }}
            >
              B
            </Button>
          </Tooltip>
          <Tooltip label="Italic (Ctrl+I)" withArrow>
            <Button
              size="compact-xs"
              variant={editor?.isActive('italic') ? 'light' : 'subtle'}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              style={{
                minWidth: '24px',
                height: '24px',
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'var(--mantine-color-dark-7)'
              }}
            >
              I
            </Button>
          </Tooltip>
          <Tooltip label="Underline (Ctrl+U)" withArrow>
            <Button
              size="compact-xs"
              variant={editor?.isActive('underline') ? 'light' : 'subtle'}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              style={{
                minWidth: '24px',
                height: '24px',
                textDecoration: 'underline',
                fontSize: '12px',
                color: 'var(--mantine-color-dark-7)'
              }}
            >
              U
            </Button>
          </Tooltip>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--mantine-color-gray-4)', margin: '0 4px' }} />

          {/* Lists */}
          <Tooltip label="Bullet List" withArrow>
            <Button
              size="compact-xs"
              variant={editor?.isActive('bulletList') ? 'light' : 'subtle'}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              style={{
                height: '24px',
                fontSize: '14px',
                minWidth: '24px'
              }}
            >
              •
            </Button>
          </Tooltip>
          <Tooltip label="Numbered List" withArrow>
            <Button
              size="compact-xs"
              variant={editor?.isActive('orderedList') ? 'light' : 'subtle'}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              style={{
                height: '24px',
                fontSize: '11px',
                minWidth: '24px'
              }}
            >
              1.
            </Button>
          </Tooltip>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--mantine-color-gray-4)', margin: '0 4px' }} />

          {/* Links */}
          <Tooltip label="Add Link (Ctrl+K)" withArrow>
            <Button
              size="compact-xs"
              variant={editor?.isActive('link') ? 'light' : 'subtle'}
              onClick={() => {
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor?.chain().focus().setLink({ href: url }).run();
                }
              }}
              style={{
                height: '24px',
                fontSize: '11px',
                color: 'var(--mantine-color-blue-6)'
              }}
            >
              🔗
            </Button>
          </Tooltip>
          <Tooltip label="Remove Link" withArrow>
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => editor?.chain().focus().unsetLink().run()}
              disabled={!editor?.isActive('link')}
              style={{
                height: '24px',
                fontSize: '11px',
                color: 'var(--mantine-color-gray-6)'
              }}
            >
              ✂️
            </Button>
          </Tooltip>
        </div>

        <RichTextEditor.Content
          placeholder={placeholder || "Start typing..."}
        />
      </RichTextEditor>

      {/* Character count and validation */}
      {(maxLength || showCharCount || description || error) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          marginTop: '4px'
        }}>
          <div style={{ color: error ? 'var(--mantine-color-error)' : 'var(--mantine-color-dimmed)' }}>
            {error || description}
          </div>
          {(maxLength || showCharCount) && (
            <div style={{
              color: isOverLimit ? 'var(--mantine-color-error)' : 'var(--mantine-color-dimmed)',
              fontWeight: isOverLimit ? 'bold' : 'normal'
            }}>
              {maxLength ? `${currentLength}/${maxLength}` : `${currentLength} characters`}
            </div>
          )}
        </div>
      )}
    </Box>
  );
});

CustomRichTextEditor.displayName = 'RichTextEditor';

export default CustomRichTextEditor;