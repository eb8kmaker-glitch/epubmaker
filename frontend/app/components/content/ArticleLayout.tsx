import type { Post } from "@/app/lib/content";
import { Link } from "@/i18n/navigation";

interface Props {
  post: Post;
  backHref: string;
  backLabel: string;
  tableOfContentsLabel: string;
}

export default function ArticleLayout({ post, backHref, backLabel, tableOfContentsLabel }: Props) {
  return (
    <div
      style={{
        maxWidth: 1060,
        margin: "0 auto",
        padding: "48px 36px 80px",
        display: "grid",
        gridTemplateColumns: post.headings.length > 2 ? "1fr 220px" : "1fr",
        gap: 48,
        alignItems: "start",
      }}
    >
      {/* ── Article ── */}
      <article>
        {/* Back link */}
        <Link
          href={backHref}
          style={{
            display: "inline-block",
            fontSize: 13,
            color: "var(--lib-dusk)",
            textDecoration: "none",
            marginBottom: 32,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            transition: "color 150ms ease",
          }}
          className="nav-link"
        >
          {backLabel}
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--lib-dust)",
                  background: "var(--lib-bg-3)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 500,
            color: "var(--lib-ink)",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            marginBottom: 16,
          }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
            paddingBottom: 24,
            borderBottom: "1px solid var(--lib-border)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--lib-dust)",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {new Date(post.date).toLocaleDateString(post.locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span
            style={{
              fontSize: 13,
              color: "var(--lib-dust)",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {post.readingTime} min
          </span>
        </div>

        {/* Content */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>

      {/* ── Sidebar TOC ── */}
      {post.headings.length > 2 && (
        <aside
          style={{
            position: "sticky",
            top: 80,
            background: "var(--lib-bg-2)",
            border: "1px solid var(--lib-border)",
            borderRadius: 10,
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--lib-dust)",
              marginBottom: 12,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {tableOfContentsLabel}
          </p>
          <nav>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {post.headings.map((h) => (
                <li
                  key={h.id}
                  style={{
                    paddingLeft: h.level === 3 ? 12 : 0,
                    marginBottom: 6,
                  }}
                >
                  <a
                    href={`#${h.id}`}
                    style={{
                      fontSize: 12,
                      color: "var(--lib-dusk)",
                      textDecoration: "none",
                      lineHeight: 1.4,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      display: "block",
                      transition: "color 150ms ease",
                    }}
                    className="nav-link"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
  );
}
