export function dashboardHomePath() {
  return "/dashboard";
}

export function teamHomePath(teamId: string) {
  return `/dashboard/${teamId}`;
}

export function teamSettingsPath(teamId: string) {
  return `/dashboard/${teamId}/settings`;
}

export function projectPath(teamId: string, projectId: string) {
  return `/dashboard/${teamId}/${projectId}`;
}

export function videoPath(teamId: string, projectId: string, videoId: string) {
  return `/dashboard/${teamId}/${projectId}/${videoId}`;
}
