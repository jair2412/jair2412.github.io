// Escribe el resumen del run ($GITHUB_STEP_SUMMARY) para que quien aprueba STAGING sepa qué está
// aprobando sin abrir ningún log (B5 del LAB-04).
//
//   node scripts/resumen.mjs pruebas "Pruebas unitarias" unit.json [site.json ...]   (salida de vitest --reporter=json)
//   node scripts/resumen.mjs trivy web trivy-web.json                                 (salida de trivy --format json)
import { readFileSync, existsSync, appendFileSync } from "node:fs";

const [modo, titulo, ...archivos] = process.argv.slice(2);
const destino = process.env.GITHUB_STEP_SUMMARY;
const escribir = (texto) => (destino ? appendFileSync(destino, texto + "\n") : console.log(texto));
const leer = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf-8")) : null);

if (modo === "pruebas") {
  const filas = archivos.map((ruta) => {
    const r = leer(ruta);
    if (!r) return `| ${ruta} | - | - | - | ⚠️ no se generó el reporte |`;
    const estado = r.numFailedTests > 0 ? "❌" : "✅";
    return `| ${ruta.replace(/\.json$/, "")} | ${r.numTotalTests} | ${r.numPassedTests} | ${r.numFailedTests} | ${estado} |`;
  });
  escribir(`### 🧪 ${titulo}\n\n| Suite | Total | Pasaron | Fallaron | Estado |\n|---|:-:|:-:|:-:|:-:|\n${filas.join("\n")}\n`);
} else if (modo === "trivy") {
  const r = leer(archivos[0]);
  const orden = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
  const total = Object.fromEntries(orden.map((s) => [s, 0]));
  const conParche = Object.fromEntries(orden.map((s) => [s, 0]));
  for (const res of r?.Results ?? []) {
    for (const v of res.Vulnerabilities ?? []) {
      total[v.Severity] += 1;
      if (v.FixedVersion) conParche[v.Severity] += 1;
    }
  }
  const filas = orden.map((s) => `| ${s} | ${total[s]} | ${conParche[s]} |`).join("\n");
  const frena = conParche.CRITICAL + conParche.HIGH;
  escribir(
    `### 🛡️ Trivy: imagen \`${titulo}\`\n\n| Severidad | Encontradas | Con parche |\n|---|:-:|:-:|\n${filas}\n\n` +
      (frena > 0
        ? `❌ ${frena} CRITICAL/HIGH con parche: el pipeline se detiene aquí.\n`
        : `✅ Ninguna CRITICAL/HIGH con parche (las aceptadas están en \`.trivyignore\`, con su porqué).\n`)
  );
} else {
  console.error("uso: resumen.mjs pruebas|trivy <título> <archivos...>");
  process.exit(2);
}
