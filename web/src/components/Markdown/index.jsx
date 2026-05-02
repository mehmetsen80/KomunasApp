import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * High-fidelity Markdown renderer using the professional react-markdown library.
 * Requires: npm install react-markdown remark-gfm
 */
const Markdown = ({ content }) => {
  if (!content) return null;

  return (
    <div className="pro-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
