import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="markdown-h1">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="markdown-h2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
      <h3 className="markdown-h3">
        {children}
      </h3>
  ),
  p: ({ children }) => (
    <p className="markdown-p">
      {children} 
    </p>
  ),
  ul: ({ children }) => (
    <ul className="markdown-ul">
      {children}
    </ul>
  ),
};