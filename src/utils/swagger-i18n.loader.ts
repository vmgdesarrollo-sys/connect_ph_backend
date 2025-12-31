import * as fs from 'fs';
import * as path from 'path';

export function getSwaggerText(file: string, key: string, lang: string = 'es'): string {
  try {
    // Ruta a tus archivos JSON
    const filePath = path.join(process.cwd(), `src//i18n/${lang}/${file}.json`);
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    return json[key] || key;
  } catch (error) {
    console.warn(`No se pudo cargar la clave ${key} del archivo ${file}`);
    return key;
  }
}