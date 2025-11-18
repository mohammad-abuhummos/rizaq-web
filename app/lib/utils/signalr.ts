import * as signalR from '@microsoft/signalr';

/**
 * Creates a SignalR connection for real-time chat functionality
 * @param hubUrl - The SignalR hub URL (e.g., '/chatHub')
 * @param accessToken - Optional access token for authentication
 * @returns SignalR HubConnection instance
 */
export function createSignalRConnection(hubUrl: string, accessToken?: string) {
    const options: signalR.IHttpConnectionOptions = {};
    
    if (accessToken) {
        options.accessTokenFactory = () => accessToken;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, options)
        .withAutomaticReconnect()
        .build();

    return connection;
}

/**
 * Starts a SignalR connection with error handling
 * @param connection - The SignalR HubConnection instance
 */
export async function startConnection(connection: signalR.HubConnection): Promise<void> {
    try {
        await connection.start();
        console.log('SignalR connection established');
    } catch (error) {
        console.error('Error starting SignalR connection:', error);
        throw error;
    }
}

/**
 * Stops a SignalR connection
 * @param connection - The SignalR HubConnection instance
 */
export async function stopConnection(connection: signalR.HubConnection): Promise<void> {
    try {
        await connection.stop();
        console.log('SignalR connection stopped');
    } catch (error) {
        console.error('Error stopping SignalR connection:', error);
    }
}

