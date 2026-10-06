/** WebSocket events arrive in order; their asynchronous database writes must too. */
export function createMessageQueue(onError: (error: unknown) => void) {
    let pending = Promise.resolve();
    return (task: () => Promise<void>) => {
        pending = pending.then(task).catch(onError);
        return pending;
    };
}
