export async function readLesson() {
  const response = await fetch(new URL('../assets/lesson.json', import.meta.url));
  if (!response.ok) throw new Error('Lokale JSON-Datei fehlt');
  return response.json();
}
