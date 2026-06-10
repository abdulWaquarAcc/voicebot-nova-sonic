/**
 * PlayAudioTool - Triggers client-side playback of pre-recorded audio clips.
 * 
 * This tool does NOT play audio on the server. It returns a payload that
 * the client interprets to play a local .mp3 file from public/audio/.
 * 
 * To remove this feature:
 * 1. Delete this file
 * 2. Remove the import and registry.register() line from src/tools/index.ts
 * 3. Remove the playAudio handler block in public/src/main.js (search for "PlayAudio feature")
 * 4. Optionally delete public/audio/ folder
 */
import { Tool } from './Tool';

interface PlayAudioParams {
    clipName: string;
}

export const PlayAudioTool: Tool = {
    name: 'playAudio',
    description: `Play a pre-recorded audio clip on the user's device. Use this tool when you want to play a sound effect, jingle, or background music clip. Available clips should be referenced by name (without file extension). The audio will play on the client while you continue speaking.`,

    inputSchema: {
        type: 'object',
        properties: {
            clipName: {
                type: 'string',
                description: 'Name of the audio clip to play (without .mp3 extension). For example: "auto_horn", "welcome_jingle", "bengaluru_theme"'
            }
        },
        required: ['clipName']
    },

    async execute(params: unknown): Promise<object> {
        const { clipName } = params as PlayAudioParams;

        if (!clipName || typeof clipName !== 'string') {
            return {
                error: true,
                message: 'clipName is required and must be a string'
            };
        }

        // Sanitize the clip name to prevent path traversal
        const sanitized = clipName.replace(/[^a-zA-Z0-9_\-]/g, '');

        return {
            action: 'playAudio',
            clipName: sanitized,
            status: 'triggered',
            message: `Audio clip "${sanitized}" has been triggered for playback on the client.`
        };
    }
};
