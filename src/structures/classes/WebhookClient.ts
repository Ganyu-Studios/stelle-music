import {
    type APIRoutes,
    ApiHandler,
    Attachment,
    Embed,
    type MessageWebhookMethodEditParams,
    type MessageWebhookMethodWriteParams,
    PollBuilder,
    type RawFile,
    Router,
    resolveAttachment,
    resolveFiles,
} from "seyfert";
import { BaseClient } from "seyfert/lib/client/base.js";
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest, WebhookShorterOptionalParams } from "seyfert/lib/common/index.js";
import type {
    APIMessage,
    APIWebhook,
    RESTAPIAttachment,
    RESTAPIPollCreate,
    RESTDeleteAPIWebhookWithTokenMessageResult,
    RESTGetAPIGuildWebhooksResult,
    RESTPatchAPIWebhookJSONBody,
    RESTPatchAPIWebhookWithTokenJSONBody,
    RESTPatchAPIWebhookWithTokenResult,
    RESTPostAPIWebhookWithTokenJSONBody,
} from "seyfert/lib/types/index.js";
import type { WebhookMetadata } from "#stelle/types";
import { InvalidWebhookURL } from "#stelle/utils/errors.js";
import { parseDiscordWebhook } from "#stelle/utils/functions/utils.js";

/**
 *
 * Transform a message body for sending or editing a webhook message.
 * @param {MessageCreateBodyRequest | MessageUpdateBodyRequest} body The message body to transform.
 * @param {RawFile[] | undefined} files The files to include in the message, if any.
 * @returns {T} The transformed message body.
 */
function transformMessageBody<T>(body: MessageCreateBodyRequest | MessageUpdateBodyRequest, files: RawFile[] | undefined): T {
    const poll: PollBuilder | RESTAPIPollCreate | undefined = (body as MessageCreateBodyRequest).poll;
    const payload = {
        ...body,
        embeds: body.embeds?.map((x) => (x instanceof Embed ? x.toJSON() : x)),
        components: body.components?.map((x) => ("toJSON" in x ? x.toJSON() : x)) ?? undefined,
        poll: poll ? (poll instanceof PollBuilder ? poll.toJSON() : poll) : undefined,
    };

    if ("attachments" in body) {
        payload.attachments =
            body.attachments?.map((x, i): RESTAPIAttachment => {
                if (x instanceof Attachment) {
                    return {
                        id: x.id ?? i.toString(),
                        title: x.title,
                        description: x.description,
                        filename: x.filename,
                    };
                }
                return {
                    id: i.toString(),
                    ...resolveAttachment(x),
                };
            }) ?? undefined;
    } else if (files?.length) {
        payload.attachments = files?.map(
            ({ filename }, i): RESTAPIAttachment => ({
                id: i.toString(),
                filename,
            }),
        );
    }
    return payload as T;
}

/**
 *
 * Set the proxy for the webhook client.
 * @param {WebhookClient} client The webhook client to set the proxy for.
 * @returns {Promise<void>} A Promise that resolves when the proxy is set.
 */
async function setProxy(client: WebhookClient): Promise<void> {
    const token: string = await BaseClient.prototype.getRC().then((rc): string => rc.token);
    const router: Router = new Router(new ApiHandler({ token }));

    client.proxy = router.createProxy();
}

/**
 * The options for fetching a webhook message.
 */
interface GetWebhookMessageOptions {
    /**
     * The id of the message to fetch.
     * @type {string}
     */
    messageId: string;
    /**
     * The id of the thread the message is in, if applicable.
     * @type {string | undefined}
     */
    threadId?: string;
}

/**
 * Class representating a webhook client.
 * @class WebhookClient
 */
export class WebhookClient {
    /**
     * The webhook's metadata.
     * @type {WebhookMetadata}
     */
    readonly data: WebhookMetadata;
    /**
     * The proxy for making API calls.
     * @type {APIRoutes}
     */
    public proxy!: APIRoutes;

    /**
     *
     * Create a new webhook client.
     * @param {string | WebhookMetadata} data The webhook URL or metadata to initialize the client with.
     */
    public constructor(data: string | WebhookMetadata) {
        if (typeof data === "string") {
            const parsed: WebhookMetadata | null = parseDiscordWebhook(data);
            if (!parsed) throw new InvalidWebhookURL("The provided string is not a valid Discord webhook URL.");
            this.data = parsed;
        } else {
            this.data = data;
        }

        setProxy(this);
    }

    /**
     *
     * Send a message using the webhook.
     * @param {MessageWebhookMethodWriteParams} data The message data.
     * @returns {Promise<APIMessage | undefined>} The sent message, or undefined if the message failed to send.
     */
    public async writeMessage(data: MessageWebhookMethodWriteParams): Promise<APIMessage | undefined> {
        const { files, ...body } = data.body;

        const transformedFiles: RawFile[] | undefined = files ? await resolveFiles(files) : undefined;
        const transformedBody: RESTPostAPIWebhookWithTokenJSONBody = transformMessageBody<RESTPostAPIWebhookWithTokenJSONBody>(
            body,
            transformedFiles,
        );

        return this.proxy
            .webhooks(this.data.id)(this.data.token)
            .post({
                ...data,
                files: transformedFiles,
                body: transformedBody,
            });
    }

    /**
     *
     * Edit a message using the webhook.
     * @param {MessageWebhookMethodEditParams} data The message data.
     * @returns {Promise<APIMessage>} The edited message.
     */
    public async editMessage(data: MessageWebhookMethodEditParams): Promise<APIMessage> {
        const { files, ...body } = data.body;

        const transformedFiles: RawFile[] | undefined = files ? await resolveFiles(files) : undefined;
        const transformedBody: RESTPostAPIWebhookWithTokenJSONBody = transformMessageBody<RESTPostAPIWebhookWithTokenJSONBody>(
            body,
            transformedFiles,
        );

        return this.proxy
            .webhooks(this.data.id)(this.data.token)
            .messages(data.messageId)
            .patch({
                ...data,
                files: transformedFiles,
                body: transformedBody,
            });
    }

    /**
     *
     * Delete a message using the webhook.
     * @param {string} messageId The id of the message to delete.
     * @param {string} [reason] The reason for deleting the message. This will be shown in the audit log.
     * @returns {Promise<RESTDeleteAPIWebhookWithTokenMessageResult>} The result of the delete operation.
     */
    public deleteMessage(messageId: string, reason?: string): Promise<RESTDeleteAPIWebhookWithTokenMessageResult> {
        return this.proxy.webhooks(this.data.id)(this.data.token).messages(messageId).delete({ reason });
    }

    /**
     *
     * Fetch a message using the webhook.
     * @param {GetWebhookMessageOptions} options The options for fetching the message.
     * @returns {Promise<APIMessage>} The fetched message.
     */
    public fetchMessage(options: GetWebhookMessageOptions): Promise<APIMessage> {
        const { messageId, threadId } = options;

        return this.proxy
            .webhooks(this.data.id)(this.data.token)
            .messages(messageId)
            .get({
                query: threadId ? { thread_id: threadId } : undefined,
            });
    }

    /**
     *
     * Edit the webhook's properties.
     * @param {RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody} body The new properties for the webhook.
     * @param {WebhookShorterOptionalParams} options The options for editing the webhook.
     * @returns {Promise<RESTPatchAPIWebhookWithTokenResult>} The edited webhook.
     */
    public edit(
        body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody,
        options: WebhookShorterOptionalParams,
    ): Promise<RESTPatchAPIWebhookWithTokenResult> {
        if (options.token) return this.proxy.webhooks(this.data.id)(options.token).patch({ body, reason: options.reason, auth: false });

        return this.proxy.webhooks(this.data.id)(this.data.token).patch({ body, reason: options.reason });
    }

    /**
     *
     * Fetch the webhook.
     * @param {string} [token] The token to use for fetching the webhook.
     * @returns {Promise<APIWebhook>} The fetched webhook.
     */
    public fetch(token?: string): Promise<APIWebhook> {
        if (token) return this.proxy.webhooks(this.data.id)(token).get({ auth: false });

        return this.proxy.webhooks(this.data.id).get();
    }

    /**
     * Deletes a webhook.
     * @param options The optional parameters including token and reason.
     * @returns {Promise<void>} A Promise that resolves when the webhook is deleted.
     */
    public delete(options: WebhookShorterOptionalParams): Promise<void> {
        if (options.token) return this.proxy.webhooks(this.data.id)(options.token).delete({ reason: options.reason, auth: false });
        return this.proxy.webhooks(this.data.id).delete({ reason: options.reason });
    }

    /**
     *
     * List the webhooks for a guild.
     * @param {string} guildId The id of the guild to list the webhooks for.
     * @returns {Promise<RESTGetAPIGuildWebhooksResult>} The list of webhooks for the guild.
     */
    public listFromGuild(guildId: string): Promise<RESTGetAPIGuildWebhooksResult> {
        return this.proxy.guilds(guildId).webhooks.get();
    }

    /**
     *
     * List the webhooks for a channel.
     * @param {string} channelId The id of the channel to list the webhooks for.
     * @returns {Promise<RESTGetAPIGuildWebhooksResult>} The list of webhooks for the channel.
     */
    public listFromChannel(channelId: string): Promise<RESTGetAPIGuildWebhooksResult> {
        return this.proxy.channels(channelId).webhooks.get();
    }
}
