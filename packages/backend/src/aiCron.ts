import { SDK } from "caido:plugin";
import { getOrCreateAIConfig, getProject, initDatabase, sendAIMessage } from "./utils";
import { AIConfig, Finding, UserPrompt } from "./types";

const TEMPLATE_KEYS = ['sink', 'href', 'frame', 'data', 'trace', 'type', 'tag', 'alert', 'date', 'dupKey', 'debug'];

const quickUpdateFindingAIScore = async (db: any, tableName: string, findingId: number, aiScore: string) => {
    const updateStatement = await db.prepare(`UPDATE ${tableName} SET aiScore = ?, promptId = "" WHERE id = ?`);
    await updateStatement.run(aiScore, findingId);
}

export const initAICron = async (sdk: SDK) => {
    const db = await initDatabase(sdk);

    setInterval(async () => {
        sdk.console.log("Running AI cron...");
        const aiConfig = await getOrCreateAIConfig(sdk) as AIConfig;
        const { tableName } = await getProject(sdk);

        sdk.console.log(`Getting findings from ${tableName}...`);
        const statement = await db.prepare(`SELECT * FROM ${tableName} WHERE aiScore = "In queue"`);
        const findings = await statement.all() as Finding[];

        // Update all retrieved findings to "In progress" immediately
        if (findings.length > 0) {
            const findingIds = findings.map(f => f.id).filter(id => id !== undefined);
            if (findingIds.length > 0) {
                const placeholders = findingIds.map(() => '?').join(',');
                const updateStatement = await db.prepare(`UPDATE ${tableName} SET aiScore = "In progress" WHERE id IN (${placeholders})`);
                await updateStatement.run(...findingIds);
            }
        }

        sdk.console.log(`Found ${findings.length} findings to process.`);
        for (const finding of findings) {
            if (!finding.promptId) {
                sdk.console.log(`No prompt ID found for finding ${finding.id}`);
                await quickUpdateFindingAIScore(db, tableName, finding.id || 0, "");
                continue;
            }

            const statement = await db.prepare('SELECT * FROM user_prompts WHERE id = ?')
            const user_prompt = await statement.get(finding.promptId) as UserPrompt;
            if (!user_prompt) {
                sdk.console.log(`User prompt not found for finding ${finding.id}`);
                await quickUpdateFindingAIScore(db, tableName, finding.id || 0, "");
                continue;
            }

            if (!user_prompt.enabled) {
                sdk.console.log(`User prompt ${user_prompt.name} is not enabled for finding ${finding.id}`);
                await quickUpdateFindingAIScore(db, tableName, finding.id || 0, "");
                continue;
            }

            var user_message = user_prompt.prompt;
            for (const key of TEMPLATE_KEYS) {
                user_message = user_message.replaceAll(`{${key}}`, (finding as any)[key] || "");
            }

            sdk.console.log(`Sending AI message for finding ${finding.id}...`);
            const result = await sendAIMessage(sdk, aiConfig.openrouter_api_key, aiConfig.selected_model, aiConfig.system_prompt, user_message, aiConfig.temperature);

            let aiScore = "";
            if (!result.success) {
                sdk.console.log(`Failed to send AI message for finding ${finding.id}`);
                await quickUpdateFindingAIScore(db, tableName, finding.id || 0, "");
                continue;
            } else {
                sdk.console.log(`AI response for finding ${finding.id}: ${result.response}`);
                try {
                    aiScore = `${JSON.parse(result.response || "").score || ""}`;
                } catch (error) {
                    sdk.console.log(`Failed to parse AI response for finding ${finding.id}`);
                }
            }

            sdk.console.log(`Updating AI score for finding ${finding.id}: ${aiScore}`);
            await quickUpdateFindingAIScore(db, tableName, finding.id || 0, aiScore);
        }
    }, 1000*30); // 30 seconds
}