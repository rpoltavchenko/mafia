import type { RoleDef } from '../game/types';
import { useI18n } from '../i18n/I18nContext';

export default function RoleBadge({ role, hidden = false }: { role: RoleDef | undefined; hidden?: boolean }) {
  const { roleName } = useI18n();
  if (hidden) return <span className="role-badge is-hidden">•••</span>;
  if (!role) return <span className="role-badge is-empty">—</span>;
  return (
    <span className="role-badge" style={{ '--role': role.color } as React.CSSProperties}>
      {roleName(role)}
    </span>
  );
}
