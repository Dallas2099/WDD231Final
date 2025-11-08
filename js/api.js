export async function fetchJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Fetch failed: ${path}`);
  return res.json();
}
