type MainHeaderProps = {
  view: 'public' | 'member' | 'admin' | 'admin-signin' | 'signin' | 'signup' | 'other';
};

export default function MainHeader({ view }: MainHeaderProps) {
    return (
        <header className="border-b border-brand-main/15 bg-brand-base/15 backdrop-blur-sm">
            <div className="mx-auto flex max-w-250 flex-wrap gap-4 px-8 py-4">
            <h2>メインヘッダー: {view}</h2>
            </div>
        </header>
    )
}