export function durationToHumanReadable(minutes: number): string {
    let duration: Record<string, number> = {};
    duration.years = Math.floor(minutes / 525600);
    duration.days = Math.floor((minutes % 525600) / 1440); 
    duration.hours = Math.floor(((minutes % 525600) % 1440) / 60);
    duration.minutes = Math.floor(((minutes % 525600) % 1440) % 60);
    return new Intl.DurationFormat(window.navigator.language, { style: "short" }).format(duration);
}