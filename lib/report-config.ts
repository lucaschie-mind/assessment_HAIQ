// lib/report-config.ts
//
// Controla quais seções aparecem na devolutiva do CANDIDATO.
// A devolutiva do RH não é afetada — ela sempre mostra tudo.
//
// A configuração agora vem do banco, na coluna Tenant.reportConfig,
// editada pelo painel administrativo. A variável de ambiente
// HAIQ_DEVOLUTIVA_CONFIG não é mais usada e pode ser removida do Railway.

export interface ConfigDevolutiva {
  mostrarMetodologia: boolean;
  mostrarAgencia: boolean;
  mostrarPareceres: boolean;
  mostrarGaps: boolean;
}

/** Versão completa — o que todo mundo vê por padrão. */
export const PADRAO: ConfigDevolutiva = {
  mostrarMetodologia: true,
  mostrarAgencia:     true,
  mostrarPareceres:   true,
  mostrarGaps:        true,
};

const FLAGS = ["mostrarMetodologia", "mostrarAgencia", "mostrarPareceres", "mostrarGaps"] as const;

/**
 * Resolve a configuração a partir do que está gravado no tenant.
 *
 * @param reportConfig  valor da coluna Tenant.reportConfig. Pode ser null
 *                      (mostra tudo), objeto parcial, ou lixo — a função
 *                      ignora o que não reconhece e nunca lança exceção.
 */
export function configDoTenant(reportConfig: unknown): ConfigDevolutiva {
  if (!reportConfig || typeof reportConfig !== "object" || Array.isArray(reportConfig)) {
    return { ...PADRAO };
  }

  const bruto = reportConfig as Record<string, unknown>;
  const cfg: ConfigDevolutiva = { ...PADRAO };

  for (const f of FLAGS) {
    if (typeof bruto[f] === "boolean") cfg[f] = bruto[f] as boolean;
  }

  return cfg;
}
