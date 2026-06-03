import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

// Simple inline parser for **bold** and *italic*
const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldIndex = remaining.indexOf('**');
    const italicIndex = remaining.indexOf('*');

    // No bold or italic left
    if (boldIndex === -1 && italicIndex === -1) {
      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }

    // Bold is closer or only one available
    if (boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex)) {
      // Push text before bold
      if (boldIndex > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, boldIndex)}</span>);
      }
      
      const rest = remaining.slice(boldIndex + 2);
      const endBoldIndex = rest.indexOf('**');
      
      if (endBoldIndex !== -1) {
        parts.push(
          <strong key={keyIdx++} className="font-extrabold text-slate-900">
            {rest.slice(0, endBoldIndex)}
          </strong>
        );
        remaining = rest.slice(endBoldIndex + 2);
      } else {
        parts.push(<span key={keyIdx++}>**{rest}</span>);
        break;
      }
    } else {
      // Italic is closer or only one available
      if (italicIndex > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, italicIndex)}</span>);
      }
      
      const rest = remaining.slice(italicIndex + 1);
      const endItalicIndex = rest.indexOf('*');
      
      if (endItalicIndex !== -1) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-700">
            {rest.slice(0, endItalicIndex)}
          </em>
        );
        remaining = rest.slice(endItalicIndex + 1);
      } else {
        parts.push(<span key={keyIdx++}>*{rest}</span>);
        break;
      }
    }
  }

  return parts;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 mb-6 mt-2 space-y-2 text-slate-700">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('# ')) {
      flushList(index);
      renderedElements.push(
        <h1 key={index} className="text-3xl font-black text-slate-900 tracking-tight mt-8 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h2 key={index} className="text-2xl font-bold text-slate-800 tracking-tight mt-6 mb-3 border-b border-gray-100 pb-2">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={index} className="text-lg font-bold text-slate-800 mt-5 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      flushList(index);
      renderedElements.push(
        <blockquote key={index} className="border-l-4 border-brand-500 bg-slate-50 px-4 py-3 rounded-r-xl my-4 text-slate-700 font-medium italic">
          {trimmed.slice(2)}
        </blockquote>
      );
    }
    // List item
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemContent = trimmed.slice(2);
      currentList.push(
        <li key={`${index}-${itemContent}`} className="text-slate-650 font-medium pl-1 text-sm md:text-base">
          {parseInlineMarkdown(itemContent)}
        </li>
      );
    } else if (trimmed.match(/^\d+\.\s/)) {
      // Ordered list item
      const itemContent = trimmed.replace(/^\d+\.\s/, '');
      currentList.push(
        <li key={`${index}-${itemContent}`} className="text-slate-650 font-medium pl-1 text-sm md:text-base list-decimal ml-4">
          {parseInlineMarkdown(itemContent)}
        </li>
      );
    }
    // Empty line
    else if (trimmed === '') {
      flushList(index);
    }
    // Regular paragraph
    else {
      flushList(index);
      renderedElements.push(
        <p key={index} className="text-slate-650 leading-relaxed font-normal mb-4 text-sm md:text-base">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  flushList(lines.length);

  return (
    <div className="markdown-body">
      {renderedElements}
    </div>
  );
};

export default MarkdownRenderer;
