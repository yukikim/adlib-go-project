type MemberAccessUser = {
  memberProfile?: unknown | null;
} | null | undefined;

/**
 * メンバー機能は UserAccount.role ではなく MemberProfile の有無で判定する。
 * これにより、role=admin のユーザーもプロフィールを持てばメンバー機能を兼務できる。
 */
export function canUseMemberFeatures(user: MemberAccessUser) {
  return Boolean(user?.memberProfile);
}
