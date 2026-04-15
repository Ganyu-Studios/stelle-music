import { LoopMode, State } from "hoshimi";
import type { DefaultLocale } from "seyfert";
import { ApplicationCommandOptionType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";

/**
 * The Spanish locale for Stelle.
 */
export default {
    metadata: {
        name: "Spanish",
        emoji: "🇲🇽",
        translators: ["MARCROCK22", "JustEvil"],
    },
    messages: {
        commands: {
            join: ({ channelId }): string => `\`✅\` Me uní al canal de voz <#${channelId}>.`,
            setprefix: ({ prefix }): string => `\`✅\` El **nuevo prefijo** para este servidor es: \`${prefix}\``,
            skip: ({ amount }): string => `\`✅\` Saltando la cantidad de: \`${amount} canciones\`.`,
            move: ({ textId, voiceId }): string => `\`✅\` Me movi al canal de voz <#${voiceId}> y canal de texto: <#${textId}>`,
            previous: ({ title, uri }): string => `\`✅\` La canción anterior [**${title}**](${uri}) ha sido añadida a la cola.`,
            nowplaying: ({ userName, time }): string => `-# Pedido por: ${userName} con ${time}`,
            stop: "`👋` Deteniendo y abandonando el canal...",
            shuffle: "`✅` La cola ha sido mezclada.",
            is247: {
                enabled: ({ is247, autoPause }): string => `\`✅\` El modo 24/7 ahora está \`${is247}\` con auto-pausa \`${autoPause}\``,
                enabledType: {
                    enabled: "Activado",
                    disabled: "Desactivado",
                },
            },
            playlist: {
                created: ({ name, state }): string =>
                    `\`✅\` La playlist \`${name}\` ha sido creada correctamente.\n\`📋\` **Visibilidad**: \`${state}\``,
                loaded: ({ name }): string => `\`✅\` La playlist \`${name}\` ha sido cargada correctamente.`,
                renamed: ({ name }): string => `\`✅\` La playlist fue renombrada a \`${name}\` correctamente.`,
                deleted: ({ name }): string => `\`✅\` La playlist \`${name}\` ha sido eliminada exitosamente.`,
                noPlaylist: "`❌` **No se encontró ninguna playlist** con ese ID.",
                noTracks: "`❌` **No se encontraron canciones** en esta playlist.",
                list: {
                    title: "`📋` Playlists disponibles",
                    noPrivate: "`📭` Aún no tienes playlists privadas.",
                    noPublic: "`📭` No hay playlists públicas disponibles por ahora.",
                    andMore: ({ amount }) => `-# Y ${amount} más...`,
                },
                manage: {
                    title: ({ name }): string => `\`🎵\` Gestionando Playlist: \`${name}\``,
                    description:
                        "`📦` Aquí puedes gestionar tu playlist de forma rápida y sencilla.\n`📜` Guarda canciones cuando quieras, elimínalas cuando lo necesites y mantén todo ordenado.\n\n`⚠️` __Mientras más canciones agregues, más puede tardar en cargar la playlist.__\n\n-# Selecciona una acción para gestionar tu playlist.",
                    options: {
                        toggle: ({ state }): string => `Hacer ${state}`,
                        save: "Guardar",
                        delete: "Eliminar",
                        info: "Info",
                    },
                    delete: {
                        description:
                            "`📢` Introduce los números de las canciones que quieres eliminar.\n`📌` Usa comas, rangos o rangos con comodín como `1, 3, 5-7, 11-*`.\n`⚠️` Usa el botón de Info si quieres revisar la lista completa primero.",
                        invalidSelection:
                            "`❌` La selección que ingresaste no es válida. Usa números de canción o rangos como `1, 3-5, 11-*`.",
                        outOfRange: ({ tracks }): string =>
                            `\`❌\` Uno o más números de canción están fuera de la playlist actual. Solo tiene \`${tracks} canciones\`.`,
                        deleted: ({ amount }): string => `\`✅\` Se eliminaron exitosamente **${amount} canción(es)** de tu playlist.`,
                        modal: {
                            title: "Eliminar canciones",
                            label: {
                                label: "Eliminar canciones por número",
                                description: "Introduce uno o más números de canción o rangos. Ejemplo: 1, 3, 5-7, 11-*",
                                component: "1, 3, 5-7, 11-*",
                            },
                        },
                    },
                    save: {
                        saved: ({ type, amount }) => `\`✅\` Guardado exitosamente **${amount} canción(es)** de **${type}** a tu playlist.`,
                        noResults: "`❌` No se encontraron canciones de la URL proporcionada.",
                        invalidUrl: "`❌` La URL que ingresaste no es válida.",
                        description: "`📢` Selecciona una de las opciones de abajo para guardar canciones en tu playlist.",
                        alreadyExists: "`❌` Las **canciones** que estás intentando guardar ya existen en tu playlist.",
                        modal: {
                            title: "Guardar desde URL",
                            label: {
                                label: "Guardar desde URL",
                                description: "Introduce la URL de una canción o playlist para guardar canciones desde allí.",
                                component: "Introduce la URL de la canción o playlist aquí...",
                            },
                        },
                        options: {
                            current: "Canción Actual",
                            queue: "Cola Actual",
                            url: "Desde URL",
                        },
                        saveType: {
                            current: "canción actual",
                            queue: "cola actual",
                            url: "URL",
                        },
                    },
                },
                state: {
                    public: "Pública",
                    private: "Privada",
                },
            },
            lyrics: {
                noLyrics: "`❌` **No se encontraron letras** para esta canción...",
                close: "Cerrar",
                sync: "Sincronizar",
                embed: {
                    title: ({ title }): string => `\`📜\` Letras para: ${title}`,
                    description: ({ lines, provider, author }): string => `-# Provisto por: ${provider}\nPor: ${author}\n\n${lines}`,
                    footer: ({ userName }): string => `Pedido por: ${userName}`,
                },
            },
            info: {
                bot: {
                    description: ({ clientName, defaultPrefix }): string =>
                        `\`📋\` Aqui hay unas estadísticas acerca de **${clientName}**, por defecto mi prefijo es: \`${defaultPrefix}\`.`,
                    invite: "Invitar la Bot",
                    repository: "Repositorio de Github",
                    fields: {
                        info: {
                            name: "`📋` Info",
                            value: ({ guilds, users, players }): string =>
                                `\`📦\` Servidores: \`${guilds}\`\n\`👤\` Usuarios: \`${users}\`\n\`🎤\` Reproductores: \`${players}\``,
                        },
                        system: {
                            name: "`📋` Sistema",
                            value: ({ memory, uptime, version }): string =>
                                `\`🧠\` Memoria: \`${memory}\`\n\`📜\` Version: \`v${version}\`\n\`🕛\` Tiempo de Encendido: <t:${uptime}:R>`,
                        },
                        git: {
                            name: "`📋` Git",
                            value: ({ branch, commit, time, commitUrl }): string =>
                                `\`🌳\` Rama: \`${branch}\`\n\`📦\` Commit: [\`${commit}\`](${commitUrl})\n\`⏱️\` Tiempo: ${time}`,
                        },
                    },
                },
            },
            help: {
                noCommand: "`❌` **No se encontró** ningún comando para esta búsqueda...",
                title: ({ clientName }): string => `${clientName} - Menú de Ayuda`,
                description: ({ defaultPrefix }): string =>
                    `\`📦\` ¡Hola! Aquí está la información sobre mis comandos y cosas.\n\`📜\` Selecciona la categoría de comando de tu elección.\n\n-# Puedes buscar un comando específico escribiendo: \`${defaultPrefix} help <comando>\``,
                selectMenu: {
                    description: ({ category }): string => `Selecciona la categoría ${category}.`,
                    placeholder: "Selecciona una categoría de comando.",
                    options: {
                        description: ({ options }): string => `-# * **Opcional []**\n-# * **Requerido <>**\n\n${options}`,
                        title: ({ clientName, category }): string => `${clientName} - Menú de Ayuda | ${category}`,
                    },
                },
                aliases: {
                    [StelleCategory.Unknown]: "Desconocido",
                    [StelleCategory.User]: "Usuario",
                    [StelleCategory.Music]: "Música",
                    [StelleCategory.Guild]: "Servidor",
                },
            },
            default: {
                engine: ({ engine, clientName }): string =>
                    `\`✅\` El tipo de búsqueda por defecto de ${clientName} ahora es: **${engine}**.`,
                volume: ({ volume, clientName }): string => `\`✅\` El volumen por defecto de ${clientName} ahora es: **${volume}%**.`,
            },
            setlocale: {
                invalidLocale: ({ locale, available }): string =>
                    `\`❌\` El idioma : \`${locale}\` es inválido.\n\`📢\` **Idiomas disponibles**: \`${available}\``,
                newLocale: ({ locale }): string => `\`✅\` El idioma de **Stelle** ahora es: \`${locale}\``,
            },
            ping: {
                message: "`🪶` Calculando...",
                response: ({ wsPing, clientPing, shardPing, shardId }): string =>
                    `\`🌐\` Pong! (**Cliente**: \`${wsPing}ms\` - **API**: \`${clientPing}ms\` - **Fragmento (${shardId})**: \`${shardPing}ms\`)`,
            },
            play: {
                undetermined: "Indeterminado",
                live: "🔴 EN DIRECTO",
                noResults: "`❌` **Sin resultados** para esta búsqueda...\n`🪶` Intenta buscando otra cosa.",
                embed: {
                    playlist: ({ playlist, tracks, volume, query, requester }): string =>
                        `\`🎵\` La lista de canciones [\`${playlist}\`](${query}) ha sido añadida a la cola.\n\n\`🔊\` **Volumen**: \`${volume}%\`\n\`👤\` **Solicitada por**: <@${requester}>\n\`🔰\` **Con**: \`${tracks} canciones\``,
                    result: ({ title, url, duration, volume, requester, position }): string =>
                        `\`🎵\` Añadida [\`${title}\`](${url}) a la cola.\n\n\`🕛\` **Duración**: \`${duration}\`\n\`🔊\` **Volumen**: \`${volume}%\`\n\`👤\` **Solicitada por**: <@${requester}>\n\n\`📋\` **Posición en la cola**: \`#${position}\``,
                },
            },
            loop: {
                toggled: ({ type }): string => `\`✅\` El **modo de bucle** ahora es: \`${type}\``,
                loopType: {
                    [LoopMode.Off]: "Desactivado",
                    [LoopMode.Queue]: "Cola",
                    [LoopMode.Track]: "Canción",
                },
            },
            autoplay: {
                toggled: ({ type }): string => `\`✅\` El modo de la **reproducción automática** ahora es: \`${type}\``,
                autoplayType: {
                    enabled: "Activado",
                    disabled: "Desactivado",
                },
            },
            nodes: {
                value: ({ state, uptime, players, memory, cpu }): string =>
                    `\`📘\` Estado: \`${state}\`\n\`🕛\` Tiempo de actividad: \`${uptime}\`\n\`🎤\` Reproductores: \`${players}\`\n\`🪭\` Uso: \`${memory}\`\n\`📦\` CPU: \`${cpu}\``,
                description: "`📋` Lista de los nodos de Stelle.",
                noNodes: "`❌` No hay nodos disponibles por el momento.",
                states: {
                    [State.Connected]: "🟢 Conectado.",
                    [State.Disconnected]: "🔴 Desconectado.",
                    [State.Connecting]: "🟡 Conectando...",
                    [State.Idle]: "⚪ Inactivo.",
                    [State.Reconnecting]: "🟠 Reconectando...",
                    [State.Reconnected]: "🟢 Reconectado.",
                    [State.Destroyed]: "⚫ Destruído.",
                },
            },
            volume: {
                changed: ({ volume }): string => `\`✅\` El volumen ha sido establecido a: **${volume}%**.`,
                paused: "`🔰` El volumen es **1%**, así que el reproductor ha sido pausado.",
            },
            seek: {
                invalidTime: ({ time }): string => `\`❌\` El tiempo \`${time}\` no es válido.`,
                seeked: ({ time, type }): string => `\`✅\` La canción ha sido **${type}** hacia \`${time}\`.`,
                exeedsTime: ({ time }): string => `\`❌\` El tiempo \`${time}\` excede la duración de la canción actual.`,
                noSeekable: "`❌` La **canción actual** no es `adelantable`.",
                type: {
                    seeked: "adelantada",
                    rewond: "devuelta",
                },
            },
        },
        events: {
            inCooldown: ({ time }): string => `\`❌\` Necesitas esperar: <t:${time}:R> (<t:${time}:t>) para usar esto.`,
            noSameVoice: ({ channelId }): string => `\`❌\` No estás en el **mismo canal de voz** que yo. (<#${channelId}>)`,
            onlyUser: ({ userId }): string => `\`❌\` Solo el usuario: <@${userId}> puede usar esto.`,
            invalidOptions: ({ options, list }): string =>
                `\`❌\` Opciones o argumentos del comando inválidos.\n- **Requerido**: \`<>\`\n- **Opcional**: \`[]\`\n\n\`📋\` **Uso**:\n ${options}\n\`📢\` **Opciones Disponibles**:\n${list}`,
            playerQueue: ({ tracks }): string => `\`📋\` Aquí está la cola completa del servidor: \n\n${tracks}`,
            channelEmpty: ({ type }): string => `\`🎧\` Stelle está sola en el **canal de voz**... Pausando y esperando **${type}**.`,
            mention: ({ clientName, defaultPrefix, commandName }): string =>
                `\`📢\` Hey! Mi nombre es: **${clientName}** y mi prefijo es: \`${defaultPrefix}\` y **/** también!\n\`📋\` Si tu quieres ver mis comandos, escribe: \`${defaultPrefix} ${commandName}\` o /${commandName}.`,
            noMembers: ({ clientName }): string => `\`🎧\` ${clientName} está sola en el **canal de voz**... Abandonando el canal.`,
            hasMembers: ({ clientName }): string => `\`🎧\` ${clientName} dejó de estar sola... Resumiendo.`,
            is247Enabled: "`✅` El modo 24/7 está activado... Me quedaré en el canal de voz hasta que me digas que me vaya.",
            onlyDeveloper: "`❌` Solo el **dueño del bot** puede usar esto.",
            onlyGuildOwner: "`❌` Solo el **dueño del servidor** puede usar esto.",
            noCommand: "`❌` No tengo el comando necesitado *todavía*, intenta de nuevo en un momento.",
            noVoiceChannel: "`❌` No estás en un **canal de voz**... Únete a uno para reproducir música.",
            noNodes: "`❌` No estoy conectada a ninguno de mis nodos.",
            noPlayer: "`❌` No estoy reproduciendo nada ahora mismo...",
            noPrevious: "`❌` No hubo una canción antes de esta.",
            noTracks: "`❌` No hay más canciones en la cola.",
            noQuery: "`❌` Introduce el nombre o el URL para reproducir.",
            noSameGuild: "`❌` El canal debe estar en este servidor.",
            invalidInput: "`❌` La entrada proporcionada no es válida (no puede ser un URL u otro formato inválido).",
            playerEnd: "`🔰` La cola ha terminado... Esperando más canciones.",
            moreTracks: "`❌` Para habilitar **esto** `una o más canciones` son requeridas.",
            commandError:
                "`❌` Algo inesperado ocurrió durante la ejecución del comando.\n`📢` Si el problema persiste, reporta el problema.",
            autocomplete: {
                loadPlaylist: ({ name, visibility, author }): string => `Nombre: ${name} - Estado: ${visibility} | por ${author}`,
                noPlaylist: "Stelle - No se encontraron playlists.",
                noAnything: "Stelle - Algo ocurrió intentando usar este autocompletado.",
                noNodes: "Stelle - No estoy conectada a ninguno de mis nodos.",
                noVoiceChannel: "Stelle - No estás en un canal de voz... Únete a uno para reproducir música.",
                noSameVoice: "Stelle - No estás en el mismo canal de voz que yo.",
                noQuery: "Stelle - Introduce el nombre o el URL para reproducir.",
                noTracks: "Stelle - No encontre la canción. Introduce otro nombre o el URL.",
                noGuild: "Stelle - Este autocomplete solo puede ser usado en servidores.",
                noCommand: "Stelle - Nombre de comando inválido.",
            },
            optionTypes: {
                [ApplicationCommandOptionType.Subcommand]: "subcomando",
                [ApplicationCommandOptionType.SubcommandGroup]: "grupo de subcomando",
                [ApplicationCommandOptionType.String]: "texto",
                [ApplicationCommandOptionType.Integer]: "entero",
                [ApplicationCommandOptionType.Boolean]: "booleano",
                [ApplicationCommandOptionType.User]: "@usuario",
                [ApplicationCommandOptionType.Channel]: "#canal",
                [ApplicationCommandOptionType.Role]: "@rol",
                [ApplicationCommandOptionType.Mentionable]: "@mencionable",
                [ApplicationCommandOptionType.Number]: "numero",
                [ApplicationCommandOptionType.Attachment]: "achivo",
            },
            voiceStatus: {
                trackStart: ({ title, author }): string => `${title} por ${author}`,
                queueEnd: "La cola está vacía.",
            },
            trackStart: {
                embed: ({ duration, requester, title, url, volume, author, size }): string =>
                    `\`📻\` Reproduciendo ahora [\`${title}\`](${url})\n\n\`🎤\` **Autor**: \`${author}\`\n\`🕛\` **Duración**: \`${duration}\`\n\`🔊\` **Volumen**: \`${volume}%\`\n\`👤\` **Solicitado por**: <@${requester}>\n\n\`📋\` **En cola**: \`${size} canciones\``,
                components: {
                    loop: ({ type }): string => `Bucle: ${type}`,
                    autoplay: ({ type }): string => `Aleatorio: ${type}`,
                    stop: "Parar",
                    skip: "Saltar",
                    previous: "Anterior",
                    queue: "Cola",
                    lyrics: "Letra",
                    states: {
                        resume: "Resumir",
                        pause: "Pausar",
                    },
                },
            },
            permissions: {
                list: {
                    AddReactions: "Añadir Reacciones",
                    Administrator: "Administrador",
                    AttachFiles: "Adjuntar Archivos",
                    BanMembers: "Vetar Miembros",
                    ChangeNickname: "Cambiar Apodo",
                    Connect: "Conectar",
                    CreateInstantInvite: "Crear Invitaciones",
                    CreatePrivateThreads: "Crear Hilos Privados",
                    CreatePublicThreads: "Crear Hilos Públicos",
                    DeafenMembers: "Ensordecer Miembros",
                    EmbedLinks: "Adjuntar Links",
                    KickMembers: "Expulsar Miembros",
                    ManageChannels: "Gestionar Canales",
                    ManageEvents: "Gestionar Eventos",
                    ManageGuild: "Gestionar Servidor",
                    ManageMessages: "Gestionar Mensajes",
                    ManageNicknames: "Gestionar Apodos",
                    ManageRoles: "Gestionar Roles",
                    ManageThreads: "Gestionar Hilos",
                    ManageWebhooks: "Gestionar Webhooks",
                    MentionEveryone: "Mencionar a Todos",
                    ModerateMembers: "Moderar Miembros",
                    MoveMembers: "Mover Miembros",
                    MuteMembers: "Silenciar Miembros",
                    PrioritySpeaker: "Prioridad al Hablar",
                    ReadMessageHistory: "Leer Historial de Mensajes",
                    RequestToSpeak: "Solicitar Hablar",
                    SendMessages: "Enviar Mensajes",
                    SendMessagesInThreads: "Enviar Mensajes en Hilo",
                    SendTTSMessages: "Enviar Mensajes TTS",
                    Speak: "Hablar",
                    Stream: "Transmitir",
                    UseApplicationCommands: "Usar Comandos de Aplicaciones",
                    UseEmbeddedActivities: "Usar Actividades Embebidas",
                    UseExternalEmojis: "Usar Emojis Externos",
                    UseExternalStickers: "Usar Stickers Externos",
                    UseVAD: "Usar Detección De Voz",
                    ViewAuditLog: "Ver Registro de Auditoría",
                    ViewChannel: "Ver Canal",
                    ViewGuildInsights: "Ver Información del Servidor",
                    ManageGuildExpressions: "Gestionar Expresiones del Servidor",
                    ViewCreatorMonetizationAnalytics: "Ver Análisis de Monetización de Creadores",
                    UseSoundboard: "Usar Tablero de Sonidos",
                    UseExternalSounds: "Usar Sonidos Externos",
                    SendVoiceMessages: "Enviar Mensajes de Voz",
                    CreateEvents: "Crear Eventos",
                    CreateGuildExpressions: "Crear Expresiones del Servidor",
                    SendPolls: "Enviar Encuestas",
                    UseExternalApps: "Usar Aplicaciones Externas",
                    BypassSlowmode: "Omitir Modo Lento",
                    PinMessages: "Fijar Mensajes",
                },
                user: {
                    description: "`📢` ¡Oye! Te faltan algunos permisos para hacer esto.",
                    field: "`📋` Permisos Faltantes",
                },
                bot: {
                    description: "`📢` ¡Oye! Me faltan algunos permisos para hacer esto.",
                    field: "`📋` Permisos Faltantes",
                },
                channel: {
                    description: ({ channelId }): string => `\`📢\` ¡Oye! Me faltan algunos permisos en el canal: <#${channelId}>`,
                    field: "`📋` Permisos Faltantes",
                },
            },
        },
    },
    locales: {
        play: {
            name: "reproducir",
            description: "Reproduce música con Stelle.",
            option: {
                name: "nombre",
                description: "Introduce el URL o nombre de la canción.",
            },
        },
        ping: {
            name: "latencia",
            description: "Obten la latencia de Stelle.",
        },
        nodes: {
            name: "nodos",
            description: "Obten el estado de todos los nodos de Stelle.",
        },
        setlocale: {
            name: "idioma",
            description: "Establece el idioma de Stelle.",
            option: {
                name: "idioma",
                description: "Introduce el nuevo idioma.",
            },
        },
        autoplay: {
            name: "aleatoria",
            description: "Alterna la reproducción automática.",
        },
        volume: {
            name: "volumen",
            description: "Modifica el volumen.",
            option: {
                name: "volumen",
                description: "Introduce el volumen.",
            },
        },
        loop: {
            name: "bucle",
            description: "Alterna el modo de bucle.",
            option: {
                name: "modo",
                description: "Selecciona el modo de bucle.",
            },
        },
        move: {
            name: "mover",
            description: "Mover el reproductor.",
            options: {
                voice: {
                    name: "voz",
                    description: "Selecciona el canal de voz.",
                },
                text: {
                    name: "texto",
                    description: "Selecciona el canal de texto.",
                },
            },
        },
        stop: {
            name: "detener",
            description: "Detiene el reproductor.",
        },
        skip: {
            name: "saltar",
            description: "Salta la canción actual.",
            option: {
                name: "cantidad",
                description: "Salta una cantidad especifica de canciones.",
            },
        },
        queue: {
            name: "cola",
            description: "Mira la cola de reproducción.",
        },
        seek: {
            name: "adelantar",
            description: "Adelantar la canción actual.",
            option: {
                name: "tiempo",
                description: "Introduce el tiempo. (Ej: 2min)",
            },
        },
        setprefix: {
            name: "prefijo",
            description: "Establece el prefijo de Stelle.",
            option: {
                name: "prefijo",
                description: "Introduce el prefijo nuevo.",
            },
        },
        default: {
            name: "defecto",
            description: "Cambia los ajustes por defecto de Stelle.",
            subcommands: {
                engine: {
                    name: "busqueda",
                    description: "Cambia el modo de búsqueda.",
                    option: {
                        name: "tipo",
                        description: "Selecciona el tipo.",
                    },
                },
                volume: {
                    name: "volumen",
                    description: "Cambia el volumen por defecto.",
                },
            },
        },
        shuffle: {
            name: "mezclar",
            description: "Mezcla la cola.",
        },
        nowplaying: {
            name: "sonando",
            description: "Obtén la canción actual.",
        },
        help: {
            name: "ayuda",
            description: "El comando mas útil del mundo!",
            option: {
                name: "comando",
                description: "El comando a obtener ayuda.",
            },
        },
        info: {
            name: "info",
            description: "Obtén la información de la bot o de un usuario.",
            subcommands: {
                bot: {
                    name: "bot",
                    description: "Obtén la información de la bot.",
                },
            },
        },
        join: {
            name: "unir",
            description: "Une el bot a un canal de voz.",
        },
        lyrics: {
            name: "letras",
            description: "Muestra las letras de la canción actual.",
        },
        playlist: {
            name: "playlist",
            description: "Administra tus playlists de música.",
            commands: {
                create: {
                    name: "crear",
                    description: "Crea una nueva playlist de música.",
                    options: {
                        name: {
                            name: "nombre",
                            description: "El nombre de la playlist a crear.",
                        },
                        public: {
                            name: "publica",
                            description: "Si la playlist debe ser pública o privada.",
                        },
                    },
                },
                load: {
                    name: "cargar",
                    description: "Carga una playlist de música.",
                    option: {
                        name: "id",
                        description: "El id de la playlist a cargar.",
                    },
                },
                list: {
                    name: "lista",
                    description: "Muestra las playlists disponibles.",
                    option: {
                        name: "usuario",
                        description: "El usuario del que se mostrarán las playlists públicas.",
                    },
                },
                info: {
                    name: "info",
                    description: "Muestra información sobre una playlist de música.",
                    option: {
                        name: "id",
                        description: "El id de la playlist de la que se mostrará información.",
                    },
                },
                rename: {
                    name: "renombrar",
                    description: "Renombra una playlist de música.",
                    option: {
                        name: "nombre",
                        description: "El nuevo nombre de la playlist.",
                    },
                },
                delete: {
                    name: "eliminar",
                    description: "Elimina una playlist de música.",
                },
                manage: {
                    name: "gestionar",
                    description: "Gestiona una playlist de música.",
                },
            },
        },
        twentyforseven: {
            name: "247",
            description: "Alterna el modo 24/7 para la bot.",
            option: {
                name: "autopause",
                description: "Si se debe auto-pausar el reproductor cuando todos salen del canal de voz.",
            },
        },
    },
} satisfies DefaultLocale;
