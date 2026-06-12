// Textos de la app — español rioplatense (voseo). Centralizados para mantener consistencia.

export const copy = {
  appName: "Prode Mundial 2026",
  tagline: "Pronosticá los partidos del Mundial y competí con tus amigos.",

  nav: {
    matches: "Partidos",
    groups: "Grupos",
    ranking: "Tabla",
    admin: "Admin",
    logout: "Cerrar sesión",
  },

  login: {
    title: "Entrá al Prode",
    subtitle: "Te mandamos un link mágico a tu mail para entrar. Sin contraseñas.",
    emailLabel: "Tu mail",
    emailPlaceholder: "vos@ejemplo.com",
    submit: "Enviame el link",
    sending: "Enviando…",
    sent: "¡Listo! Revisá tu mail y hacé clic en el link para entrar.",
    error: "No pudimos enviar el link. Probá de nuevo.",
  },

  onboarding: {
    title: "¿Cómo te decís?",
    subtitle: "Este es el nombre que van a ver tus amigos en la tabla.",
    nameLabel: "Tu nombre",
    namePlaceholder: "Ej: el Colo",
    submit: "Guardar y empezar",
  },

  groups: {
    title: "Tus grupos",
    empty: "Todavía no estás en ningún grupo. Creá uno o sumate con un código.",
    createTitle: "Creá un grupo",
    createSubtitle: "Sos el admin. Compartí el código para que se sumen tus amigos.",
    nameLabel: "Nombre del grupo",
    namePlaceholder: "Ej: Los del asado",
    createSubmit: "Crear grupo",
    joinTitle: "Sumate a un grupo",
    joinSubtitle: "Pegá el código de invitación que te pasaron.",
    codeLabel: "Código de invitación",
    codePlaceholder: "Ej: MUNDIAL26",
    joinSubmit: "Unirme",
    inviteCode: "Código de invitación",
    copyCode: "Copiar código",
    copied: "¡Copiado!",
    shareLink: "Compartir link",
    linkCopied: "¡Link copiado!",
    members: (n: number) => (n === 1 ? "1 jugador" : `${n} jugadores`),
    adminBadge: "Admin",
    viewRanking: "Ver tabla",
    alreadyMember: "Ya estás en este grupo.",
    invalidCode: "Ese código no existe. Fijate que esté bien escrito.",
  },

  matches: {
    title: "Partidos",
    subtitle: "Cargá tu resultado antes de que empiece cada partido.",
    yourPrediction: "Tu pronóstico",
    result: "Resultado",
    locked: "Cerrado",
    save: "Guardar",
    saved: "Guardado",
    saving: "Guardando…",
    points: (n: number) => (n === 1 ? "1 punto" : `${n} puntos`),
    noPrediction: "Sin pronóstico",
    closesAt: "Cierra al empezar el partido",
    empty: "Todavía no hay partidos cargados. Volvé en un rato.",
  },

  ranking: {
    title: "Tabla de posiciones",
    subtitle: "Se actualiza a medida que terminan los partidos.",
    position: "Pos",
    player: "Jugador",
    exact: "Exactos",
    points: "Puntos",
    empty: "Todavía nadie sumó puntos. ¡A jugar!",
    you: "vos",
  },

  scoring: {
    title: "Cómo se puntúa",
    exact: "Resultado exacto",
    exactPts: "3 puntos",
    outcome: "Acertar ganador o empate",
    outcomePts: "1 punto",
    weighted: "En las fases finales los puntos valen más.",
  },

  admin: {
    title: "Administración",
    syncNow: "Sincronizar partidos ahora",
    syncing: "Sincronizando…",
    lastSync: "Última sincronización",
    never: "Nunca",
    matchCount: (n: number) => `${n} partidos cargados`,
    syncDone: (n: number) => `Listo. ${n} partidos actualizados.`,
    notAdmin: "No tenés permisos de administrador.",
  },

  stages: {
    GROUP: "Fase de grupos",
    LAST_32: "Dieciseisavos de final",
    LAST_16: "Octavos de final",
    QUARTER_FINAL: "Cuartos de final",
    SEMI_FINAL: "Semifinal",
    THIRD_PLACE: "Tercer puesto",
    FINAL: "Final",
  } as Record<string, string>,

  common: {
    loading: "Cargando…",
    back: "Volver",
    vs: "vs",
  },
};
