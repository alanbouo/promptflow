import { Inngest } from 'inngest';

/**
 * Client Inngest de l'application.
 *
 * La connexion au serveur self-hosted (partagé avec les autres apps,
 * ex. newsroom) est pilotée par les variables d'environnement, lues
 * automatiquement par le SDK :
 *   - INNGEST_DEV=0            -> mode production (utilise les signing keys)
 *   - INNGEST_BASE_URL=...     -> URL du serveur Inngest self-hosted
 *   - INNGEST_EVENT_KEY=...    -> envoi d'événements
 *   - INNGEST_SIGNING_KEY=...  -> signature des requêtes serveur <-> app
 *
 * L'`id` identifie cette application dans le dashboard Inngest partagé.
 */
export const inngest = new Inngest({ id: 'promptflow' });
