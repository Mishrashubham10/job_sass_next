export function formatExperienceLevel(
  level: 'junior' | 'mid-level' | 'senior'
) {
  switch (level) {
    case 'junior':
      return 'Junior';
    case 'mid-level':
      return 'Mid-Level';
    case 'senior':
      return 'Senior';
    default:
      throw new Error(`Unknown experience level: ${level satisfies never}`);
  }
}