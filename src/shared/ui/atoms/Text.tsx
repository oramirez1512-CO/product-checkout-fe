import type { HTMLAttributes, ReactNode } from 'react';

type TextAs = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'label';
type TextTone = 'default' | 'muted' | 'danger';

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: TextAs;
  tone?: TextTone;
  children: ReactNode;
};

export function Text({
  as: Tag = 'p',
  tone = 'default',
  className = '',
  children,
  ...rest
}: TextProps) {
  return (
    <Tag
      className={['text', `text--${tone}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
