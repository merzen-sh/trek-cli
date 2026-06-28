import React from "react";

interface JsonHighlightProps {
  data: unknown;
  className?: string;
}

function highlightValue(value: unknown, indent: number = 0): React.ReactNode {
  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-chart-1">{String(value)}</span>;
  }

  if (typeof value === "number") {
    return <span className="text-chart-2">{value}</span>;
  }

  if (typeof value === "string") {
    return <span className="text-chart-3">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">[]</span>;
    }

    const items = value.map((item, i) => (
      <span key={i}>
        {" ".repeat(indent + 2)}
        {highlightValue(item, indent + 2)}
        {i < value.length - 1 ? "," : ""}
        {"\n"}
      </span>
    ));

    return (
      <span>
        <span className="text-muted-foreground">[</span>
        {"\n"}
        {items}
        {" ".repeat(indent)}
        <span className="text-muted-foreground">]</span>
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-muted-foreground">{"{}"}</span>;
    }

    const items = entries.map(([key, val], i) => (
      <span key={key}>
        {" ".repeat(indent + 2)}
        <span className="text-accent-foreground">"{key}"</span>
        <span className="text-muted-foreground">: </span>
        {highlightValue(val, indent + 2)}
        {i < entries.length - 1 ? "," : ""}
        {"\n"}
      </span>
    ));

    return (
      <span>
        <span className="text-muted-foreground">{"{"}</span>
        {"\n"}
        {items}
        {" ".repeat(indent)}
        <span className="text-muted-foreground">{"}"}</span>
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

export function JsonHighlight({ data, className }: JsonHighlightProps) {
  return (
    <pre className={className}>
      <code>{highlightValue(data, 0)}</code>
    </pre>
  );
}
