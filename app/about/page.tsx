export default function AboutPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <section style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
        <h1>adolib-go について</h1>
        <p>
          Adolib-go KICK-OFF は、セッション主催者の運営業務とメンバー向け導線を 1 つの Web アプリに統合するためのプロジェクトです。
        </p>
      </section>

      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        <article style={{ padding: '1.25rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
          <h2>活動概要</h2>
          <p>
            公開サイト、メンバーサイト、管理サイトを分離しつつ、sessionSet 生成、イベント管理、レイティング、アーカイブ、通知を一貫して扱える構成を目指しています。
          </p>
        </article>
        <article style={{ padding: '1.25rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
          <h2>参加案内</h2>
          <p>
            参加希望者はサインアップ後、メンバーページからプロフィール設定とセッションエントリーを行います。募集期間中は Round ごとの希望曲入力が可能です。
          </p>
        </article>
        <article style={{ padding: '1.25rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
          <h2>運営ポリシー</h2>
          <p>
            運営は募集状況、sessionSet 公開、レイティング、アーカイブを継続的に管理します。通知履歴と監査情報は、再現性のある運用のために保持します。
          </p>
        </article>
      </section>
    </main>
  );
}