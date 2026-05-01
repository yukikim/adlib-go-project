import { Button } from '@/components/ui/button';
type MainHeaderProps = {
    view: '管理者' | 'メンバー';
    currentUser?: {
        role?: 'admin' | 'member';
        displayName: string;
    } | null;
    admin?: {
        adminMemberDisplayName: string;
    };
    memberProfile?: {
        memberDisplayName?: string;
    };
    auth: {
        handleSignOut: () => void;
    };
    loading?: boolean;
};

export default function MainHeader({ view, currentUser, admin, auth, loading, memberProfile }: MainHeaderProps) {
    return (
        <header className="border-b border-brand-main/15 bg-brand-base/15 backdrop-blur-sm">
            <div className="mx-auto flex max-w-250 flex-wrap gap-4 px-8 py-4">
                <h2>{view}</h2>
                <div>
                { currentUser?.role === "admin" && <div>{admin?.adminMemberDisplayName}</div>}
                { currentUser?.role === "member" && <div>{memberProfile?.memberDisplayName}</div>}
                </div>
                {/* <div>管理者: {currentUser?.role === "admin" ? admin?.adminMemberDisplayName : "未ログイン"}</div> */}
                <Button type="button" variant="outline" onClick={auth.handleSignOut} disabled={loading}>
                    サインアウト
                </Button>
            </div>
        </header>
    )
}