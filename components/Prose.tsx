/** Renders admin-written text: blank lines split paragraphs, "## " starts a heading, "- " starts a list item. */
export function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="prose">
      {blocks.map((b, k) => {
        const lines = b.split("\n");
        const out: React.ReactNode[] = [];
        let para: string[] = [], list: string[] = [];
        const flush = () => {
          if (para.length) out.push(<p key={out.length}>{para.join(" ")}</p>);
          if (list.length) out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{l}</li>)}</ul>);
          para = []; list = [];
        };
        for (const l of lines) {
          if (l.startsWith("## ")) { flush(); out.push(<h2 key={out.length}>{l.slice(3)}</h2>); }
          else if (/^[-*] /.test(l)) { if (para.length) flush(); list.push(l.slice(2)); }
          else { if (list.length) flush(); para.push(l); }
        }
        flush();
        return <div key={k}>{out}</div>;
      })}
    </div>
  );
}
