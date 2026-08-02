type AppIconProps = {
  value?: string | null;
  fallback?: string;
  className?: string;
};

function resolveIconToken(value?: string | null, fallback?: string) {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    return normalizedValue;
  }

  return fallback ?? '⭐';
}

export function isMaterialIcon(value: string) {
  return value.startsWith('mi:');
}

export default function AppIcon({ value, fallback, className = '' }: AppIconProps) {
  const iconToken = resolveIconToken(value, fallback);

  if (isMaterialIcon(iconToken)) {
    return (
      <span className={`icon-glyph material-symbols-rounded ${className}`.trim()}>
        {iconToken.slice(3)}
      </span>
    );
  }

  return (
    <span className={`icon-glyph ${className}`.trim()}>
      {iconToken}
    </span>
  );
}

