export default function AboutPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <section style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
        <h1>adolib-go について</h1>
        <p>
          Adolib-go KICK-OFF は、セッション主催者の運営業務とメンバー向け導線を 1 つの Web アプリに統合するためのプロジェクトです。
        </p>
        <p>
          公開サイト、メンバーサイト、管理サイトを分離しつつ、sessionSet 生成、イベント管理、レイティング、アーカイブ、通知を一貫して扱える構成を目指しています。
        </p>
      </section>
    </main>
  );
}