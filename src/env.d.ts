/// <reference types="astro/client" />

declare namespace NodeJS {
    interface Global {
        firousCommitPromise: Promise<any> | undefined;
    }
}

// Depending on the execution environment, you might need one of the following as well.
// For browser environments
interface Window {
    firousCommitPromise: Promise<any> | undefined;
}

// For a more universal approach, directly augmenting globalThis if your TS config supports it.
declare global {
    var firousCommitPromise: Promise<any> | undefined;
}
