const WORDS_PER_MINUTE = 200;

/**
 * Nettoie le corps Markdown avant de compter les mots.
 * Les articles contiennent du HTML inline (tableaux, figures, SVG animés) et des
 * blocs <style> : sans ce nettoyage, le balisage est compté comme du texte et la
 * durée annoncée double.
 */
function texteSeul(markdown: string): string {
  return markdown
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ');
}

export function readingTime(text: string): string {
  const words = texteSeul(text).trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min de lecture`;
}
